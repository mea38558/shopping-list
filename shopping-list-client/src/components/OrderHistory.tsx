import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Paper,
    Divider,
    CircularProgress,
    Alert,
} from '@mui/material';
import moment from 'moment';

interface Order {
    orderId: string;
    createdAt: string;
    items: Array<{
        name: string;
        quantity: number;
        category: { id: string; name: string };
    }>;
}

const OrderHistory = observer(() => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrderHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const serverApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            if (!serverApiUrl) {
                throw new Error("API URL is not configured. Cannot fetch order history.");
            }

            const response = await fetch(`${serverApiUrl}/order-history`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            }
            const data: Order[] = await response.json();
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch order history:', err);
            if (err instanceof Error) {
                setError(`שגיאה בטעינת היסטוריית הזמנות: ${err.message}`);
            } else {
                setError('שגיאה לא ידועה בטעינת היסטוריית הזמנות.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderHistory();
    }, []);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>טוען היסטוריית הזמנות...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 4 }}>
                {error}
            </Alert>
        );
    }

    if (orders.length === 0) {
        return (
            <Typography variant="body1" sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
                עדיין אין היסטוריית הזמנות.
            </Typography>
        );
    }

    return (
        <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom align="center">
                היסטוריית הזמנות
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
                כל ההזמנות הקודמות שלך:
            </Typography>

            {orders.map((order) => (
                <Paper key={order.orderId} elevation={3} sx={{ p: 2, mb: 3 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: { xs: 'center', sm: 'space-between' },
                            alignItems: 'center',
                            mb: 1,
                            textAlign: { xs: 'center', sm: 'center' }
                        }}
                    >

                        <Typography variant="h6" component="h3" sx={{ color: 'primary.main', mr: { xs: 0, sm: 2 } }}>
                            הזמנה #{order.orderId.substring(order.orderId.indexOf('_') + 1)}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
                            {moment(order.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    {(() => {
                        const groupedByCategory = new Map<string, typeof order.items>();

                        order.items.forEach((item) => {
                            const categoryName = item.category.name;
                            if (!groupedByCategory.has(categoryName)) {
                                groupedByCategory.set(categoryName, []);
                            }
                            groupedByCategory.get(categoryName)!.push(item);
                        });

                        return Array.from(groupedByCategory.entries()).map(([categoryName, items]) => (
                            <Box key={categoryName} sx={{ mb: 2 }}>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: 'bold',
                                        mt: 2,
                                        mb: 1,
                                        color: 'primary.dark',
                                        textAlign: 'center',
                                    }}
                                >
                                    {categoryName}:
                                </Typography>

                                <List dense sx={{ textAlign: 'right', pr: 2 }}>
                                    {items.map((item, index) => (
                                        <ListItem key={index} sx={{ py: 0.5 }}>
                                            <ListItemText
                                                primary={`• ${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`}
                                                primaryTypographyProps={{ sx: { textAlign: 'center' } }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        ));
                    })()}

                </Paper>
            ))}
        </Box>
    );
});

export default OrderHistory;