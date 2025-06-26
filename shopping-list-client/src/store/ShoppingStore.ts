import { makeAutoObservable } from 'mobx';

export interface Category {
    id: string;
    name: string;
}

export interface Product {
    name: string;
    category: Category;
    quantity: number;
}

class ShoppingStore {
    products: Product[] = [];
    categories: Category[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    addProduct(productName: string, category: Category) {
        const existingProduct = this.products.find(
            (p) => p.name === productName && p.category.id === category.id
        );
        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            this.products.push({ name: productName, category, quantity: 1 });
        }
    }

    setCategories(categories: Category[]) {
        this.categories = categories;
    }

    clearCart() {
        this.products = [];
    }

    removeProduct(productName: string, categoryId: string) {
        this.products = this.products.filter(
            (p) => !(p.name === productName && p.category.id === categoryId)
        );
    }

    get totalItemsCount(): number {
        return this.products.reduce((total, product) => total + product.quantity, 0);
    }
}

export const shoppingStore = new ShoppingStore();