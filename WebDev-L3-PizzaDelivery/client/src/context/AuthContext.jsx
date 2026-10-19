import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current authentication session on app initialization
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getMe();
      if (response?.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Unauthenticated session is normal on initial load
      setUser(null);
      localStorage.removeItem('pizzaverse_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Log in
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { user: loggedInUser, token } = response.data;
      if (token) {
        localStorage.setItem('pizzaverse_token', token);
      }
      setUser(loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      return { success: true, user: loggedInUser };
    } catch (error) {
      // Check if unverified
      if (error.response?.data?.isEmailVerified === false) {
        return {
          success: false,
          isEmailVerified: false,
          email: error.response.data.email,
          message: error.userMessage,
        };
      }
      toast.error(error.userMessage || 'Login failed. Please check credentials.');
      return { success: false, message: error.userMessage };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      toast.success('Registration successful! Please check your email to verify.');
      return { success: true, data: response.data };
    } catch (error) {
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const firstErrorKey = Object.keys(fieldErrors)[0];
        toast.error(`${fieldErrors[firstErrorKey]}`);
      } else {
        toast.error(error.userMessage || 'Registration failed.');
      }
      return { success: false, message: error.userMessage, errors: fieldErrors };
    }
  };

  // Log out
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      localStorage.removeItem('pizzaverse_token');
      setUser(null);
      toast.success('You have logged out.');
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail({ token });
      toast.success('Email successfully verified! You may now sign in.');
      if (response?.data?.user) {
        setUser(response.data.user);
      }
      return { success: true, message: response.message };
    } catch (error) {
      toast.error(error.userMessage || 'Failed to verify email.');
      return { success: false, message: error.userMessage };
    }
  };

  // Resend verification
  const resendVerification = async (email) => {
    try {
      const response = await authService.resendVerification({ email });
      toast.success(response.message || 'Verification link sent!');
      return { success: true, message: response.message };
    } catch (error) {
      toast.error(error.userMessage || 'Failed to resend verification.');
      return { success: false, message: error.userMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword({ email });
      toast.success(response.message || 'Password reset link sent.');
      return { success: true, message: response.message };
    } catch (error) {
      toast.error(error.userMessage || 'Request failed.');
      return { success: false, message: error.userMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const response = await authService.resetPassword({ token, password });
      toast.success('Password successfully reset! Please sign in.');
      return { success: true, message: response.message };
    } catch (error) {
      toast.error(error.userMessage || 'Failed to reset password.');
      return { success: false, message: error.userMessage };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
