'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ 
          margin: 0, 
          padding: 0,
          fontSize: "16px", // Mobile-First: Base Font Size
          lineHeight: 1.5,
        }}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <Navigation />
          <main style={{
            padding: "16px", // Mobile-First: Screen Padding
            maxWidth: "1200px",
            margin: "0 auto",
            minHeight: "calc(100vh - 60px)", // Full height minus nav
          }}>
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
