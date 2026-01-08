"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Receipt,
  Target,
  BadgeDollarSign,
  TrendingUp,
  PieChart,
  FileText,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "text-indigo-400" },
  { href: "/dashboard/transactions", label: "Transactions", icon: Receipt, color: "text-blue-400" },
  { href: "/dashboard/budget", label: "Budget", icon: Target, color: "text-green-400" },
  { href: "/dashboard/invoices", label: "Invoices", icon: BadgeDollarSign, color: "text-orange-400" },
  { href: "/dashboard/stocks", label: "Stocks", icon: TrendingUp, color: "text-cyan-400" },
  { href: "/dashboard/mutualfunds", label: "Mutual Funds", icon: PieChart, color: "text-purple-400" },
  { href: "/dashboard/books", label: "Books", icon: FileText, color: "text-yellow-400" },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggleCollapse: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  setMobileOpen,
  toggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col
        ${collapsed ? "lg:w-20 w-64" : "w-64"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Fynix Logo" 
                  width={40} 
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-xl font-bold bg-linear-to-r from-indigo-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                    Fynix
                  </h1>
                 
                </div>
              </div>
            )}
           
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:block p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                } ${collapsed ? "lg:justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? item.color : ""}`} />
                <span className={`font-medium ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export { navItems };
