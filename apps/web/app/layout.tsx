import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "BhuSetu 3D — Evidence-Backed 3D Property Intelligence Platform",
  description:
    "Transform property, building, parcel, infrastructure, survey, and spatial data into an interactive, queryable 3D environment.",
  applicationName: "BhuSetu 3D",
  keywords: [
    "BhuSetu 3D",
    "3D Property Intelligence",
    "3D Urban Cadastre",
    "Spatial Intelligence",
    "PostGIS 3D",
    "Digital Twin",
    "Cadastral Verification",
    "Vertical Property Mapping",
  ],
  authors: [{ name: "BhuSetu 3D Architecture Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/bhusetu-logo-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "BhuSetu 3D — Evidence-Backed 3D Property Intelligence Platform",
    description:
      "Transform property, building, parcel, infrastructure, survey, and spatial data into an interactive, queryable 3D environment.",
    type: "website",
    siteName: "BhuSetu 3D",
    locale: "en_US",
    images: [
      {
        url: "/brand/bhusetu-og.png",
        width: 1200,
        height: 630,
        alt: "BhuSetu 3D — Spatial Cadastral Intelligence Official Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BhuSetu 3D — Evidence-Backed 3D Property Intelligence Platform",
    description:
      "Transform property, building, parcel, infrastructure, survey, and spatial data into an interactive, queryable 3D environment.",
    images: ["/brand/bhusetu-og.png"],
  },
};

import { NavigationDrawerProvider } from "@/hooks/useNavigationDrawer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#141816] text-[#F4F0E8] flex flex-col antialiased">
        <AuthProvider>
          <NavigationDrawerProvider>
            <TopBar />
            <div className="flex-1 flex flex-col w-full overflow-hidden">{children}</div>
          </NavigationDrawerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
