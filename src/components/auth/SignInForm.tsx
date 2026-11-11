'use client'
import { signIn } from "next-auth/react"
import Checkbox from "@/components/form/input/Checkbox";
import { TextInput as Input } from "@/components/ui/kit";
import Label from "@/components/form/Label";
import { Btn as Button } from "@/components/ui/kit";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { AlertTriangle } from 'lucide-react';
import { useSystemSettings } from '@/context/SystemSettingsContext';
import Image from 'next/image';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);

  // Get system settings
  const {
    loading: settingsLoading,
    getLogo,
    getSystemName, 
    getSystemDescription,
    getCopyrightText 
  } = useSystemSettings();

  useEffect(() => {
    const lockUntil = localStorage.getItem('loginLockUntil');
    if (lockUntil && parseInt(lockUntil) > Date.now()) {
      setIsLocked(true);
      setLockTime(parseInt(lockUntil) - Date.now());
    }
  }, []);

  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      const timeLeft = lockTime - 1000;
      setLockTime(timeLeft);

      if (timeLeft <= 0) {
        setIsLocked(false);
        localStorage.removeItem('loginLockUntil');
        localStorage.removeItem('loginAttempts');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTime]);

  const handleLoginFailure = () => {
    const attempts = loginAttempts + 1;
    setLoginAttempts(attempts);
    localStorage.setItem('loginAttempts', attempts.toString());

    if (attempts >= 5) {
      const lockUntil = Date.now() + 5 * 60 * 1000;
      setIsLocked(true);
      setLockTime(5 * 60 * 1000);
      localStorage.setItem('loginLockUntil', lockUntil.toString());
    }
  };

  const handleLoginSuccess = () => {
    setLoginAttempts(0);
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('loginLockUntil');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Account temporarily locked. Please try again in ${Math.ceil(lockTime / 1000 / 60)} minutes.`);
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password: password.trim(),
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        handleLoginFailure();
        return;
      }

      handleLoginSuccess();
      window.location.href = '/';

    } catch {
      handleLoginFailure();
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLockTime = () => {
    const minutes = Math.floor(lockTime / 1000 / 60);
    const seconds = Math.floor((lockTime / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  return (
    <>
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            {/* Updated: Use system logo from settings */}
            <div className="flex justify-center mb-5 sm:mb-8">
              <div className="relative w-48 h-12">
                <Image
                  src={getLogo('auth')}
                  alt={`${getSystemName()} Logo`}
                  fill
                  className="object-contain"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/logo/auth-logo.svg';
                  }}
                />
              </div>
            </div>

            <div className="mb-5 sm:mb-8 text-center">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                {getSystemName()}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getSystemDescription()}
              </p>
            </div>

            <div className="mb-5 sm:mb-8">
              <h2 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90">
                Sign In
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your credentials to access the system
              </p>
            </div>
            
            {isLocked && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                <strong>Account Temporarily Locked</strong>
                <p>Too many failed login attempts. Please try again in {formatLockTime()} minutes.</p>
              </div>
            )}

            {error && (
              <div role="alert" className="p-3 mb-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-500/15 dark:border-error-500/30 dark:text-error-400">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>Email <span className="text-error-500">*</span></Label>
                  <Input 
                    placeholder="your.email@gov.go.ke" 
                    type="email" 
                    name="email"
                    disabled={isLoading || isLocked}
                    required
                  />
                </div>
                <div>
                  <Label>Password <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      disabled={isLoading || isLocked}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={isChecked} 
                      onChange={setIsChecked}
                      disabled={isLoading || isLocked}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Remember me
                    </span>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={isLoading || isLocked}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
              </div>
            </form>

            {loginAttempts > 0 && !isLocked && (
              <div className="mt-3 text-center">
                <p className="inline-flex items-center gap-1.5 text-xs text-warning-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {loginAttempts} failed login attempt{loginAttempts !== 1 ? 's' : ''}. 
                  {5 - loginAttempts > 0 && ` ${5 - loginAttempts} attempts remaining before lock.`}
                </p>
              </div>
            )}

            {/* Updated: Copyright from system settings */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getCopyrightText()}
              </p>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}