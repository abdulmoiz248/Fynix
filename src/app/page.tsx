import Header from "@/components/landing-page/header"
import HeroSection from "@/components/landing-page/hero-section"
import FeaturesGrid from "@/components/landing-page/features-grid"
import DashboardShowcase from "@/components/landing-page/dashboard-showcase"
import ForecastSection from "@/components/landing-page/forecast-section"

import CTASection from "@/components/landing-page/cta-section"
import Footer from "@/components/landing-page/footer"

export default function Home() {
  return (
    <main className="w-full bg-background min-h-screen">
      <Header />
      <HeroSection />
      <FeaturesGrid />
      <DashboardShowcase />
      <ForecastSection />
    
      <CTASection />
      <Footer />
    </main>
  )
}
