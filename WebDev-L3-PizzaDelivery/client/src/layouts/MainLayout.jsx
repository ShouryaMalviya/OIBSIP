import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/cart/CartDrawer';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7ED] text-[#001F3F]">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default MainLayout;
