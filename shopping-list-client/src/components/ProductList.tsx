import React from 'react';
import { observer } from 'mobx-react-lite';
import { shoppingStore } from '../store/ShoppingStore';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper,
    Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductList = observer(() => {
    if (shoppingStore.categories.length === 0 || shoppingStore.products.length === 0) {
        return (
            <Typography
                variant="body1"
                sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}
            >
                עדיין אין מוצרים בסל הקניות.
            </Typography>
        );
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" align="center" gutterBottom>
                רשימת הקניות שלך
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
                יש לאסוף מוצרים אלו במחלקות המתאימות:
            </Typography>

            <Box
                sx={{
                    maxWidth: 600,
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {shoppingStore.categories.map((category) => {
                    const productsInCategory = shoppingStore.products.filter(
                        (p) => p.category.id === category.id
                    );

                    if (productsInCategory.length === 0) return null;

                    const totalInCategory = productsInCategory.reduce(
                        (sum, p) => sum + p.quantity,
                        0
                    );

                    return (
                        <Paper key={category.id} elevation={3} sx={{ p: 2 }}>
                            <Typography align="center" variant="h6" component="h3" sx={{ mb: 1 }}>
                                {category.name} – {productsInCategory.length} מוצרים (סה״כ {totalInCategory})
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <List dense>
                                {productsInCategory.map((product) => (
                                    <ListItem
                                        key={`${product.name}-${product.category.id}`}
                                        sx={{
                                            direction: 'rtl',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <ListItemText
                                            sx={{ textAlign: 'right', flex: 1 }}
                                            primary={`${product.name}${product.quantity > 1 ? ` (${product.quantity})` : ''}`}
                                        />

                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() =>
                                                shoppingStore.removeProduct(product.name, category.id)
                                            }
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItem>
                                ))}
                            </List>

                        </Paper>
                    );
                })
                }
            </Box>
        </Box>
    );
});

export default ProductList;
