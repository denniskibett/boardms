'use client'
import { signIn } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import ErrorModal from '@/components/ui/modal/ErrorModal';
import { supabase } from '@/lib/supabase/client';
import { useSystemSettings } from '@/context/SystemSettingsContext';
import Image from 'next/image';

interface AuthUser {
  id: string;
  email: string;
  email_confirmed: boolean;
  last_sign_in: string | null;
  created_at: string;
  user_metadata: any;
  custom_user_linked: boolean;
  custom_user_id?: string;
  auth_id_in_custom?: string;
  status: string;
  role: string;
}

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login?: string;
  auth_id?: string;
  created_at?: string;
  password?: string;
}

interface SystemStatus {
  database: {
    healthy: boolean;
    error?: string;
  };
  customUsers: {
    total: number;
    active: number;
    inactive: number;
    list: CustomUser[];
  };
  authUsers: {
    total: number;
    confirmed: number;
    unconfirmed: number;
    list: AuthUser[];
  };
  syncStatus: {
    synced: number;
    notSynced: number;
    percentage: number;
    mismatched: Array<{
      email: string;
      customUserId?: string;
      authUserId?: string;
      issue: string;
    }>;
  };
}

interface AuthErrorDetails {
  code?: string;
  status?: number;
  originalError?: string;
  userExistsInCustomTable?: boolean;
  userExistsInAuth?: boolean;
  userStatus?: string;
  needsSync?: boolean;
  suggestion?: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorDetails, setErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const router = useRouter();

  // Get system settings
  const { 
    settings, 
    loading: settingsLoading,
    getLogo,
    getSystemName, 
    getSystemDescription,
    getCopyrightText 
  } = useSystemSettings();

