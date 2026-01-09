"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CTASection() {
  return (
    <section className="py-20 md:py-28 px-6 relative overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-4xl md:text-6xl font-bold">
          <span className="text-balance text-foreground">Ready to take control?</span>
        </h2>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of Pakistanis who are mastering their finances with Fynix. Start your free trial today—no
          credit card required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base gap-2">
            Start Free Trial Now <ArrowRight size={18} />
          </Button>
          <Button variant="outline" className="px-8 py-6 text-base border-border hover:bg-secondary bg-transparent">
            Schedule a Demo
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          ✓ No credit card required · ✓ 30-day free trial · ✓ Cancel anytime
        </p>
      </div>
    </section>
  )
}
