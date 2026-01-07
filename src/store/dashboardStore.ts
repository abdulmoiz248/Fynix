"use client";

import { create } from "zustand";

type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";
type Density = "compact" | "cozy" | "spacious";
type ThemeMode = "dark";
export type DashboardTab =
  | "overview"
  | "cash"
  | "recurring"
  | "invoices"
  | "stocks"
  | "mutual"
  | "fees"
  | "transactions";

type DashboardState = {
  timeRange: TimeRange;
  currency: string;
  density: Density;
  theme: ThemeMode;
  activeTab: DashboardTab;
  setTimeRange: (value: TimeRange) => void;
  setCurrency: (value: string) => void;
  setDensity: (value: Density) => void;
  setTheme: (value: ThemeMode) => void;
  setActiveTab: (tab: DashboardTab) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  timeRange: "3m",
  currency: "PKR",
  density: "cozy",
  theme: "dark",
  activeTab: "overview",
  setTimeRange: (value) => set({ timeRange: value }),
  setCurrency: (value) => set({ currency: value }),
  setDensity: (value) => set({ density: value }),
  setTheme: (value) => set({ theme: value }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

