import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  Sparkles,
  Pizza,
  Award,
  Layers,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
          <p className="text-sm text-slate-600">Please sign in to view your profile details.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-[#001F3F] text-[#F6F7ED] rounded-3xl p-8 relative overflow-hidden shadow-xl border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-[#00804C] text-[#DBE64C] flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user.name}</h1>
            <Badge variant={user.role === 'admin' ? 'spring' : 'mantis'} size="sm">
              {user.role === 'admin' ? 'Administrator' : 'Artisanal Connoisseur'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#DBE64C]" /> {user.email}
          </p>
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
            {user.isEmailVerified ? (
              <span className="text-xs font-bold text-[#74C365] flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> Email Verified
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full">
                Unverified Email
              </span>
            )}
            <span className="text-xs text-slate-400">
              Member since {formattedDate}
            </span>
          </div>
        </div>

        <div className="sm:self-start">
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            icon={LogOut}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Account Details Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Security & Credentials Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00804C]" /> Account Security
          </h3>

          <div className="space-y-3 divide-y divide-slate-100 text-sm">
            <div className="pt-2 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#001F3F] block">Email Verification</span>
                <span className="text-xs text-slate-500">Protection against unauthorized registration</span>
              </div>
              <Badge variant={user.isEmailVerified ? 'mantis' : 'spicy'} size="xs">
                {user.isEmailVerified ? 'Verified' : 'Pending'}
              </Badge>
            </div>

            <div className="pt-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#001F3F] block">Authentication Method</span>
                <span className="text-xs text-slate-500">JWT + Encrypted HTTP-only Session Cookie</span>
              </div>
              <span className="text-xs font-semibold text-[#00804C]">Active</span>
            </div>

            <div className="pt-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-[#001F3F] block">Password Security</span>
                <span className="text-xs text-slate-500">Bcrypt salt rounds 12 hash</span>
              </div>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#00804C] hover:underline"
              >
                Change
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Roadmap & Perks */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#DBE64C]" /> Roadmap Milestones (Parts 2–5)
          </h3>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#00804C]/10 text-[#00804C] flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <span className="font-bold text-[#001F3F] block">Custom Pizza Builder</span>
                <span className="text-slate-500">Interactive crust, sauces, and gourmet toppings</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#00804C]/10 text-[#00804C] flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <span className="font-bold text-[#001F3F] block">Cart & Razorpay Checkout</span>
                <span className="text-slate-500">Instant test payment flow & order generation</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#00804C]/10 text-[#00804C] flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <span className="font-bold text-[#001F3F] block">Admin & Live Inventory</span>
                <span className="text-slate-500">Kitchen stock alerts & order pipeline management</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Navigation to Menu */}
      <div className="bg-[#F6F7ED] p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001F3F] text-[#DBE64C] flex items-center justify-center">
            <Pizza className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#001F3F]">Ready to explore our wood-fired catalog?</h4>
            <p className="text-xs text-slate-500">Browse Neapolitan, Artisanal, and Chef's Signature pizzas.</p>
          </div>
        </div>
        <Link to="/menu">
          <Button variant="primary" size="md">
            View Pizzas
          </Button>
        </Link>
      </div>

    </div>
  );
};

export default Profile;
