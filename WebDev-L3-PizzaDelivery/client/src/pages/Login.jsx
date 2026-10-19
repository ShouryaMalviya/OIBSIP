import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Pizza, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const Login = () => {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unverifiedState, setUnverifiedState] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: localStorage.getItem('pizzaverse_remember_email') || '',
      password: '',
      rememberMe: !!localStorage.getItem('pizzaverse_remember_email'),
    },
  });

  const onSubmit = async (data) => {
    setGeneralError('');
    setUnverifiedState(null);
    setResendSuccess(false);

    if (data.rememberMe) {
      localStorage.setItem('pizzaverse_remember_email', data.email);
    } else {
      localStorage.removeItem('pizzaverse_remember_email');
    }

    const result = await login({
      email: data.email,
      password: data.password,
    });

    if (result.success) {
      // Redirect to returnUrl if present, else to home or profile
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    } else if (result.isEmailVerified === false) {
      setUnverifiedState({
        email: result.email,
        message: result.message,
      });
    } else {
      setGeneralError(result.message || 'Invalid email or password.');
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedState?.email) return;
    setResending(true);
    setResendSuccess(false);
    const result = await resendVerification(unverifiedState.email);
    setResending(false);
    if (result.success) {
      setResendSuccess(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-8">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#001F3F] text-[#DBE64C] shadow-md mb-2">
            <Pizza className="w-6 h-6 -rotate-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F3F] tracking-tight font-display">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to your PizzaVerse Connoisseur account
          </p>
        </div>

        {/* Unverified account warning banner */}
        {unverifiedState && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Email Verification Required
                </h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Your account ({unverifiedState.email}) must be verified before signing in. Please check your inbox or spam folder.
                </p>
              </div>
            </div>

            {resendSuccess ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification email dispatched! Check your inbox.</span>
              </div>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={handleResendVerification}
                loading={resending}
                icon={Send}
                className="w-full"
              >
                Resend Verification Link
              </Button>
            )}
          </div>
        )}

        {/* General Error banner */}
        {generalError && !unverifiedState && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            error={errors.email?.message}
            required
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Please enter a valid email address',
              },
            })}
          />

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              required
              {...register('password', {
                required: 'Password is required',
              })}
            />

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-[#00804C] focus:ring-[#00804C] h-4 w-4"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-slate-600 select-none">Remember email</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#00804C] hover:text-[#74C365] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-md"
            loading={isSubmitting}
          >
            Sign In to PizzaVerse
          </Button>
        </form>

        {/* Footer link to register */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-[#00804C] hover:text-[#74C365] transition-colors"
            >
              Join PizzaVerse Free
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