  useEffect(() => {
    checkSystemStatus();
    
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

  const checkSystemStatus = async () => {
    try {
      setDebugInfo('Checking system status...');
      
      // Check custom users table
      const { data: customUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('email');

      if (usersError) {
        console.error('Custom users error:', usersError);
        setDebugInfo(prev => prev + `\nCustom users error: ${usersError.message}`);
      }

      // Check Supabase Auth users
      let authUsers: AuthUser[] = [];
      try {
        setDebugInfo(prev => prev + '\nFetching auth users...');
        const response = await fetch('/api/auth/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const authData = await response.json();
          authUsers = authData.users || [];
          setDebugInfo(prev => prev + `\nFound ${authUsers.length} auth users`);
        } else {
          setDebugInfo(prev => prev + `\nAuth API failed: ${response.status}`);
        }
      } catch (authError) {
        console.warn('Cannot access auth users:', authError);
        setDebugInfo(prev => prev + `\nAuth error: ${authError}`);
      }

      // Calculate sync status
      const customUsersList = customUsers || [];
      const syncedUsers = customUsersList.filter(u => u.auth_id).length;
      const notSyncedUsers = customUsersList.filter(u => !u.auth_id).length;
      
      // Find mismatched users
      const mismatched = [];
      
      // Users in custom table but not in auth
      for (const customUser of customUsersList) {
        if (customUser.auth_id) {
          const authUser = authUsers.find(au => au.id === customUser.auth_id);
          if (!authUser) {
            mismatched.push({
              email: customUser.email,
              customUserId: customUser.id,
              authUserId: customUser.auth_id,
              issue: 'Auth ID exists but no matching auth user'
            });
          }
        } else {
          const authUser = authUsers.find(au => au.email === customUser.email);
          if (authUser) {
            mismatched.push({
              email: customUser.email,
              customUserId: customUser.id,
              authUserId: authUser.id,
              issue: 'User exists in auth but no auth_id in custom table'
            });
          }
        }
      }
      
      // Users in auth but not in custom table
      for (const authUser of authUsers) {
        const customUser = customUsersList.find(cu => cu.email === authUser.email);
        if (!customUser) {
          mismatched.push({
            email: authUser.email,
            authUserId: authUser.id,
            issue: 'User exists in auth but not in custom table'
          });
        }
      }

      const activeUsers = customUsersList.filter(u => u.status === 'active') || [];
      const inactiveUsers = customUsersList.filter(u => u.status !== 'active') || [];

      setSystemStatus({
        database: {
          healthy: !usersError,
          error: usersError?.message
        },
        customUsers: {
          total: customUsersList.length,
          active: activeUsers.length,
          inactive: inactiveUsers.length,
          list: customUsersList
        },
        authUsers: {
          total: authUsers.length,
          confirmed: authUsers.filter(u => u.email_confirmed).length,
          unconfirmed: authUsers.filter(u => !u.email_confirmed).length,
          list: authUsers
        },
        syncStatus: {
          synced: syncedUsers,
          notSynced: notSyncedUsers,
          percentage: customUsersList.length > 0 ? Math.round((syncedUsers / customUsersList.length) * 100) : 0,
          mismatched
        }
      });

      setDebugInfo(prev => prev + `\nStatus check complete: ${customUsersList.length} custom users, ${authUsers.length} auth users, ${mismatched.length} mismatches`);

    } catch (error) {
      console.error('System status check failed:', error);
      setDebugInfo(prev => prev + `\nStatus check failed: ${error}`);
    }
  };

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
    setShowErrorModal(false);
    
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

      // ✅ SUCCESS - Redirect to dashboard
      handleLoginSuccess();
      window.location.href = '/';

    } catch (error) {
      console.error('Unexpected error during login:', error);
      handleLoginFailure();
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setError('');
    setErrorDetails(null);
  };

  const formatLockTime = () => {
    const minutes = Math.floor(lockTime / 1000 / 60);
    const seconds = Math.floor((lockTime / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const clearDebugInfo = () => {
    setDebugInfo('');
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
              
              {systemStatus && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowSystemInfo(!showSystemInfo)}
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                      systemStatus.database.healthy
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      systemStatus.database.healthy ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></span>
                    System {systemStatus.database.healthy ? 'Online' : 'Degraded'}
                    <span className="ml-2">
                      {systemStatus.syncStatus.synced}/{systemStatus.customUsers.total} synced
                    </span>
                  </button>
                </div>
              )}
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

            {showSystemInfo && systemStatus && (
              <div className="p-4 mb-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="mb-3 text-sm font-semibold">System Information</h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-medium mb-2">Custom Users Table</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span>{systemStatus.customUsers.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active:</span>
                        <span className="text-green-600">{systemStatus.customUsers.active}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inactive:</span>
                        <span className="text-red-600">{systemStatus.customUsers.inactive}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Supabase Auth Users ({systemStatus.authUsers.total})</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Confirmed:</span>
                        <span className="text-green-600">{systemStatus.authUsers.confirmed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unconfirmed:</span>
                        <span className="text-yellow-600">{systemStatus.authUsers.unconfirmed}</span>
                      </div>
                    </div>
                    
                    {/* Auth Users List */}
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {systemStatus.authUsers.list.map((user, index) => (
                        <div key={user.id} className="p-2 mb-1 text-xs border rounded bg-white dark:bg-gray-700">
                          <div className="font-medium">{user.email}</div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>ID: {user.id.substring(0, 8)}...</span>
                            <span className={user.email_confirmed ? 'text-green-600' : 'text-yellow-600'}>
                              {user.email_confirmed ? '✓ Confirmed' : '⏳ Unconfirmed'}
                            </span>
                          </div>
                          <div className="text-gray-500">
                            Role: {user.user_metadata?.role || 'user'} | 
                            Linked: {user.custom_user_linked ? '✓' : '✗'} |
                            Last: {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Sync Status</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Synced Users:</span>
                        <span className="text-green-600">{systemStatus.syncStatus.synced}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Not Synced:</span>
                        <span className="text-red-600">{systemStatus.syncStatus.notSynced}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sync Percentage:</span>
                        <span className={systemStatus.syncStatus.percentage === 100 ? 'text-green-600' : 'text-yellow-600'}>
                          {systemStatus.syncStatus.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {systemStatus.syncStatus.mismatched.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Mismatched Users ({systemStatus.syncStatus.mismatched.length})</h4>
                      <div className="max-h-32 overflow-y-auto">
                        {systemStatus.syncStatus.mismatched.map((mismatch, index) => (
                          <div key={index} className="p-2 mb-1 text-xs bg-red-100 rounded dark:bg-red-900/20">
                            <div className="font-medium">{mismatch.email}</div>
                            <div className="text-red-600">{mismatch.issue}</div>
                            {mismatch.customUserId && <div>Custom ID: {mismatch.customUserId}</div>}
                            {mismatch.authUserId && <div>Auth ID: {mismatch.authUserId}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <details>
                    <summary className="cursor-pointer font-medium">Debug Information</summary>
                    <div className="mt-2 p-2 bg-gray-100 rounded dark:bg-gray-700">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs">Debug Log:</span>
                        <button 
                          onClick={clearDebugInfo}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </button>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {debugInfo || 'No debug information yet...'}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            )}
            
            {error && !showErrorModal && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                <strong>Error:</strong> {error}
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
                    disabled={isLoading || !systemStatus?.database.healthy || isLocked}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </div>
              </div>
            </form>

            {loginAttempts > 0 && !isLocked && (
              <div className="mt-3 text-center">
                <p className="text-xs text-yellow-600">
                  ⚠️ {loginAttempts} failed login attempt{loginAttempts !== 1 ? 's' : ''}. 
                  {5 - loginAttempts > 0 && ` ${5 - loginAttempts} attempts remaining before lock.`}
                </p>
              </div>
            )}

            <div className="mt-4 text-center">
              {systemStatus && !systemStatus.database.healthy && (
                <p className="text-xs text-red-500">
                  ❌ Database connection failed
                </p>
              )}
              
              {systemStatus && systemStatus.database.healthy && (
                <p className="text-xs text-green-500">
                  ✅ System online - {systemStatus.authUsers.total} auth users, {systemStatus.syncStatus.synced}/{systemStatus.customUsers.total} synced
                </p>
              )}
            </div>

            {/* Updated: Copyright from system settings */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getCopyrightText()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        error={error}
        details={errorDetails}
      />
    </>
  );
}