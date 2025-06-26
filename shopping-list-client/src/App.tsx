import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { observer } from 'mobx-react-lite';
import { shoppingStore, Category } from './store/ShoppingStore';

import ProductInput from './components/ProductInput';
import ProductList from './components/ProductList';
import FinishOrderButton from './components/FinishOrderButton';
import OrderHistory from './components/OrderHistory';

interface AppProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const App: React.FC<AppProps> = observer(({ toggleTheme, isDarkMode }) => {
  const [showOrderHistory, setShowOrderHistory] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const serverApiUrl = process.env.REACT_APP_API_URL;
        if (!serverApiUrl) {
          console.error("REACT_APP_API_URL is not defined! Please set this environment variable.");
          alert("API URL is not configured. Categories cannot be loaded.");
          return;
        }

        const response = await fetch(`${serverApiUrl}/categories`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: { id: number; name: string }[] = await response.json();

        const categoriesForClient: Category[] = data.map(cat => ({
          id: String(cat.id),
          name: cat.name
        }));

        shoppingStore.setCategories(categoriesForClient);
        console.log('Categories loaded from server:', categoriesForClient);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        const fallbackCategories: Category[] = [
          { id: '1', name: 'מוצרי ניקיון' },
          { id: '2', name: 'גבינות' },
          { id: '3', name: 'ירקות ופירות' },
          { id: '4', name: 'בשר ודגים' },
          { id: '5', name: 'מאפים' },
        ];
        shoppingStore.setCategories(fallbackCategories);
        alert('שגיאה בטעינת קטגוריות מהשרת. נטענו קטגוריות ברירת מחדל.');
      }
    };

    fetchCategories();
  }, []);

  return (
    <React.Fragment>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            רשימת קניות 🛒
          </Typography>

          <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 2 }}>
            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {shoppingStore.totalItemsCount > 0 ? (
              <Typography variant="subtitle1">
                סה"כ: {shoppingStore.totalItemsCount} מוצרים בסל
              </Typography>
            ) : (
              <Typography variant="subtitle1">
                הסל שלך עדיין ריק
              </Typography>
            )}
            <Button
              color="inherit"
              onClick={() => setShowOrderHistory(!showOrderHistory)}
            >
              {showOrderHistory ? 'חזור לרשימת קניות' : 'היסטוריית הזמנות'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" align="center" component="h1" gutterBottom>
          {showOrderHistory ? 'היסטוריית הזמנות' : 'ברוכים הבאים לרשימת הקניות שלך !'}
        </Typography>

        {showOrderHistory ? (
          <OrderHistory />
        ) : (
          <React.Fragment>
            <ProductInput />
            <ProductList />
            <FinishOrderButton />
          </React.Fragment>
        )}
      </Container>
    </React.Fragment>
  );
});

export default App;

