"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Shield,
  Users2,
  CheckSquare,
  Mail,
  Menu,
  BookOpen,
  Globe,
  Scale,
  Server,
  Activity,
  Database,
  HardDrive,
  Heart,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  roles?: string[];
};

// Role normalization - maps database roles to frontend roles
const normalizeRole = (role?: string | null): string | null => {
  if (!role) return null;

  const roleMap: Record<string, string> = {
    "President": "president",
    "Deputy President": "deputy_president",
    "Prime Cabinet Secretary": "prime_cabinet_secretary",
    "Cabinet Secretary": "cabinet_secretary",
    "Principal Secretary": "principal_secretary",
    "Cabinet Secretariat": "cabinet_secretariat",
    "Director": "director",
    "Assistant Director": "assistant_director",
    "Attorney General": "attorney_general",
    "Admin": "admin",
    "Sysadmin": "sysadmin",
    "CO Officer": "co_officer",
    "Co Officer": "co_officer",
  };

  return roleMap[role] || role.toLowerCase().replace(/\s+/g, "_");
};

// ============= NAVIGATION ITEMS =============
const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "Dashboard",
    path: "/dashboard",
    roles: ["all"],
  },
  {
    icon: <FileText size={20} />,
    name: "Government Memos",
    subItems: [
      { name: "My Memos", path: "/memos" },
      { name: "All Memos", path: "/memos/all" },
    ],
    roles: ["cabinet_secretariat", "cabinet_secretary", "principal_secretary", "director", "assistant_director", "co_officer", "attorney_general", "prime_cabinet_secretary", "admin", "sysadmin"],
  },
  {
    icon: <BookOpen size={20} />,
    name: "Agenda & Books",
    subItems: [
      { name: "All Agenda", path: "/agenda" },
      { name: "Create Agenda", path: "/agenda/create" },
      { name: "Committee Agenda Books", path: "/committees/infrastructure/tier1-agenda" },
      { name: "Cabinet Agenda Books", path: "/cabinet/tier2-agenda" },
    ],
    roles: ["cabinet_secretariat", "prime_cabinet_secretary", "co_officer", "admin", "sysadmin"],
  },
  {
    icon: <Users2 size={20} />,
    name: "Committees",
    subItems: [
      { name: "Committee List", path: "/committees" },
      { name: "My Committees", path: "/committees/my" },
      { name: "Assign Members", path: "/committees/assign" },
    ],
    roles: ["deputy_president", "cabinet_secretariat", "cabinet_secretary", "principal_secretary", "director", "assistant_director", "co_officer", "attorney_general", "prime_cabinet_secretary", "admin", "sysadmin"],
  },
  {
    icon: <Calendar size={20} />,
    name: "Meetings",
    path: "/meetings",
    roles: ["president", "deputy_president", "prime_cabinet_secretary", "cabinet_secretariat", "cabinet_secretary", "principal_secretary", "director", "assistant_director", "co_officer", "attorney_general", "admin", "sysadmin"],
  },
  {
    icon: <Globe size={20} />,
    name: "Resources",
    path: "/resources",
    roles: ["all"],
  },
  {
    icon: <CheckSquare size={20} />,
    name: "Decisions",
    path: "/decisions",
    roles: ["president", "deputy_president", "prime_cabinet_secretary", "cabinet_secretariat", "cabinet_secretary", "principal_secretary", "director", "attorney_general", "admin", "sysadmin"],
  },
  {
    icon: <Mail size={20} />,
    name: "Action Letters",
    path: "/action-letters",
    roles: ["president", "deputy_president", "prime_cabinet_secretary", "cabinet_secretariat", "cabinet_secretary", "principal_secretary", "director", "co_officer", "admin", "sysadmin"],
  },
];

const managementItems: NavItem[] = [
  {
    icon: <Users size={20} />,
    name: "User Management",
    subItems: [
      { name: "All Users", path: "/users" },
      { name: "Roles & Permissions", path: "/users/roles" },
      { name: "MDAs", path: "/users/mdas" },
    ],
    roles: ["admin", "sysadmin", "cabinet_secretariat"],
  },
  {
    icon: <BarChart3 size={20} />,
    name: "Reports & Analytics",
    path: "/reports",
    roles: ["president", "deputy_president", "prime_cabinet_secretary", "cabinet_secretariat", "admin", "sysadmin", "cabinet_secretary", "principal_secretary"],
  },
  {
    icon: <Shield size={20} />,
    name: "Audit Trail",
    path: "/audit",
    roles: ["sysadmin", "admin", "attorney_general", "cabinet_secretariat"],
  },
  {
    icon: <Settings size={20} />,
    name: "System Settings",
    path: "/settings",
    roles: ["sysadmin", "admin"],
  },
];

