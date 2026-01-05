import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Fynix - AI Finance Assistant",
  description: "Your intelligent financial assistant powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
