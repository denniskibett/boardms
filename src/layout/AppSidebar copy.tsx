"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useSystemSettings } from "@/context/SystemSettingsContext";
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
  FileSpreadsheet,
  CheckSquare,
  Mail,
  Menu,
  BookOpen,
  ClipboardList,
  GitBranch,
  Globe,
  Home,
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <FileText size={20} />,
    name: "Government Memos",
    subItems: [
      { name: "My Memos", path: "/memos" },
      { name: "All Memos", path: "/memos/all" },
    ],
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
  },
  {
    icon: <Users2 size={20} />,
    name: "Committees",
    subItems: [
      { name: "Committee List", path: "/committees" },
      { name: "My Committees", path: "/committees/my" },
      { name: "Assign Members", path: "/committees/assign" },
    ],
  },
  {
    icon: <Calendar size={20} />,
    name: "Meetings",
    path: "/meetings",
  },
  {
    icon: <Globe size={20} />,
    name: "Resources",
    path: "/resources",
  },
  { 
    icon: <CheckSquare size={20} />,
    name: "Decisions",
    path: "/decisions",
  },
  {
    icon: <Mail size={20} />,
    name: "Action Letters",
    path: "/action-letters",
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
  },
  {
    icon: <BarChart3 size={20} />,
    name: "Reports & Analytics",
    path: "/reports",
  },
  {
    icon: <Shield size={20} />,
    name: "Audit Trail",
    path: "/audit",
  },
  {
    icon: <Settings size={20} />,
    name: "System Settings",
    path: "/settings",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { 
    getSystemName, 
    getLogo, 
    getPrimaryColor, 
    getSecondaryColor,
    settings 
  } = useSystemSettings();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "management";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "management"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : managementItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "management",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "management") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "management"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
              style={
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? { 
                      backgroundColor: mounted ? `color-mix(in srgb, ${getPrimaryColor()} 12%, transparent)` : undefined,
                      color: mounted ? getPrimaryColor() : undefined 
                    }
                  : undefined
              }
            >
              <span
                className={`${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
                style={
                  openSubmenu?.type === menuType && openSubmenu?.index === index && mounted
                    ? { color: getPrimaryColor() }
                    : undefined
                }
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown
                  size={18}
                  className={`ml-auto transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180"
                      : ""
                  }`}
                  style={
                    openSubmenu?.type === menuType && openSubmenu?.index === index && mounted
                      ? { color: getPrimaryColor() }
                      : undefined
                  }
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
                style={
                  isActive(nav.path) && mounted
                    ? { 
                        backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 12%, transparent)`,
                        color: getPrimaryColor() 
                      }
                    : undefined
                }
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                  style={
                    isActive(nav.path) && mounted
                      ? { color: getPrimaryColor() }
                      : undefined
                  }
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
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
                              color: getPrimaryColor() 
                            }
                          : undefined
                      }
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto menu-dropdown-badge ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            }`}
                            style={
                              isActive(subItem.path) && mounted
                                ? { 
                                    backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 20%, transparent)`,
                                    color: getPrimaryColor() 
                                  }
                                : mounted
                                ? { 
                                    backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 15%, transparent)`,
                                    color: getPrimaryColor() 
                                  }
                                : undefined
                            }
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto menu-dropdown-badge ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            }`}
                            style={
                              isActive(subItem.path) && mounted
                                ? { 
                                    backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 20%, transparent)`,
                                    color: getPrimaryColor() 
                                  }
                                : mounted
                                ? { 
                                    backgroundColor: `color-mix(in srgb, ${getPrimaryColor()} 15%, transparent)`,
                                    color: getPrimaryColor() 
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
          )}
        </li>
      ))}
    </ul>
  );

  // Don't render dynamic content until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <aside
        className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
          ${
            isExpanded || isMobileOpen
              ? "w-[290px]"
              : isHovered
              ? "w-[290px]"
              : "w-[90px]"
          }
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`py-8 flex ${
            !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
        >
          <Link href="/dashboard">
            {isExpanded || isHovered || isMobileOpen ? (
              <div className="flex items-center space-x-2">
                <Image
                  className="dark:hidden"
                  src="/images/logo/logo.svg"
                  alt="Logo"
                  width={32}
                  height={32}
                />
                <span className="text-xl font-semibold text-gray-800 dark:text-white">
                  Loading...
                </span>
              </div>
            ) : (
              <Image
                src="/images/logo/logo.svg"
                alt="Logo"
                width={32}
                height={32}
              />
            )}
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="flex items-center space-x-3">
                <Image
                  className="dark:hidden"
                  src={getLogo('primary')}
                  alt={`${getSystemName()} Logo`}
                  width={40}
                  height={40}
                />
                <Image
                  className="hidden dark:block"
                  src={getLogo('dark')}
                  alt={`${getSystemName()} Logo`}
                  width={40}
                  height={40}
                />
                <span 
                  className="text-xl font-semibold"
                  style={{ color: getPrimaryColor() }}
                >
                  {getSystemName()}
                </span>
              </div>
            </>
          ) : (
            <Image
              src={getLogo('icon')}
              alt={getSystemName()}
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Version badge */}
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

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
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
              {renderMenuItems(navItems, "main")}
            </div>

            <div className="">
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
              {renderMenuItems(managementItems, "management")}
            </div>
          </div>
        </nav>
      </div>

      {/* Footer with system info */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="mt-auto mb-4 px-3 py-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800">
          <p className="truncate">{getSystemName()} {settings.version}</p>
          <p className="truncate text-gray-500">© {new Date().getFullYear()}</p>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;