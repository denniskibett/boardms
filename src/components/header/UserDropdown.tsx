"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { usePermissions } from "@/hooks/usePermissions";

const itemCls =
  "flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white";
const iconCls = "h-5 w-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300";

function imageSrc(image?: string | null) {
  if (!image) return null;
  if (/^https?:\/\//.test(image) || image.startsWith("/")) return image;
  return `/images/users/${image}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const { data: session, status } = useSession();
  const { can } = usePermissions();

  if (status === "loading") {
    return (
      <div className="flex items-center">
        <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="ml-3 hidden h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:block" />
      </div>
    );
  }
  if (!session?.user) return null;

  const user = session.user;
  const name = user.name || user.email || "User";
  const src = imageSrc(user.image);
  const close = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((o) => !o);
        }}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-theme-sm font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          {src && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" width={44} height={44} className="h-11 w-11 object-cover" onError={() => setImgFailed(true)} />
          ) : (
            initials(name)
          )}
        </span>
        <span className="mr-1 hidden max-w-[120px] truncate font-medium text-theme-sm sm:block">{name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={close}
        className="absolute right-0 z-50 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-3 py-2">
          <span className="block truncate font-medium text-gray-700 text-theme-sm dark:text-white">{name}</span>
          <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">{user.email}</span>
          {user.role && (
            <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-theme-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
              {user.role}
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-3 dark:border-gray-800">
          <li>
            <DropdownItem onItemClick={close} tag="a" href="/profile" className={itemCls}>
              <UserCircle className={iconCls} />
              My profile
            </DropdownItem>
          </li>
          {can("settings") && (
            <li>
              <DropdownItem onItemClick={close} tag="a" href="/settings" className={itemCls}>
                <Settings className={iconCls} />
                System settings
              </DropdownItem>
            </li>
          )}
        </ul>

        <button
          type="button"
          onClick={() => {
            close();
            signOut({ callbackUrl: "/signin" });
          }}
          className="group mt-3 flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm transition-colors hover:bg-error-50 hover:text-error-600 dark:text-gray-300 dark:hover:bg-error-500/15 dark:hover:text-error-400"
        >
          <LogOut className="h-5 w-5 text-gray-500 group-hover:text-error-600 dark:text-gray-400 dark:group-hover:text-error-400" />
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
