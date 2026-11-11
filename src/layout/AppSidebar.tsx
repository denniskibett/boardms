"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { Action, ModuleKey } from "@/lib/rbac";
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
  Building2,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; perm?: [ModuleKey, Action]; pro?: boolean; new?: boolean }[];
  /** Module (and action) needed to see this item. */
  perm: [ModuleKey, Action?];
};

// ============= NAVIGATION ITEMS (visibility comes from role permissions) =============
const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, name: "Dashboard", path: "/dashboard", perm: ["dashboard"] },
  { icon: <Calendar size={20} />, name: "Meetings", path: "/meetings", perm: ["meetings"] },
  {
    icon: <BookOpen size={20} />,
    name: "Agenda & Books",
    perm: ["agenda"],
    subItems: [
      { name: "All Agenda", path: "/agenda" },
      { name: "Create Agenda", path: "/agenda/create", perm: ["agenda", "create"] },
      { name: "Meeting Books", path: "/books", perm: ["books", "view"] },
    ],
  },
  {
    icon: <FileText size={20} />,
    name: "Cabinet Memos",
    perm: ["memos"],
    subItems: [
      { name: "My Memos", path: "/memos" },
      { name: "All Memos", path: "/memos/all" },
    ],
  },
  { icon: <CheckSquare size={20} />, name: "Decisions", path: "/decisions", perm: ["decisions"] },
  { icon: <Mail size={20} />, name: "Action Letters", path: "/action-letters", perm: ["actionLetters"] },
  { icon: <Users2 size={20} />, name: "Committees", path: "/committees", perm: ["committees"] },
  { icon: <Globe size={20} />, name: "Resources", path: "/resources", perm: ["resources"] },
];

const managementItems: NavItem[] = [
  {
    icon: <Users size={20} />,
    name: "User Management",
    perm: ["users"],
    subItems: [
      { name: "All Users", path: "/users" },
      { name: "Roles & Permissions", path: "/users/roles", perm: ["roles", "view"] },
    ],
  },
  { icon: <Building2 size={20} />, name: "MDAs", path: "/mdas", perm: ["mdas"] },
  { icon: <BarChart3 size={20} />, name: "Reports & Analytics", path: "/reports", perm: ["reports"] },
  { icon: <Shield size={20} />, name: "Audit Trail", path: "/audit", perm: ["audit"] },
  { icon: <Settings size={20} />, name: "System Settings", path: "/settings", perm: ["settings"] },
];

// ============= MAIN COMPONENT =============
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { getSystemName, getLogo, getPrimaryColor, settings } = useSystemSettings();
  const pathname = usePathname();
  const { can, role: userRole } = usePermissions();

  const [mounted, setMounted] = useState(false);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Items (and sub-items) the current role can see.
  const visible = useCallback(
    (items: NavItem[]) =>
      items
        .filter((item) => can(item.perm[0], item.perm[1] ?? "view"))
        .map((item) =>
          item.subItems
            ? { ...item, subItems: item.subItems.filter((s) => !s.perm || can(s.perm[0], s.perm[1])) }
            : item,
        ),
    [can],
  );

  const filteredNavItems = useMemo(() => visible(navItems), [visible]);
  const allManagementItems = useMemo(() => visible(managementItems), [visible]);
  const filteredLegalItems: NavItem[] = [];

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