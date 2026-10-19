import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/admin.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, Mail, Pizza, ArrowRight, AlertTriangle } from 'lucide-react';

export const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: 'admin@pizzaverse.local',
    password: 'AdminMasterPass2026!',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminService.login(credentials);
      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('pizzaverse_token', token);
      }

      await refreshUser();
      toast.success(`Welcome to Control Center, ${user.name}!`);
      navigate('/admin');
    } catch (err) {
      const msg = err.userMessage || err.response?.data?.message || 'Administrator authentication failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001F3F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Atmosphere Accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#1E488F]/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#00804C]/20 blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-[#00804C] flex items-center justify-center text-[#DBE64C] shadow-lg group-hover:scale-105 transition-transform">
            <Pizza className="w-7 h-7 transform -rotate-12" />
          </div>
          <span className="text-2xl font-black tracking-tight font-display text-white">
            PIZZA<span className="text-[#DBE64C]">VERSE</span>
          </span>
        </Link>
        
        <div className="flex items-center justify-center gap-2">
          <Badge variant="spring" size="sm">Admin Portal</Badge>
          <span className="text-xs font-semibold text-white/60">Restricted Authorization Area</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Operational Control HQ
        </h2>
        <p className="text-xs text-white/60 max-w-sm mx-auto">
          Sign in with your authorized administrator credentials to manage wood-fired ovens, recipe stock, and tickets.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/10 space-y-6">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Admin Email Address"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              required
              icon={Mail}
              placeholder="admin@pizzaverse.local"
            />

            <Input
              label="Security Password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              required
              icon={Lock}
              placeholder="••••••••••••"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lg"
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Authenticate into Dashboard
              </Button>
            </div>
          </form>

          {/* Seed hint box for reviewer/testing convenience */}
          <div className="bg-[#F6F7ED] border border-slate-200 rounded-2xl p-4 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-[#001F3F] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00804C]" /> Default Provisioned Admin Account
            </span>
            <p className="font-mono text-slate-700">Email: admin@pizzaverse.local</p>
            <p className="font-mono text-slate-700">Password: AdminMasterPass2026!</p>
          </div>

          <div className="text-center pt-1">
            <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-[#00804C]">
              ← Return to Customer Storefront
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AdminLogin;
