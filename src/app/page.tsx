import Link from "next/link";
import { ArrowRight, TrendingUp, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg--to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Fynix
          </h1>
          <Link
            href="/signup"
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your <span className="bg--to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI Finance Assistant</span>
          </h2>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Manage your finances smarter. Get real-time insights, personalized recommendations, and automated financial tracking.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg--to-r from-blue-600 to-cyan-600 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition transform hover:scale-105"
          >
            Start Free <ArrowRight className="w-5 h-5" />
          </Link>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm hover:border-blue-500/50 transition">
              <TrendingUp className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
              <p className="text-slate-400">
                Get instant insights into your spending patterns and financial health
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm hover:border-cyan-500/50 transition">
              <Zap className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Powered</h3>
              <p className="text-slate-400">
                Let AI analyze your finances and provide personalized recommendations
              </p>
            </div>

            <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm hover:border-blue-500/50 transition">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-slate-400">
                Enterprise-grade security with bank-level encryption for your data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 px-6 text-center text-slate-400">
        <p>&copy; 2025 Fynix. All rights reserved.</p>
      </footer>
    </div>
  );
}
