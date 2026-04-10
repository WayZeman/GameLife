import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "GameLife",
  title: {
    default: "GameLife — гра життєвих досягнень",
    template: "%s · GameLife",
  },
  description:
    "Персональні завдання на день, тиждень і місяць, досвід (XP), рівні та ліга гравців. Перетвори звички на гру.",
  keywords: [
    "досягнення",
    "звички",
    "цілі",
    "продуктивність",
    "українською",
    "XP",
    "гейміфікація",
  ],
  authors: [{ name: "GameLife" }],
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "GameLife",
    title: "GameLife — гра життєвих досягнень",
    description:
      "Персональні завдання, рівні та ліга. Розвивайся крок за кроком.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GameLife — гра життєвих досягнень",
    description:
      "Персональні завдання, рівні та ліга. Розвивайся крок за кроком.",
  },
  appleWebApp: {
    capable: true,
    title: "GameLife",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#141418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