const systemItems: NavItem[] = [
  {
    icon: <Server size={20} />,
    name: "System Health",
    path: "/system/health",
    roles: ["sysadmin"],
  },
  {
    icon: <Database size={20} />,
    name: "Backup Management",
    path: "/system/backup",
    roles: ["sysadmin"],
  },
  {
    icon: <Activity size={20} />,
    name: "System Logs",
    path: "/system/logs",
    roles: ["sysadmin"],
  },
  {
    icon: <HardDrive size={20} />,
    name: "Storage Management",
    path: "/system/storage",
    roles: ["sysadmin"],
  },
  {
    icon: <Heart size={20} />,
    name: "Performance Monitor",
    path: "/system/performance",
    roles: ["sysadmin"],
  },
];

const legalItems: NavItem[] = [
  {
    icon: <Scale size={20} />,
    name: "Legal",
    subItems: [
      { name: "Legal Reviews", path: "/legal/reviews" },
      { name: "Certifications", path: "/legal/certifications" },
      { name: "Legal Opinions", path: "/legal/opinions" },
      { name: "Constitutional Compliance", path: "/legal/compliance" },
      { name: "Treaties & Agreements", path: "/legal/treaties" },
    ],
    roles: ["attorney_general"],
  },
];

// ============= MAIN COMPONENT =============
const AppSidebar: React.FC = () => {
  const { data: session } = useSession();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { getSystemName, getLogo, getPrimaryColor, settings } = useSystemSettings();
  const pathname = usePathname();
  
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  // Initialize component and get user role
  useEffect(() => {
    setMounted(true);
    if (session?.user?.role) {
      const normalized = normalizeRole(session.user.role);
      console.log("User role normalized:", session.user.role, "→", normalized);
      setUserRole(normalized);
    }
  }, [session]);

  // Check if user can see a menu item
  const canSeeMenuItem = useCallback((item: NavItem): boolean => {
    if (!userRole) return false;
    if (item.roles?.includes("all")) return true;
    if (!item.roles || item.roles.length === 0) return false;
    return item.roles.includes(userRole);
  }, [userRole]);

  // Memoize filtered items to prevent unnecessary re-renders
  const filteredNavItems = useMemo(() => navItems.filter(canSeeMenuItem), [canSeeMenuItem]);
  const filteredManagementItems = useMemo(() => managementItems.filter(canSeeMenuItem), [canSeeMenuItem]);
  const filteredSystemItems = useMemo(() => systemItems.filter(canSeeMenuItem), [canSeeMenuItem]);
  const filteredLegalItems = useMemo(() => legalItems.filter(canSeeMenuItem), [canSeeMenuItem]);
  const allManagementItems = useMemo(() => [...filteredManagementItems, ...filteredSystemItems], [filteredManagementItems, filteredSystemItems]);

  // Auto-open menus based on current path
  useEffect(() => {
    if (!mounted || !userRole) return;

    const newOpenMenus = new Set<string>();
    
    const checkPath = (items: NavItem[]) => {
      items.forEach(item => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(sub => sub.path === pathname);
          if (hasActiveSubItem) {
            newOpenMenus.add(item.name);
          }
        }
      });
    };

    checkPath(filteredNavItems);
    checkPath(allManagementItems);
    checkPath(filteredLegalItems);

    setOpenMenus(newOpenMenus);
  }, [pathname, mounted, userRole]); // Only depend on what actually changes

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  };

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.name}>
          {item.subItems ? (
            <>
              <button
                onClick={() => toggleMenu(item.name)}
                className={`menu-item group w-full ${
                  openMenus.has(item.name) ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
                style={
                  openMenus.has(item.name) && mounted
                    ? {
                        backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 12%, transparent)`,
                        color: getPrimaryColor(),
                      }
                    : undefined
                }
              >
                <span
                  className={`${
                    openMenus.has(item.name) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                  style={
                    openMenus.has(item.name) && mounted ? { color: getPrimaryColor() } : undefined
                  }
                >
                  {item.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text">{item.name}</span>
                    <ChevronDown
                      size={18}
                      className={`ml-auto transition-transform duration-200 ${
                        openMenus.has(item.name) ? "rotate-180" : ""
                      }`}
                      style={openMenus.has(item.name) && mounted ? { color: getPrimaryColor() } : undefined}
                    />
                  </>
                )}
              </button>

              {/* Pure CSS dropdown - no height calculations needed */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openMenus.has(item.name) && (isExpanded || isHovered || isMobileOpen)
                    ? "max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                        style={
                          isActive(subItem.path) && mounted
                            ? {
                                backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 12%, transparent)`,
                                color: getPrimaryColor(),
                              }
                            : undefined
                        }
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`menu-dropdown-badge ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              }`}
                              style={
                                mounted
                                  ? {
                                      backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 15%, transparent)`,
                                      color: getPrimaryColor(),
                                    }
                                  : undefined
                              }
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`menu-dropdown-badge ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              }`}
                              style={
                                mounted
                                  ? {
                                      backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 15%, transparent)`,
                                      color: getPrimaryColor(),
                                    }
                                  : undefined
                              }
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            item.path && (
              <Link
                href={item.path}
                className={`menu-item group ${
                  isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
                style={
                  isActive(item.path) && mounted
                    ? {
                        backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 12%, transparent)`,
                        color: getPrimaryColor(),
                      }
                    : undefined
                }
              >
                <span
                  className={`${
                    isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                  }`}
                  style={isActive(item.path) && mounted ? { color: getPrimaryColor() } : undefined}
                >
                  {item.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{item.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  // Loading state - show skeleton while role is being determined
  if (!mounted || !userRole) {
    return (
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
          ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
          <div className="animate-pulse flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            {(isExpanded || isHovered || isMobileOpen) && (
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // No access state - user has no visible menu items
  if (filteredNavItems.length === 0 && allManagementItems.length === 0 && filteredLegalItems.length === 0) {
    return (
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
          ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        <div className="py-8 flex justify-center">
          <div className="text-center">
            <p className="text-gray-500">No menu access</p>
            <p className="text-xs text-gray-400 mt-2">Role: {userRole}</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center space-x-3">
              <Image
                className="dark:hidden"
                src={getLogo('primary')}
                alt={`${getSystemName()} Logo`}
                width={40}
                height={40}
                priority
              />
              <Image
                className="hidden dark:block"
                src={getLogo('dark')}
                alt={`${getSystemName()} Logo`}
                width={40}
                height={40}
                priority
              />
              <span 
                className="text-xl font-semibold"
                style={{ color: getPrimaryColor() }}
              >
                {getSystemName()}
              </span>
            </div>
          ) : (
            <Image
              src={getLogo('icon')}
              alt={getSystemName()}
              width={32}
              height={32}
              priority
            />
          )}
        </Link>
      </div>

      {/* Version Badge */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="px-3 mb-4">
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 10%, transparent)`,
              color: getPrimaryColor() 
            }}
          >
            v{settings.version}
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Main Menu Section */}
            {filteredNavItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Main Menu"
                  ) : (
                    <Menu size={18} />
                  )}
                </h2>
                {renderMenuItems(filteredNavItems)}
              </div>
            )}

            {/* Legal Section - Attorney General only */}
            {filteredLegalItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Legal"
                  ) : (
                    <Scale size={18} />
                  )}
                </h2>
                {renderMenuItems(filteredLegalItems)}
              </div>
            )}

            {/* Management Section */}
            {allManagementItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Management"
                  ) : (
                    <Settings size={18} />
                  )}
                </h2>
                {renderMenuItems(allManagementItems)}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Footer with system info */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="mt-auto mb-4 px-3 py-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800">
          <p className="truncate">{getSystemName()} {settings.version}</p>
          <p className="truncate text-gray-500 capitalize">
            Role: {userRole.replace(/_/g, ' ')}
          </p>
          <p className="truncate text-gray-500">© {new Date().getFullYear()}</p>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;