import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Attntion · your weekly LinkedIn muse",
    template: "%s · Attntion",
  },
  description:
    "Your muse asks one question a week, listens to your answer, and composes a LinkedIn post in your own words, shaped by what is winning in your niche.",
};

export const viewport: Viewport = {
  themeColor: "#f3ede2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
