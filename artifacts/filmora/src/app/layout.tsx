import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import PageTransition from "@/components/PageTransition";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientOnlyComponents from "@/components/ClientOnlyComponents";
import ShivBackground from "@/components/ShivBackground";
import { ThemeProvider } from "@/lib/theme";
import { siteConfig } from "@/lib/config";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Stream Unlimited Movies & TV Shows Online Free`,
    template: `%s | ${siteConfig.name}`,
  },
  description: `Unlimited movies and TV shows for free. ${siteConfig.name} offers a premium streaming experience.`,
  keywords: ["movies", "tv shows", "streaming", "free movies", "watch online", siteConfig.name.toLowerCase()],
  authors: [{ name: `${siteConfig.name} Team` }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  referrer: "origin",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Stream Unlimited Movies & TV Shows Online Free`,
    description: `Unlimited movies and TV shows for free. Premium streaming experience with no ads.`,
    images: [{ url: siteConfig.logoPath, width: 512, height: 512, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Stream Unlimited Movies & TV Shows Online Free`,
    description: `Unlimited movies and TV shows for free. Premium streaming experience.`,
    images: [siteConfig.logoPath],
    creator: siteConfig.twitterHandle,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  formatDetection: { telephone: false },
  ...(siteConfig.gscVerification && {
    verification: { google: siteConfig.gscVerification },
  }),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=['beta','rcb','neon-galaxy','ocean-pulse','sunset-cinema','emerald-night'];var t=localStorage.getItem('fw-theme');document.documentElement.setAttribute('data-theme',v.includes(t)?t:'beta');var m=localStorage.getItem('fw-ui-mode');document.documentElement.setAttribute('data-mode',m==='shiv'?'shiv':'beta');}catch(e){document.documentElement.setAttribute('data-theme','beta');document.documentElement.setAttribute('data-mode','beta');}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var _open=window.open;var _last=0;window.open=function(u,t,f){var now=Date.now();var url=String(u||'');var allow=['youtube.com','youtu.be','tmdb.org','telegram.me','t.me'];var isAllowed=allow.some(function(d){return url.indexOf(d)>-1;});var isUser=(now-_last)<500;if(isAllowed||isUser)return _open.apply(window,arguments);return null;};document.addEventListener('click',function(){_last=Date.now();},true);})();`,
          }}
        />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />

        {siteConfig.gaId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${siteConfig.gaId}');
              `}
            </Script>
          </>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.url,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteConfig.url}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
              logo: `${siteConfig.url}${siteConfig.logoPath}`,
              sameAs: [],
            }),
          }}
        />
      </head>
      <body className={`${plusJakartaSans.className} antialiased flex flex-col min-h-screen bg-prime-dark text-white relative`}>
        <ThemeProvider>
          <ShivBackground />
          <Suspense fallback={null}>
            <Navbar />
          </Suspense>
          <div className="flex-grow relative z-10">
            <PageTransition>{children}</PageTransition>
          </div>
          <Footer />
          <ClientOnlyComponents />
        </ThemeProvider>
      </body>
    </html>
  );
}
