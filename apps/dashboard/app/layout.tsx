import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fleet",
  description:
    "Connect GitHub, pick a repo, and get a stable live URL — with build logs, env vars, push-to-deploy, and zero-downtime rollouts.",
  icons: {
    icon: { url: "/sailboat.svg", type: "image/svg+xml" },
    shortcut: "/sailboat.svg",
    apple: "/sailboat.svg",
  },
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
