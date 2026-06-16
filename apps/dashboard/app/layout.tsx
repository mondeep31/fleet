import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Connect GitHub, pick a repo, and get a stable live URL — with build logs, env vars, push-to-deploy, and zero-downtime rollouts.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Fleet", template: "%s · Fleet" },
  description: DESCRIPTION,
  icons: {
    icon: { url: "/sailboat.svg", type: "image/svg+xml" },
    shortcut: "/sailboat.svg",
    apple: "/sailboat.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Fleet",
    title: "Fleet",
    description: DESCRIPTION,
    images: [{ url: "/sailboat.png", width: 512, height: 512, alt: "Fleet" }],
  },
  twitter: {
    card: "summary",
    title: "Fleet",
    description: DESCRIPTION,
    images: ["/sailboat.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
