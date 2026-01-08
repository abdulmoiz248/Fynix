"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import { navItems } from "./Sidebar";

interface HeaderProps {
  toggleMobile: () => void;
}

export default function Header({ toggleMobile }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const title = navItems.find((item) => item.href === pathname)?.label || "Dashboard";

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-black/70 backdrop-blur-xl">
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile Hamburger */}
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-semibold truncate">{title}</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 hidden md:block">
              Financial insights and analytics at your fingertips
            </p>
          </div>
        </div>

        {/* User Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:inline text-sm font-medium">{userName}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-800">
                  <p className="text-sm font-medium text-slate-200">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-300 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
