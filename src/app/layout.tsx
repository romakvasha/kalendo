import type { Metadata, Viewport } from "next";
import { Onest, Instrument_Serif, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// Instrument Serif has no Cyrillic glyphs; this carries the display face
// through Ukrainian copy via per-glyph fallback.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kalendo — system rezerwacji wizyt dla firm usługowych",
    template: "%s · Kalendo",
  },
  description:
    "Rezerwacje online 24/7, kalendarz zespołu, przypomnienia SMS i płatności — jeden system dla salonu, gabinetu i warsztatu.",
  applicationName: "Kalendo",
  appleWebApp: { capable: true, title: "Kalendo", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      data-scroll-behavior="smooth"
      className={`${onest.variable} ${instrumentSerif.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
