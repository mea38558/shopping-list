import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';
import { shoppingStore } from '../store/ShoppingStore';
import CircularProgress from '@mui/material/CircularProgress';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const FinishOrderButton = observer(() => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info');
  const [isLoading, setIsLoading] = useState(false);

  const showSnackbar = (message: string, severity: AlertColor = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFinishOrder = async () => {
    if (shoppingStore.products.length === 0) {
      showSnackbar('סל הקניות ריק, לא ניתן לסיים הזמנה.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const itemsToSend = shoppingStore.products.map(product => ({
        name: product.name,
        categoryId: product.category.id,
        quantity: product.quantity
      }));

      const serverApiUrl = process.env.REACT_APP_API_URL;
      if (!serverApiUrl) {
        showSnackbar('API URL לא מוגדר בקובץ הסביבה.', 'error');
        return;
      }

      const response = await fetch(`${serverApiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה מהשרת');
      }

      const result = await response.json();
      showSnackbar(`הזמנה נשמרה בהצלחה! מספר הזמנה: ${result.orderId}`, 'success');
      shoppingStore.clearCart();
    } catch (error) {
      if (error instanceof Error) {
        showSnackbar(`שגיאה: ${error.message}`, 'error');
      } else {
        showSnackbar('אירעה שגיאה לא צפויה.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteOrder = () => {
    if (shoppingStore.products.length === 0) {
      showSnackbar('סל הקניות כבר ריק.', 'info');
      return;
    }
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל הפריטים מסל הקניות?')) {
      shoppingStore.clearCart();
      showSnackbar('סל הקניות נוקה בהצלחה.', 'success');
    }
  };

  return (
    <>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleFinishOrder}
          disabled={shoppingStore.totalItemsCount === 0 || isLoading}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'סיים הזמנה'}
        </Button>

        <Button
          variant="outlined"
          color="error"
          size="large"
          onClick={handleDeleteOrder}
          disabled={shoppingStore.totalItemsCount === 0 || isLoading}
        >
          מחק הזמנה
        </Button>
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
});

export default FinishOrderButton;
