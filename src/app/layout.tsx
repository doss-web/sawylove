import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Swaylove — AI Companion for Heartfelt Conversations",
  description:
    "Meet your AI companion. Immersive chat, warm voice replies, and he remembers every detail about you. Choose from 5 unique characters and start your story.",
  keywords: [
    "AI companion",
    "virtual companion",
    "AI chat",
    "AI voice",
    "roleplay",
    "interactive story",
    "heartfelt conversations",
  ],
  robots: "index, follow",
  icons: {
    icon: "/img/favicon.svg",
  },
  openGraph: {
    title: "Swaylove — AI Companion",
    description:
      "Immersive AI chat with voice. Choose your character and start your story.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swaylove — AI Companion",
    description:
      "Immersive AI chat with voice. Choose your character and start your story.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="min-h-screen font-body">{children}</body>
    </html>
  );
}
