import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme/theme';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

const getInitialDarkMode = (): boolean => {
  const saved = localStorage.getItem('darkMode');
  return saved === 'true';
};

const Root = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  };

  return (
    <Box sx={{
      transition: 'background-color 0.3s ease, color 0.3s ease'
      , direction: 'rtl'
    }}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <App toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      </ThemeProvider>
    </Box>

  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Root />);
