import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "QRBharat — India's Smartest QR Code Platform",
  description:
    "Create UPI, WhatsApp, Wi-Fi & dynamic QR codes with real-time analytics — built for Bharat.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
