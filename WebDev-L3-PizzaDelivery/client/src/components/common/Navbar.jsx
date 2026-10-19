import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Pizza,
  Menu as MenuIcon,
  X,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemsCount, openDrawer } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Artisanal Menu', path: '/menu' },
    { label: 'Custom Builder', path: '/builder' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#001F3F] text-[#F6F7ED] border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-[#00804C] flex items-center justify-center text-[#DBE64C] shadow-md group-hover:scale-105 transition-transform duration-200">
              <Pizza className="w-6 h-6 transform -rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight font-display flex items-center">
                PIZZA<span className="text-[#DBE64C] ml-0.5">VERSE</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#74C365] font-semibold -mt-1">
                Artisanal Wood-Fired
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white/15 text-[#DBE64C] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Right Actions: Cart & Auth */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Interactive Cart Button */}
            <button
              onClick={openDrawer}
              className="relative flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 rounded-full text-sm font-semibold text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DBE64C]"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#DBE64C]" />
              <span>Cart</span>
              {itemsCount > 0 && (
                <span className="bg-[#00804C] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {itemsCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2 rounded-full text-sm font-semibold text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DBE64C]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#00804C] text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  {user?.role === 'admin' ? (
                    <Badge variant="spring" size="xs">Admin</Badge>
                  ) : null}
                  <ChevronDown className="w-4 h-4 text-white/70" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-[#001F3F] shadow-2xl border border-slate-100 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-[#001F3F] truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={user?.role === 'admin' ? 'spring' : 'mantis'} size="xs">
                            {user?.role === 'admin' ? 'Administrator' : 'Verified Member'}
                          </Badge>
                          {user?.isEmailVerified && (
                            <span className="text-[10px] text-emerald-600 font-bold">✓ Email Verified</span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#00804C] transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>My Account Profile</span>
                        </Link>
                        <Link
                          to="/cart"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#00804C] transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span>My Cart ({itemsCount})</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Button
                  variant="outlineWhite"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => navigate('/register')}
                  icon={Sparkles}
                >
                  Join PizzaVerse
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Right Bar: Cart Icon & Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={openDrawer}
              className="relative p-2 rounded-xl text-white hover:bg-white/10 focus:outline-none"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-6 h-6 text-[#DBE64C]" />
              {itemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#00804C] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#001F3F] border-b border-white/15 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-base font-semibold text-white/90 hover:text-white hover:bg-white/10 flex items-center justify-between"
              >
                <span>{link.label}</span>
              </Link>
            ))}
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl text-base font-semibold text-[#DBE64C] hover:bg-white/10 flex items-center justify-between"
            >
              <span>Shopping Cart</span>
              <span className="bg-[#00804C] text-white text-xs font-black px-2 py-0.5 rounded-full">
                {itemsCount}
              </span>
            </Link>
          </div>

          <div className="pt-3 border-t border-white/15">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="px-3 py-2 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/60">Signed in as</p>
                  <p className="text-sm font-bold text-white">{user?.name}</p>
                  <p className="text-xs text-white/70">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outlineWhite"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outlineWhite"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
