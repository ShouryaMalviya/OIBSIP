import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#001F3F',
                color: '#F6F7ED',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '600',
                padding: '12px 18px',
                boxShadow: '0 10px 25px -5px rgba(0, 31, 63, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#74C365',
                  secondary: '#001F3F',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
