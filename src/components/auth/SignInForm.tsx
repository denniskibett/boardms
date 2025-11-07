'use client'
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { getSystemStatus } from '@/lib/actions/auth';
import ErrorModal from '@/components/ui/modal/ErrorModal';

interface SystemStatus {
  database: { healthy: boolean; error?: string; users?: any[] };
  users: { total: number; hasUsers: boolean; list: any[] };
  environment: { nodeEnv: string; hasAuthSecret: boolean; hasDatabaseUrl: boolean };
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
      console.log('System status:', status);
    } catch (error) {
      console.error('Failed to check system status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setError('');
    setShowErrorModal(false);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('🔐 Client-side authentication attempt:', { email });

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Important: prevent automatic redirect
      });

      console.log('📨 SignIn response:', result);

      if (result?.error) {
        // Parse the detailed error from our enhanced auth system
        try {
          const errorData = JSON.parse(result.error);
          console.log('🔴 Parsed error details:', errorData);
          
          // Format user-friendly message with details
          let userMessage = errorData.message;
          
          if (errorData.details?.availableUsers) {
            userMessage += `\n\nAvailable users:\n${errorData.details.availableUsers.join('\n')}`;
          }
          
          if (errorData.details?.suggestion) {
            userMessage += `\n\n💡 ${errorData.details.suggestion}`;
          }
          
          setError(userMessage);
          setErrorDetails(errorData.details);
          setShowErrorModal(true);
        } catch (parseError) {
          // If it's not our formatted error, return as is
          console.log('⚠️ Could not parse error, returning raw:', result.error);
          setError(result.error || 'Authentication failed');
          setErrorDetails({ rawError: result.error });
          setShowErrorModal(true);
        }
      } else if (result?.ok) {
        console.log('✅ SignIn successful, checking session...');
        
        // Wait a moment for the session to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the updated session
        const session = await getSession();
        console.log('🔍 Session after signin:', session);
        
        if (session) {
          console.log('🎯 Redirecting to dashboard...');
          // Use router.push for client-side navigation (stays on same page until successful)
          router.push('/dashboard');
          // Optional: Force refresh to ensure session is loaded
          setTimeout(() => {
            router.refresh();
          }, 100);
        } else {
          setError('Authentication successful but session not found. Please try again.');
          setErrorDetails({ sessionCheck: 'Session was null after successful signin' });
          setShowErrorModal(true);
        }
      } else {
        setError('Unknown authentication error - no response received');
        setErrorDetails({ result });
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('💥 Auth error:', error);
      const errorMessage = `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      setErrorDetails({ 
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error 
      });
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    
    if (emailInput && passwordInput) {
      // Use the first available user email or fallback to demo
      const firstUser = systemStatus?.users.list[0];
      if (firstUser) {
        emailInput.value = firstUser.email;
      } else {
        emailInput.value = 'president@president.go.ke';
      }
      passwordInput.value = 'admin123';
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError('');
    setErrorDetails(null);
  };

  // Prevent any background navigation when modal is open
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showErrorModal) {
        // If modal is open, prevent navigation
        window.history.pushState(null, '', window.location.href);
        event.preventDefault();
      }
    };

    if (showErrorModal) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showErrorModal]);

  return (
    <>
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to homepage
          </Link>
        </div> */}
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8 text-center">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                boardms System
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Government Meeting Management Platform
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
            
            {/* Inline error message (small) */}
            {error && !showErrorModal && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                <strong>Error:</strong> {error.split('\n')[0]}
                <button
                  onClick={() => setShowErrorModal(true)}
                  className="ml-2 text-xs underline"
                >
                  View details
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder="your.email@gov.go.ke" 
                    type="email" 
                    name="email"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Remember me
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    type="submit"
                    disabled={isLoading || (systemStatus && !systemStatus.database.healthy) || showErrorModal}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              {/* <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                Demo Access:{" "}
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400 underline"
                  disabled={isLoading}
                >
                  Click to auto-fill credentials
                </button>
              </p> */}
              {systemStatus && !systemStatus.users.hasUsers && (
                <p className="text-xs text-center text-red-500 mt-2">
                  ⚠️ No users found in database. Run: npm run db:seed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal - This will block all navigation when open */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        error={error}
        details={errorDetails}
      />
    </>
  );
}