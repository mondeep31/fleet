import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { getSiteUrl } from "@/lib/site";

const DESCRIPTION =
  "Connect GitHub, pick a repo, and get a stable live URL — with build logs, env vars, push-to-deploy, and zero-downtime rollouts.";

export const metadata: Metadata = {
  title: "Fleet — From GitHub repo to live URL",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fleet — From GitHub repo to live URL",
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
