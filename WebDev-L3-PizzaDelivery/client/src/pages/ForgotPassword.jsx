import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, CheckCircle2, ShieldAlert, Pizza } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [generalError, setGeneralError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setGeneralError('');
    const result = await forgotPassword(data.email);
    if (result.success) {
      setSubmittedEmail(data.email);
    } else {
      setGeneralError(result.message || 'Request failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Brand Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#001F3F] text-[#DBE64C] shadow-md mb-2">
            <Pizza className="w-6 h-6 -rotate-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001F3F] tracking-tight font-display">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enter your registered email and we'll dispatch secure recovery instructions
          </p>
        </div>

        {submittedEmail ? (
          /* Success notification */
          <div className="space-y-6 animate-in fade-in duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00804C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#001F3F]">Check Your Inbox</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists with <strong className="text-[#001F3F] font-bold">{submittedEmail}</strong>, a password reset link has been dispatched.
              </p>
              <p className="text-[11px] text-slate-400">
                The link is valid for 1 hour. Please also check your spam or promotions folder.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Email submission form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {generalError}
              </div>
            )}

            <Input
              label="Account Email Address"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-md"
              loading={isSubmitting}
            >
              Send Password Reset Link
            </Button>

            <div className="pt-4 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00804C] hover:text-[#74C365] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
