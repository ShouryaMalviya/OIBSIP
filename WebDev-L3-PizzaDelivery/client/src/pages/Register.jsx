import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Pizza, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const Register = () => {
  const { register: registerUser } = useAuth();
  const [successData, setSuccessData] = useState(null);
  const [generalError, setGeneralError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const passwordValue = watch('password', '');

  // Calculate password strength indicator
  const passwordChecks = [
    { label: 'At least 8 characters', valid: passwordValue.length >= 8 },
    { label: 'At least one uppercase letter', valid: /[A-Z]/.test(passwordValue) },
    { label: 'At least one lowercase letter', valid: /[a-z]/.test(passwordValue) },
    { label: 'At least one number', valid: /[0-9]/.test(passwordValue) },
    { label: 'At least one special character', valid: /[^A-Za-z0-9]/.test(passwordValue) },
  ];
  const passedChecksCount = passwordChecks.filter((c) => c.valid).length;

  const onSubmit = async (data) => {
    setGeneralError('');

    if (data.password !== data.confirmPassword) {
      setGeneralError('Passwords do not match.');
      return;
    }

    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (result.success) {
      setSuccessData({
        email: data.email,
        name: data.name,
        devToken: result.data?.devVerificationToken,
      });
    } else {
      setGeneralError(result.message || 'Registration failed. Please check form.');
    }
  };

  // SUCCESS SCREEN: When registration succeeds, instruct user to check email
  if (successData) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#00804C]/10 text-[#00804C] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#001F3F]">Account Created!</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We've dispatched a secure verification link to <br />
              <strong className="text-[#001F3F] font-bold">{successData.email}</strong>.
            </p>
          </div>

          <div className="bg-[#F6F7ED] p-4 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 space-y-2">
            <p className="font-bold text-[#001F3F] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00804C]" /> Verification Steps:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your email inbox (or spam folder).</li>
              <li>Click the "Verify Email Address" button.</li>
              <li>Return to sign in and begin ordering.</li>
            </ol>
          </div>

          {/* Development helper shortcut */}
          {successData.devToken && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-[11px] text-amber-900">
              <span className="font-bold block text-amber-950">⚡ Local Development Fast-Track:</span>
              <span>Verification token: <code className="bg-amber-100 px-1 py-0.5 rounded">{successData.devToken}</code></span>
              <div className="mt-2">
                <Link
                  to={`/verify-email?token=${successData.devToken}`}
                  className="font-bold text-[#00804C] underline hover:text-[#74C365]"
                >
                  Click here to instantly verify with token &rarr;
                </Link>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" size="lg" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#001F3F] text-[#DBE64C] shadow-md mb-2">
            <Pizza className="w-6 h-6 -rotate-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F3F] tracking-tight font-display">
            Join PizzaVerse
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Create your account for personalized artisanal pizzas & tracking
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            type="text"
            placeholder="Luigi Rossi"
            icon={User}
            error={errors.name?.message}
            required
            {...register('name', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
            })}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="luigi@example.com"
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
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                  message: 'Must include uppercase, lowercase, number, and special character',
                },
              })}
            />

            {/* Password strength visual meter */}
            {passwordValue && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`flex-1 transition-all duration-300 ${
                        passedChecksCount >= lvl
                          ? passedChecksCount <= 2
                            ? 'bg-rose-500'
                            : passedChecksCount <= 4
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                  {passwordChecks.map((chk, i) => (
                    <span
                      key={i}
                      className={`flex items-center gap-1 ${chk.valid ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}
                    >
                      <span>{chk.valid ? '✓' : '○'}</span> {chk.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === passwordValue || 'Passwords do not match',
            })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              loading={isSubmitting}
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#00804C] hover:text-[#74C365] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
