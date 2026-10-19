import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  History,
  BellRing,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  Pizza,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const AdminLayout = ({ children }) => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Guard: if not authenticated or not admin, redirect to admin login
  if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
    navigate('/admin/login', { replace: true, state: { from: location.pathname } });
    return null;
  }

  const handleAdminLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Inventory Ledger', path: '/admin/inventory', icon: Boxes },
    { label: 'Order Fulfillment', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Stock Audit Logs', path: '/admin/adjustments', icon: History },
    { label: 'Low-Stock Alerts', path: '/admin/alerts', icon: BellRing },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7ED] flex text-slate-800">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Midnight Mirage Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#001F3F] text-[#F6F7ED] border-r border-white/10 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          
          {/* Header Brand */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#00804C] flex items-center justify-center text-[#DBE64C] shadow-md">
                <Pizza className="w-6 h-6 transform -rotate-12" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight font-display text-white">
                  PIZZA<span className="text-[#DBE64C]">VERSE</span>
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-[#74C365] font-black">
                  Admin Control HQ
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/70 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
              Operations Management
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#DBE64C] text-[#001F3F] shadow-md font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#001F3F]' : 'text-[#74C365]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Administrator Profile & Logout */}
          <div className="p-4 border-t border-white/10 space-y-3 bg-black/20">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-xl bg-[#00804C] text-[#DBE64C] flex items-center justify-center font-black text-sm shadow-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <span className="text-[10px] font-semibold text-[#74C365] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Master Admin
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/"
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                title="View customer storefront"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Store</span>
              </Link>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        
        {/* Top Operational Bar */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-[#001F3F] p-2 rounded-xl border border-slate-200"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Badge variant="bookGreen" size="sm">Admin Portal</Badge>
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                Live Kitchen & Inventory Synchronized
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/menu"
              className="text-xs font-bold text-[#00804C] hover:underline flex items-center gap-1 bg-[#F6F7ED] px-3 py-1.5 rounded-full border border-slate-200"
            >
              <Pizza className="w-3.5 h-3.5" />
              <span>Customer Menu</span>
            </Link>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;
