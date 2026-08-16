import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sctoGroteskA = localFont({
  src: [
    {
      path: "../../SctoGroteskA/SctoGroteskA-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../SctoGroteskA/SctoGroteskA-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../SctoGroteskA/SctoGroteskA-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-scto-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "wsomeone",
  description: "wsomeone — tactile connection cards",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/icon.png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "wsomeone",
  },
};

export const viewport: Viewport = {
  themeColor: "#EDEDEF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sctoGroteskA.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
