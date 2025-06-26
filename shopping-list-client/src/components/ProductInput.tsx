import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { shoppingStore } from '../store/ShoppingStore';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor, AlertProps } from '@mui/material/Alert';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ProductInput = observer(() => {
  const [productName, setProductName] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info');

  const showSnackbar = (message: string, severity: AlertColor = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleAddProduct = async () => {
    if (productName.trim() === '' || selectedCategoryId === '') {
      showSnackbar('אנא הזן שם מוצר ובחר קטגוריה.', 'warning');
      return;
    }
    const serverApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    if (!serverApiUrl) {
      throw new Error("API URL is not configured. Cannot fetch order history.");
    }

    try {
      const response = await fetch(
        `${serverApiUrl}/check?productName=${productName}&selectedCategoryId=${selectedCategoryId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const ans: { isMatch: Boolean } = await response.json();
      if (!ans.isMatch) {
        showSnackbar('המוצר לא שייך לקטגוריה.', 'error');
        return;
      }

      const category = shoppingStore.categories.find(
        (cat) => cat.id === selectedCategoryId
      );

      if (category) {
        shoppingStore.addProduct(productName.trim(), category);
        setProductName('');
        showSnackbar('המוצר נוסף בהצלחה!', 'success');
      } else {
        showSnackbar('שגיאה: קטגוריה לא נמצאה.', 'error');
      }
    } catch (error) {
      console.error('שגיאה בבדיקת קטגוריה:', error);
      showSnackbar('אירעה שגיאה בתקשורת עם השרת.', 'error');
    }
  };

  const handleProductNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProductName(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategoryId(event.target.value);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
          alignItems: 'center',
          direction: 'rtl'
        }}
      >


        <FormControl sx={{ minWidth: 200, width: { xs: '100%', sm: 'auto' } }} >
          <InputLabel id="category-select-label">קטגוריה</InputLabel>
          <Select
            labelId="category-select-label"
            value={selectedCategoryId}
            label="קטגוריה"
            onChange={handleCategoryChange}
            dir="rtl"
            sx={{ textAlign: 'center' }}
          >
            {shoppingStore.categories.map((category) => (
              <MenuItem
                key={category.id}
                value={category.id}
                dir="rtl"
                sx={{
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
              >
                {category.name}
              </MenuItem>

            ))}
          </Select>
        </FormControl>
        <TextField
          label="שם מוצר"
          variant="outlined"
          value={productName}
          onChange={handleProductNameChange}
          fullWidth
          dir="rtl"
        />

        <Button
          variant="contained"
          onClick={handleAddProduct}
          sx={{
            height: { xs: 'auto', sm: '56px' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          הוסף
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

export default ProductInput;
