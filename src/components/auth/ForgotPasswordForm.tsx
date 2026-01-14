// components/auth/ForgotPasswordForm.tsx
'use client'
import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, MailIcon } from "@/icons";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { supabase } from "@/lib/supabase/client";
import { useSystemSettings } from '@/context/SystemSettingsContext';
import Image from 'next/image';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Get system settings
  const { 
    settings, 
    loading: settingsLoading,
    getLogo,
    getSystemName, 
    getSystemDescription,
    getCopyrightText 
  } = useSystemSettings();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setError(error.message || "Failed to send reset email. Please try again.");
      } else {
        setMessage("Password reset link has been sent to your email. Please check your inbox (and spam folder).");
        setEmail("");
      }
    } catch (error: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading system...</span>
          </div>
        </div>
      </div>
    );
  }

  const logo = getLogo();
  const systemName = getSystemName();
  const systemDescription = getSystemDescription();

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-4 sm:px-0">
        <div className="w-full">
          {/* Logo Section - Improved styling */}
          {logo && (
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20">
                <Image
                  src={logo}
                  alt={`${systemName} Logo`}
                  fill
                  className="object-contain"
                  priority
                  sizes="80px"
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    maxWidth: '80px',
                    maxHeight: '80px'
                  }}
                />
              </div>
            </div>
          )}

          {/* System Info */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {systemName}
            </h1>
            {systemDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {systemDescription}
              </p>
            )}
          </div>

          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
          
          {/* Card Container */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-800 dark:border-gray-700">
            {/* Header */}
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Reset Password
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="p-4 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                <div className="flex items-center">
                  <svg className="flex-shrink-0 w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Error</span>
                </div>
                <p className="mt-2">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 mb-4 text-sm text-green-800 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <div className="flex items-center">
                  <svg className="flex-shrink-0 w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Success!</span>
                </div>
                <p className="mt-2">{message}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleReset}>
              <div className="space-y-5">
                <div>
                  <Label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MailIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <Input 
                      placeholder="your.email@gov.go.ke" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Enter the email address associated with your account.
                  </p>
                </div>
                
                <div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={loading || !email.trim()}
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                  >
                    {loading ? 'Sending reset link...' : 'Send reset link'}
                  </Button>
                </div>
              </div>
            </form>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex">
                <svg className="flex-shrink-0 w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Need help?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>
                      If you don't receive the email within a few minutes, please check your spam folder or{' '}
                      <Link href="/contact-support" className="font-medium underline hover:text-blue-600 dark:hover:text-blue-300">
                        contact support
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/signin"
                className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getCopyrightText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}