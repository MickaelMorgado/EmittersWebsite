import "@fortawesome/fontawesome-free/css/all.min.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://emitters.app"),
  title: {
    default: "Emitters - Developer Tools & Web Apps",
    template: "%s | Emitters",
  },
  description:
    "Free developer tools and web applications: P&L calendar, AI assistant, 3D CAD viewer, TikTok TTS, EMF detector, G-code timelapse, image compressor, and more.",
  keywords: [
    "developer tools",
    "web apps",
    "free tools",
    "online utilities",
    "PNL calendar",
    "trading journal",
    "AI assistant",
    "ChatGPT",
    "3D CAD viewer",
    "Three.js",
    "TikTok TTS",
    "text to speech",
    "EMF detector",
    "ghost hunter",
    "G-code timelapse",
    "3D printing",
    "image compressor",
    "optimize images",
    "printer monitor",
    "OctoPrint",
    "audio sampler",
    "music production",
    "S.T.A.L.K.E.R. 2 ammo tracker",
    "game tools",
  ],
  authors: [{ name: "Emitters" }],
  creator: "Emitters",
  publisher: "Emitters",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://emitters.app",
    siteName: "Emitters",
    title: "Emitters - Developer Tools & Web Apps",
    description:
      "Free developer tools and web applications: P&L calendar, AI assistant, 3D CAD viewer, TikTok TTS, EMF detector, G-code timelapse, image compressor, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Emitters - Developer Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emitters - Developer Tools & Web Apps",
    description:
      "Free developer tools: P&L calendar, AI assistant, 3D CAD, TikTok TTS, EMF detector, and more",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://emitters.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Emitters",
              url: "https://emitters.app",
              description:
                "Free developer tools and web applications",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://emitters.app/{search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
