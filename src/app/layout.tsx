import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Enhanced Token Info - DEX Screener Marketplace",
  description: "Quickly update your DEX Screener token page with accurate and up-to-date info and socials",
  icons: {
    icon: "https://ext.same-assets.com/3250060909/952664227.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-background text-foreground"
      >
        <ClientBody>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </ClientBody>
      </body>
    </html>
  );
}
