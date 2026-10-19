import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Loader2, Send, Pizza, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const navigate = useNavigate();

  const { verifyEmail, resendVerification } = useAuth();

  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [manualToken, setManualToken] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleVerification = async (tokenToVerify) => {
    setStatus('verifying');
    setErrorMessage('');
    const result = await verifyEmail(tokenToVerify);
    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Verification token is invalid or has expired.');
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setIsResending(true);
    setResendNotice('');
    const result = await resendVerification(resendEmail);
    setIsResending(false);
    if (result.success) {
      setResendNotice('If an unverified account exists for this address, a new link has been dispatched.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl text-center space-y-6">
        
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#001F3F] text-[#DBE64C] shadow-md mb-2">
          <Pizza className="w-6 h-6 -rotate-12" />
        </div>

        {/* VERIFYING STATE */}
        {status === 'verifying' && (
          <div className="space-y-4 py-6">
            <Loader2 className="w-12 h-12 text-[#00804C] animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-[#001F3F]">Verifying Your Account...</h2>
            <p className="text-xs text-slate-500">
              Validating your security cryptographic token against our authentication records.
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00804C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#001F3F]">Account Verified!</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your email address has been successfully confirmed. You now have full access to PizzaVerse menu and ordering privileges.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Sign In to Your Account
              </Button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#001F3F]">Verification Failed</h2>
              <p className="text-xs sm:text-sm text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {errorMessage}
              </p>
            </div>

            {/* Resend verification box */}
            <div className="bg-[#F6F7ED] p-5 rounded-2xl border border-slate-200 text-left space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#001F3F] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#00804C]" /> Request New Verification Link
              </h4>
              <p className="text-[11px] text-slate-500">
                Tokens expire after 24 hours. Enter your registered email address to receive a fresh token:
              </p>

              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00804C]"
                />
                <Button
                  type="submit"
                  variant="midnight"
                  size="sm"
                  className="w-full"
                  loading={isResending}
                >
                  Send New Link
                </Button>
              </form>

              {resendNotice && (
                <p className="text-xs text-emerald-700 font-medium pt-1">
                  ✓ {resendNotice}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Link to="/login" className="text-xs text-[#00804C] font-bold hover:underline">
                &larr; Return to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* IDLE STATE: No token in query parameter, allow manual token paste */}
        {status === 'idle' && !tokenFromUrl && (
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#001F3F]">Verify Your Email</h2>
              <p className="text-xs text-slate-500">
                Enter the verification token received in your confirmation email:
              </p>
            </div>

            <div className="space-y-3 text-left">
              <Input
                label="Verification Token"
                type="text"
                placeholder="Paste your 64-character token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
              />

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => handleVerification(manualToken)}
                disabled={!manualToken.trim()}
              >
                Confirm Verification
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link to="/login" className="text-xs text-[#00804C] font-bold hover:underline">
                &larr; Return to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
