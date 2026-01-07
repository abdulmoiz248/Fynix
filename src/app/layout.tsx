import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import QueryProvider from "@/components/providers/QueryProvider";

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
      <body className="bg-[#050505] text-slate-100 antialiased">
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
