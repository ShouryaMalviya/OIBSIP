import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';

// Customer Pages
import Home from '../pages/Home';
import Menu from '../pages/Menu';
import Builder from '../pages/Builder';
import Cart from '../pages/Cart';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Profile from '../pages/Profile';
import Checkout from '../pages/Checkout';
import OrderConfirmation from '../pages/OrderConfirmation';
import Orders from '../pages/Orders';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';

// Admin Pages (Part 4)
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminInventory from '../pages/admin/AdminInventory';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminAdjustments from '../pages/admin/AdminAdjustments';
import AdminAlerts from '../pages/admin/AdminAlerts';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ======================================================== */}
      {/* 1. SEPARATE ADMIN ROUTES (Part 4) */}
      {/* ======================================================== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <AdminLayout>
            <AdminInventory />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminLayout>
            <AdminOrders />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/adjustments"
        element={
          <AdminLayout>
            <AdminAdjustments />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/alerts"
        element={
          <AdminLayout>
            <AdminAlerts />
          </AdminLayout>
        }
      />

      {/* ======================================================== */}
      {/* 2. CUSTOMER STOREFRONT ROUTES (Wrapped in MainLayout) */}
      {/* ======================================================== */}
      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/menu" element={<MainLayout><Menu /></MainLayout>} />
      <Route path="/builder" element={<MainLayout><Builder /></MainLayout>} />
      <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
      <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
      <Route path="/order-confirmation/:orderId" element={<MainLayout><OrderConfirmation /></MainLayout>} />
      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/orders" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
      <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
      <Route path="/verify-email" element={<MainLayout><VerifyEmail /></MainLayout>} />
      <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
      <Route path="/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
      <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />

      {/* 404 Catch-All */}
      <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
    </Routes>
  );
};

export default AppRoutes;
