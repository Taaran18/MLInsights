import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/site/AppToaster";
import { PreferencesSync } from "@/components/theme/ThemeControls";
import { BOOT_SCRIPT } from "@/lib/boot-script";
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const defaultTitle =
  "MLInsights: Train and Compare ML Models From Any Spreadsheet";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: defaultTitle, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  keywords: [
    "machine learning",
    "no-code machine learning",
    "AutoML",
    "train ML models online",
    "CSV analysis",
    "Excel data analysis",
    "data cleaning tool",
    "model comparison",
    "classification",
    "regression",
    "clustering",
    "scikit-learn",
    "XGBoost",
    "LightGBM",
    "CatBoost",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: defaultTitle,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <PreferencesSync />
        <a
          href="#main"
          className="sr-only rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100"
        >
          Skip to Content
        </a>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
