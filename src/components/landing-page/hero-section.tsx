"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 px-6 overflow-hidden ">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8">
      
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
          <span className="text-balance text-foreground">Own your wealth</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Complete control over your finances. Track transactions, manage investments, monitor your portfolio, and make
          smarter financial decisions with Fynix.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base gap-2">
            Start Free Trial <ArrowRight size={18} />
          </Button>
          <Button variant="outline" className="px-8 py-6 text-base border-border hover:bg-secondary bg-transparent">
            Watch Demo
          </Button>
        </div>

        {/* Trust badges */}
        <div className="pt-8 flex flex-col md:flex-row gap-6 justify-center items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan"></div>
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange"></div>
            <span>Real-time tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple"></div>
            <span>Powerful analytics</span>
          </div>
        </div>
      </div>
    </section>
  )
}
