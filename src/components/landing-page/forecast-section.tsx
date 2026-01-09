"use client"

import { Card } from "@/components/ui/card"

export default function ForecastSection() {
  return (
    <section className="py-20 md:py-28 px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-cyan/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="text-balance text-foreground">Forecast your future</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Use advanced analytics and AI-powered insights to plan your financial goals with confidence.
          </p>
        </div>

        {/* Forecasting Card */}
        <Card className="p-8 md:p-12 bg-linear-to-br from-card to-card/50 border-border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">5-Year Wealth Projection</h3>
                <p className="text-muted-foreground">Based on your current savings rate and investment returns</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Current Portfolio</span>
                    <span className="text-sm font-semibold text-cyan">PKR 2,450,000</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">5-Year Projection</span>
                    <span className="text-sm font-semibold text-orange">PKR 3,890,000</span>
                  </div>
                  <div className="text-sm text-purple">Estimated growth: +58.8% with 8% annual return</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Contribution</p>
                  <p className="text-lg font-bold text-cyan">PKR 15,000</p>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Annual Return Rate</p>
                  <p className="text-lg font-bold text-orange">8%</p>
                </div>
              </div>
            </div>

            {/* Right Side - Chart */}
            <div className="relative h-64 md:h-80">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                {/* Grid */}
                <g stroke="rgb(60, 60, 80)" strokeWidth="1" opacity="0.3">
                  <line x1="50" y1="0" x2="50" y2="280" />
                  <line x1="50" y1="280" x2="380" y2="280" />
                </g>

                {/* Area Chart */}
                <defs>
                  <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "rgb(0, 200, 220)", stopOpacity: 0.4 }} />
                    <stop offset="100%" style={{ stopColor: "rgb(0, 200, 220)", stopOpacity: 0.05 }} />
                  </linearGradient>
                </defs>

                {/* Data points and lines */}
                <polyline
                  points="50,240 120,200 190,160 260,100 330,60 380,20"
                  fill="url(#forecastGradient)"
                  stroke="rgb(0, 200, 220)"
                  strokeWidth="3"
                />

                {/* Labels */}
                <text x="50" y="300" textAnchor="middle" fill="rgb(120, 120, 140)" fontSize="12">
                  Now
                </text>
                <text x="190" y="300" textAnchor="middle" fill="rgb(120, 120, 140)" fontSize="12">
                  3 Years
                </text>
                <text x="380" y="300" textAnchor="middle" fill="rgb(120, 120, 140)" fontSize="12">
                  5 Years
                </text>

                {/* Y-axis labels */}
                <text x="45" y="285" textAnchor="end" fill="rgb(120, 120, 140)" fontSize="11">
                  0%
                </text>
                <text x="45" y="150" textAnchor="end" fill="rgb(120, 120, 140)" fontSize="11">
                  50%
                </text>
                <text x="45" y="25" textAnchor="end" fill="rgb(120, 120, 140)" fontSize="11">
                  100%
                </text>
              </svg>
            </div>
          </div>
        </Card>

        {/* Three Column Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6 bg-card border-border">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-cyan/20 to-purple/20 flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold mb-2">Smart Goals</h3>
            <p className="text-sm text-muted-foreground">
              Set and track financial goals with AI-powered recommendations
            </p>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-orange/20 to-cyan/20 flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold mb-2">Portfolio Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized investment recommendations based on your risk profile
            </p>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-purple/20 to-orange/20 flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-semibold mb-2">Wealth Growth</h3>
            <p className="text-sm text-muted-foreground">
              Track your progress toward financial independence with real-time metrics
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
