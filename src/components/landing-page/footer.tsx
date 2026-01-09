"use client"

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: "rgb(0, 200, 220)" }} />
                      <stop offset="100%" style={{ stopColor: "rgb(255, 130, 30)" }} />
                    </linearGradient>
                  </defs>
                  <path d="M 20 5 L 28 13 L 24 13 L 24 25 L 16 25 L 16 13 L 12 13 Z" fill="url(#footerGradient)" />
                </svg>
              </div>
              <span className="text-lg font-bold">Fynix</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Master your wealth with intelligent financial tools for Pakistan.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2025 Fynix. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition">
              Twitter
            </a>
            <a href="#" className="hover:text-foreground transition">
              LinkedIn
            </a>
            <a href="#" className="hover:text-foreground transition">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
