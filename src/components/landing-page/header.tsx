"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Header() {
    const router=useRouter()
  return (
    <header className="fixed top-0 w-full z-50 bg-black text-bold backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
         <img src="/logo.png" alt="Fynix Logo" className="w-8 h-8 object-contain rounded-full" />
          <span className="text-xl font-bold  text-background">
            Fynix
          </span>
        </div>


        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
         
          <Button
          onClick={() => router.push('/signup')}
           className="bg-white text-black font-bold">Get Started</Button>
        </div>
      </div>
    </header>
  )
}
