"use client";

import { useState } from "react";

import { PhoneFrame } from "@/components/brand/phone-frame";
import { Segmented } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { BrowserFrame } from "./browser-frame";
import { PanelMock } from "./panel-mock";
import { ClientHomeMock, CompanyPageMock } from "./phone-mocks";
import { Container, SectionHeading } from "./section";
import { Reveal } from "./reveal";

type Surface = "app" | "site" | "panel";

const CAPTION_KEYS: Record<Surface, string> = {
  app: "landing.showcase.appCaption",
  site: "landing.showcase.siteCaption",
  panel: "landing.showcase.panelCaption",
};

export function SurfaceShowcase() {
  const t = useT();
  const [surface, setSurface] = useState<Surface>("app");

  return (
    <section className="border-b border-line bg-paper">
      <Container className="py-14 sm:py-20">
        <Reveal className="flex flex-col items-center">
          <SectionHeading
            align="center"
            title={t("landing.showcase.title")}
            titleItalic={t("landing.showcase.titleItalic")}
            lead={t("landing.showcase.lead")}
          />

          <Segmented
            className="mt-7"
            value={surface}
            onChange={(value) => setSurface(value as Surface)}
            options={[
              { value: "app", label: t("landing.showcase.app") },
              { value: "site", label: t("landing.showcase.site") },
              { value: "panel", label: t("nav.panel") },
            ]}
          />
        </Reveal>

        <div className="mt-10 rounded-2xl border border-line bg-board p-4 sm:p-8 lg:p-12">
          <div key={surface} className="animate-fade-in flex justify-center">
            {surface === "app" ? (
              <PhoneFrame>
                <ClientHomeMock />
              </PhoneFrame>
            ) : null}
            {surface === "site" ? (
              <PhoneFrame>
                <CompanyPageMock />
              </PhoneFrame>
            ) : null}
            {surface === "panel" ? (
              <BrowserFrame url="panel.kalendo.pl" className="max-w-[900px]">
                <PanelMock />
              </BrowserFrame>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-center text-[13px] text-muted">
          {t(CAPTION_KEYS[surface])}
        </p>
      </Container>
    </section>
  );
}
