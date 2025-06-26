import 'reflect-metadata';
import * as dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Category } from './entity/Category';
import { ShoppingItem } from './entity/ShoppingItem';
import { checkProductCategory } from './AI';
import { Request, Response, NextFunction } from 'express';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

const port = process.env.PORT || 5000;

let dataSourceOptions: DataSourceOptions;

if (isProduction) {
    dataSourceOptions = {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Category, ShoppingItem],
        synchronize: true,
        logging: false,
        ssl: { rejectUnauthorized: false },
    };
} else {
    dataSourceOptions = {
        type: 'sqlite',
        database: 'shopping-list.sqlite',
        entities: [Category, ShoppingItem],
        synchronize: true,
        logging: true,
    };
}

const AppDataSource = new DataSource(dataSourceOptions);

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
    const clientOriginUrl = process.env.CLIENT_ORIGIN_URL;
    const localhostOrigin = 'http://localhost:3000';

    const origin = req.headers.origin;

    if (origin) {
        if (origin === localhostOrigin) {
            res.setHeader('Access-Control-Allow-Origin', localhostOrigin);
        } else if (clientOriginUrl && origin === clientOriginUrl) {
            res.setHeader('Access-Control-Allow-Origin', clientOriginUrl);
        } else {
            console.warn(`Origin '${origin}' not allowed by CORS policy. Blocking request.`);
        }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.get('/', (req: Request, res: Response) => {
    res.send('שלום מהשרת של רשימת הקניות! (גרסה גמישה)');
});

app.get('/categories', async (req: Request, res: Response) => {
    try {
        const categoryRepository = AppDataSource.getRepository(Category);
        const categories = await categoryRepository.find();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to fetch categories', error: 'An unknown error occurred' });
        }
    }
});

app.get('/check', async (req: Request, res: Response) => {
    let productName = req.query.productName;
    let selectedCategoryId = req.query.selectedCategoryId;
    console.log({ productName }, { selectedCategoryId });

    if (typeof productName !== 'string' || typeof selectedCategoryId !== 'string') {
        return res.status(400).json({ error: 'שם המוצר ו-ID הקטגוריה חייבים להיות מחרוזות חוקיות.' });
    }
    let isMatch = await checkProductCategory(productName, selectedCategoryId); 
    res.json({ isMatch: isMatch });
});

app.post('/orders', async (req: Request, res: Response) => {
    try {
        const shoppingItemRepository = AppDataSource.getRepository(ShoppingItem);
        const categoryRepository = AppDataSource.getRepository(Category);

        const cartItems: { name: string; categoryId: string; quantity: number }[] = req.body.items;
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: 'No items in cart to save.' });
        }

        const orderId = `order_${Date.now()}`;

        const itemsToSave = [];
        for (const item of cartItems) {
            const category = await categoryRepository.findOne({ where: { id: parseInt(item.categoryId) } });

            if (!category) {
                console.warn(`Category with ID ${item.categoryId} not found. Skipping item: ${item.name}`);
                continue;
            }

            const newItem = new ShoppingItem();
            newItem.name = item.name;
            newItem.quantity = item.quantity;
            newItem.category = category;
            newItem.createdAt = new Date();
            newItem.orderId = orderId;

            itemsToSave.push(newItem);
        }

        if (itemsToSave.length === 0) {
            return res.status(400).json({ message: 'No valid items to save after category check.' });
        }

        await shoppingItemRepository.save(itemsToSave);
        console.log(`Order ${orderId} saved successfully with ${itemsToSave.length} items.`);
        res.status(201).json({ message: 'Order saved successfully!', orderId: orderId, savedItemsCount: itemsToSave.length });

    } catch (error) {
        console.error('Error saving order:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: 'Failed to save order', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to save order', error: 'An unknown error occurred' });
        }
    }
});

app.get('/order-history', async (req: Request, res: Response) => {
    try {
        const shoppingItemRepository = AppDataSource.getRepository(ShoppingItem);

        const historyItems = await shoppingItemRepository.find({
            relations: ['category'],
            order: {
                createdAt: 'DESC',
                orderId: 'DESC',
                name: 'ASC'
            }
        });

        const groupedOrders: { [orderId: string]: any[] } = {};
        historyItems.forEach(item => {
            if (!groupedOrders[item.orderId]) {
                groupedOrders[item.orderId] = [];
            }
            groupedOrders[item.orderId].push({
                name: item.name,
                quantity: item.quantity,
                category: { id: item.category.id.toString(), name: item.category.name }, 
                createdAt: item.createdAt
            });
        });

        const formattedHistory = Object.keys(groupedOrders).map(orderId => ({
            orderId: orderId,
            createdAt: groupedOrders[orderId][0]?.createdAt, 
            items: groupedOrders[orderId]
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 

        res.json(formattedHistory);

    } catch (error) {
        console.error('Error fetching order history:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: 'Failed to fetch order history', error: error.message });
        } else {
            res.status(500).json({ message: 'Failed to fetch order history', error: 'An unknown error occurred' });
        }
    }
});


AppDataSource.initialize()
    .then(async () => {
        console.log('Data Source has been initialized!');

        const categoryRepository = AppDataSource.getRepository(Category);
        const categoriesCount = await categoryRepository.count();

        if (categoriesCount === 0) {
            console.log('Inserting initial categories...');
            const initialCategories = [
                { name: 'מוצרי ניקיון' },
                { name: 'גבינות' },
                { name: 'ירקות ופירות' },
                { name: 'בשר ודגים' },
                { name: 'מאפים' },
            ];
            await categoryRepository.save(initialCategories);
            console.log('Initial categories inserted.');
        } else {
            console.log('Categories already exist in DB.');
        }

        app.listen(port, () => {
            console.log(`Server is running on port ${port} in ${isProduction ? 'production' : 'development'} mode`);
        });
    })
    .catch((err) => {
        console.error('Error during Data Source initialization:', err);
        if (err instanceof Error) {
            console.error('Error details:', err.message);
        }
    });

export { app, AppDataSource };
