import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle2, AlertCircle, Pizza, ShieldCheck } from 'lucide-react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const navigate = useNavigate();

  const { resetPassword } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setGeneralError('');

    if (data.password !== data.confirmPassword) {
      setGeneralError('Passwords do not match.');
      return;
    }

    if (!data.token) {
      setGeneralError('Password reset token is missing.');
      return;
    }

    const result = await resetPassword(data.token, data.password);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setGeneralError(result.message || 'Failed to reset password.');
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
            Choose New Password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create a strong, secure password for your PizzaVerse account
          </p>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="space-y-6 animate-in fade-in duration-200 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00804C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#001F3F]">Password Reset Complete!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your password has been successfully updated. All previous sessions have been invalidated for your security.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Sign In with New Password
              </Button>
            </div>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {generalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {!tokenFromUrl && (
              <Input
                label="Reset Token"
                type="text"
                placeholder="Paste token from email link"
                error={errors.token?.message}
                required
                {...register('token', {
                  required: 'Reset token is required',
                })}
              />
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              required
              {...register('password', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                  message: 'Must include uppercase, lowercase, number, and special character',
                },
              })}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
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
                Update Password
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <Link to="/login" className="text-xs font-bold text-[#00804C] hover:text-[#74C365]">
                &larr; Return to Sign In
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;
