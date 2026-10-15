import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Geist_Mono, Sorts_Mill_Goudy } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";
import "./landing.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  style: "normal",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const sortsMillGoudy = Sorts_Mill_Goudy({
  variable: "--font-sorts-mill-goudy",
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  fallback: ["Georgia", "serif"],
  display: "swap",
});

const DESCRIPTION =
  "Deploy backend applications from GitHub in one click, with generous compute, build logs, CI/CD, stable URLs, and custom domains.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Fleet", template: "%s · Fleet" },
  description: DESCRIPTION,
  icons: {
    icon: { url: "/images/brand/icon.svg", type: "image/svg+xml" },
    shortcut: "/images/brand/icon.svg",
    apple: "/images/brand/icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Fleet",
    title: "Fleet",
    description: DESCRIPTION,
    images: [{ url: "/images/brand/icon.png", width: 512, height: 512, alt: "Fleet" }],
  },
  twitter: {
    card: "summary",
    title: "Fleet",
    description: DESCRIPTION,
    images: ["/images/brand/icon.png"],
  },
  robots: { index: true, follow: true },
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${geistMono.variable} ${sortsMillGoudy.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster />
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
