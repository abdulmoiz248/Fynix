"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Wallet, BarChart3, PieChart, DollarSign, BookOpen, Receipt, Repeat2, Bell } from "lucide-react"

const features = [
  {
    icon: Wallet,
    title: "Transactions",
    description: "Track every transaction with detailed categorization and instant updates across all accounts.",
  },
  {
    icon: TrendingUp,
    title: "Stocks (PSX)",
    description:
      "Monitor Pakistan Stock Exchange holdings with real-time prices, performance tracking, and portfolio insights.",
  },
  {
    icon: PieChart,
    title: "Mutual Funds",
    description: "Manage your mutual fund investments with detailed performance metrics and allocation analysis.",
  },
  {
    icon: DollarSign,
    title: "Dividends",
    description: "Track dividend income from stocks and funds with automatic calculations and tax reporting.",
  },
  {
    icon: Receipt,
    title: "Invoices",
    description: "Create, manage, and track invoices with automated reminders and payment tracking.",
  },
  {
    icon: BarChart3,
    title: "Budget & Analytics",
    description: "Set budgets, track spending, and get insights into your financial habits with detailed analytics.",
  },
  {
    icon: Repeat2,
    title: "Recurring Payments",
    description: "Automate recurring payments and track subscriptions with smart reminders.",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Get timely notifications for bill due dates, budget alerts, and important financial events.",
  },
  {
    icon: BookOpen,
    title: "Accounting Books",
    description: "Complete ledger management with journal entries, balance sheets, and income statements.",
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="text-balance text-foreground">Simplify your money</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage, track, and grow your wealth in one powerful platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="p-6 bg-card border-border hover:border-purple/30 transition-colors group">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan/20 to-purple/20 flex items-center justify-center group-hover:from-cyan/30 group-hover:to-purple/30 transition-colors">
                    <Icon className="w-6 h-6 text-cyan" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
