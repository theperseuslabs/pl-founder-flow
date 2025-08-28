import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import Script from "next/script";

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal"],
  variable: "--font-roboto-condensed",
});

export const metadata: Metadata = {
  title: "Easy Marketing Automation",
  description: "Find and Message Your First Customers on Reddit – Instantly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          defer
          data-domain="easymarketingautomations.com"
          src="https://pl-plausible.194.195.92.250.sslip.io/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js"
        />
        <Script id="plausible-init">
          {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
        </Script>
      </head>
      <body
        className={`${robotoCondensed.variable} font-sans`}
        style={{
          width: "100%",
          margin: 0,
          padding: 0,
        }}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
