"use client"

import { Card } from "@/components/ui/card"

export default function DashboardShowcase() {
  return (
    <section id="dashboard" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="text-balance text-foreground">Track everything at a glance</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Beautiful, intuitive dashboards that give you complete visibility into your financial health.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Overview */}
          <Card className="p-8 bg-card border-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple/5 rounded-full blur-2xl -z-10"></div>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Portfolio Value</h3>
              <div className="text-4xl font-bold">PKR 2,450,000</div>
              <div className="text-sm text-cyan mt-1">↑ 12.5% this month</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Stocks (PSX)</span>
                <span className="font-semibold">45%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[45%] bg-linear-to-r from-cyan to-purple"></div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-muted-foreground">Mutual Funds</span>
                <span className="font-semibold">35%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[35%] bg-linear-to-r from-orange to-cyan"></div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-muted-foreground">Savings</span>
                <span className="font-semibold">20%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[20%] bg-linear-to-r from-purple to-orange"></div>
              </div>
            </div>
          </Card>

          {/* Transactions & Budget */}
          <Card className="p-8 bg-card border-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan/5 rounded-full blur-2xl -z-10"></div>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Monthly Budget</h3>
              <div className="text-4xl font-bold">PKR 85,000</div>
              <div className="text-sm text-orange mt-1">Spent: PKR 54,200 (63%)</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Groceries</span>
                <span className="font-semibold">18%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[18%] bg-cyan"></div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-muted-foreground">Utilities</span>
                <span className="font-semibold">22%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[22%] bg-orange"></div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-muted-foreground">Entertainment</span>
                <span className="font-semibold">12%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[12%] bg-purple"></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 bg-card border-border">
            <h3 className="text-lg font-semibold mb-6">Income vs Expenses</h3>
            <div className="space-y-4">
              <div className="flex items-end justify-between h-48">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => (
                  <div key={month} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex gap-1 h-32">
                      <div
                        className="flex-1 bg-linear-to-t from-cyan to-cyan/30 rounded-sm"
                        style={{ height: `${40 + i * 10}%` }}
                      ></div>
                      <div
                        className="flex-1 bg-linear-to-t from-orange to-orange/30 rounded-sm"
                        style={{ height: `${35 + i * 8}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{month}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan rounded-sm"></div>
                <span className="text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange rounded-sm"></div>
                <span className="text-muted-foreground">Expenses</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-card border-border">
            <h3 className="text-lg font-semibold mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {[
                { title: "Salary Deposit", amount: "+PKR 150,000", type: "income" },
                { title: "Grocery Store", amount: "-PKR 5,200", type: "expense" },
                { title: "Stock Purchase", amount: "-PKR 25,000", type: "investment" },
                { title: "Dividend Payment", amount: "+PKR 3,500", type: "income" },
                { title: "Electricity Bill", amount: "-PKR 4,200", type: "expense" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                  <div
                    className={`font-semibold ${tx.type === "income" ? "text-cyan" : tx.type === "investment" ? "text-purple" : "text-orange"}`}
                  >
                    {tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
