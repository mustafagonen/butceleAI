import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import { defaultMetadata, organizationSchema, webApplicationSchema, faqSchema } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
