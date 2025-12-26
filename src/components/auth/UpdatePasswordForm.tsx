'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { supabase } from "@/lib/supabase/client";
import { useSystemSettings } from '@/context/SystemSettingsContext';
import Image from 'next/image';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  // Get system settings
  const { 
    settings, 
    loading: settingsLoading,
    getLogo,
    getSystemName,
    validatePassword,
    getPasswordRequirements
  } = useSystemSettings();

  useEffect(() => {
    // Check if user has a valid session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/signin");
      }
    });
  }, [router]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate against system password policy
    if (!validatePassword(password)) {
      setError(`Password does not meet system requirements: ${getPasswordRequirements()}`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage("Password updated successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      }
    } catch (error: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex flex-col flex-1 lg:w-1/2 w-full">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
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

        <div className="w-full max-w-md mx-auto mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon />
            Back to sign in
          </Link>
        </div>
        
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Update Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your new password
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
              {message}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div className="space-y-6">
              <div>
                <Label>New Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Password strength:</span>
                      <span className={`font-medium ${getPasswordStrengthColor(passwordStrength).replace('bg-', 'text-')}`}>
                        {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Confirm Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              
              <div>
                <Button 
                  className="w-full" 
                  size="sm"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}