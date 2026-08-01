import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { getSiteUrl } from "@/lib/site";

const DESCRIPTION =
  "Deploy backend applications from GitHub in one click, with generous compute, build logs, CI/CD, stable URLs, and custom domains.";

export const metadata: Metadata = {
  title: "Fleet — Your backend, live in one click",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fleet — Your backend, live in one click",
    description: DESCRIPTION,
    url: "/",
  },
};

export default function HomePage() {
  const site = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fleet",
    url: site.toString(),
    description: DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${site}login` },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
