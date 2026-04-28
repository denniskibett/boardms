"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Building2,
  Users,
  MapPin,
  Briefcase,
  Star,
  BadgeCheck,
  BadgeAlert,
  BadgeX,
  Loader2,
  LogIn,
  UserCircle,
  Crown,
  Sparkles
} from "lucide-react";

interface Ministry {
  id: number;
  name: string;
  acronym: string;
  cluster_id?: number;
}

interface User {
  id: string;
  auth_id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  phone?: string;
  last_login?: string;
  ministry_id?: number;
  committees?: string[];
  created_at: string;
  updated_at: string;
}

interface WelcomeBannerProps {
  user: User;
  ministry?: Ministry | null;
  showWelcomeMessage?: boolean;
  size?: "sm" | "md" | "lg";
}

// Role icons mapping
const roleIcons: Record<string, React.ReactNode> = {
  President: <Crown size={16} />,
  "Deputy President": <Crown size={16} />,
  "Prime Cabinet Secretary": <Award size={16} />,
  "Cabinet Secretary": <Briefcase size={16} />,
  "Principal Secretary": <Briefcase size={16} />,
  "Cabinet Secretariat": <Users size={16} />,
  Director: <UserCircle size={16} />,
  "Assistant Director": <UserCircle size={16} />,
  Admin: <Shield size={16} />,
  "Attorney General": <BadgeCheck size={16} />,
  "Secretary to the Cabinet": <Sparkles size={16} />,
};

// Status icons mapping
const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle size={14} />,
  inactive: <XCircle size={14} />,
  pending: <AlertCircle size={14} />,
  suspended: <BadgeX size={14} />,
};

// Role colors for badges
const roleColors: Record<string, string> = {
  President: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Deputy President": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Prime Cabinet Secretary": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "Cabinet Secretary": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Principal Secretary": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  "Cabinet Secretariat": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Director: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  "Assistant Director": "bg-cyan-50 text-cyan-700 dark:bg-cyan-800 dark:text-cyan-200",
  Admin: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  "Attorney General": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Secretary to the Cabinet": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function WelcomeBanner({ 
  user, 
  ministry, 
  showWelcomeMessage = true,
  size = "md" 
}: WelcomeBannerProps) {
  const { getPrimaryColor, getSecondaryColor } = useSystemSettings();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getUserImage = (user: User) => {
    console.log('🖼️ User image data:', {
      image: user.image,
      name: user.name
    });

    if (user.image) {
      // Handle external URLs
      if (user.image.startsWith('https') || user.image.startsWith('http')) {
        return user.image;
      }
      
      // Handle absolute local paths
      if (user.image.startsWith('/')) {
        return user.image;
      }
      
      // Handle relative paths - assume it's in the images/users folder
      return `/images/users/${user.image}`;
    }
    return null;
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string): string => {
    return roleColors[role] || roleColors.Admin;
  };

  const getStatusColor = (status: string): string => {
    return statusColors[status] || statusColors.inactive;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ Image failed to load:', e.currentTarget.src);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return null;
    try {
      const date = new Date(lastLogin);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return lastLogin;
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      size: 48,
      image: "h-12 w-12",
      text: "text-lg",
      badge: "text-xs"
    },
    md: {
      size: 64,
      image: "h-16 w-16",
      text: "text-2xl",
      badge: "text-sm"
    },
    lg: {
      size: 80,
      image: "h-20 w-20",
      text: "text-3xl",
      badge: "text-sm"
    }
  };

  const config = sizeConfig[size];
  const imageUrl = getUserImage(user);
  const lastLoginFormatted = formatLastLogin(user.last_login);

  return (
    <div 
      className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-lg"
 
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 relative">
            {imageUrl && !imageError ? (
              <div className={`${config.image} overflow-hidden rounded-full border-4 border-white dark:border-gray-800 relative`}>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Loader2 size={20} className="animate-spin" style={{ color: getPrimaryColor() }} />
                  </div>
                )}
                <Image
                  width={config.size}
                  height={config.size}
                  src={imageUrl}
                  alt={`${user.name}'s profile picture`}
                  className="h-full w-full object-cover transition-opacity duration-300"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  unoptimized
                  priority
                />
              </div>
            ) : (
              <div 
                className={`${config.image} flex items-center justify-center rounded-full border-4 border-white shadow-sm`}
                style={{ 
                  background: `linear-gradient(135deg, ${getPrimaryColor()} 0%, ${getSecondaryColor()} 100%)`
                }}
              >
                <span className={`font-bold text-white ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>
                  {getUserInitials(user.name)}
                </span>
              </div>
            )}
          </div>
          
          <div>
            <h1 className={`${config.text} font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
              {showWelcomeMessage ? (
                <>
                  Welcome back, {user.name}!
                </>
              ) : user.name}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Briefcase size={14} />
                {user.role}
              </span>
              {ministry && (
                <>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {ministry.name} ({ministry.acronym})
                  </span>
                </>
              )}
            </p>

            {lastLoginFormatted && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                <LogIn size={12} />
                Last login: {lastLoginFormatted}
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex flex-wrap gap-2">
            {/* Role Badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${config.badge} font-medium ${getRoleColor(user.role)}`}>
              {roleIcons[user.role] || <User size={12} />}
              {user.role}
            </span>
            
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${config.badge} font-medium ${getStatusColor(user.status)}`}>
              {statusIcons[user.status] || <AlertCircle size={12} />}
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Additional user info - optional expandable section */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Mail size={16} />
          <span className="truncate">{user.email}</span>
        </div>
        
        {user.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone size={16} />
            <span>{user.phone}</span>
          </div>
        )}
        
        {user.committees && user.committees.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users size={16} />
            <span>{user.committees.length} Committee{user.committees.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}