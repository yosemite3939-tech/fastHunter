import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteEntryIntro } from "@/components/layout/site-entry-intro";

export const metadata: Metadata = {
  metadataBase: new URL("https://fasthunter.site"),
  title: {
    default: "fast\\Hunter. Download Manager",
    template: "%s // fast\\Hunter.",
  },
  description: "A minimalist download manager built for speed, clarity, and control.",
  openGraph: {
    title: "fast\\Hunter. Download Manager",
    description: "Download faster. Stay in control.",
    url: "https://fasthunter.site",
    siteName: "fast\\Hunter.",
    images: [{ url: "/assets/promo-marquee-1400x560.png", width: 1400, height: 560 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "fast\\Hunter. Download Manager",
    description: "A minimalist download manager built for speed, clarity, and control.",
    images: ["/assets/promo-marquee-1400x560.png"],
  },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SiteEntryIntro />
        <a className="skip-link" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
