import {
  AudienceCards,
  FinalCta,
  Hero,
  MetricsStrip,
  PricingTeaser,
  SiteFooter,
  SiteHeader,
  SurfaceShowcase,
  SystemColumns,
} from "@/components/marketing";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <MetricsStrip />
        <SystemColumns />
        <AudienceCards />
        <SurfaceShowcase />
        <PricingTeaser />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
