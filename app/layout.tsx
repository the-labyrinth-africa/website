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
  title: "Ingénierie Logicielle & Conseil - The Labyrinth",
  description: "The Labyrinth : expert en ingénierie logicielle, conseil en transformation numérique et développement d'applications sur mesure. Accompagnement stratégique et technique pour votre projet digital.",
  keywords: "ingénierie logicielle, conseil informatique, développement sur mesure, transformation numérique, Abidjan, Côte d'Ivoire, The Labyrinth",
  authors: [{ name: "The Labyrinth" }],
  robots: "index, follow",
  openGraph: {
    title: "Ingénierie Logicielle & Conseil - The Labyrinth",
    description: "Expert en ingénierie logicielle et conseil en transformation numérique. Développement d'applications sur mesure et accompagnement stratégique.",
    url: "https://thelabyrinth.africa",
    siteName: "The Labyrinth",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/logo-blanc.svg",
        width: 800,
        height: 600,
        alt: "The Labyrinth - Ingénierie Logicielle & Conseil",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ingénierie Logicielle & Conseil - The Labyrinth",
    description: "Expert en ingénierie logicielle et conseil en transformation numérique.",
    images: ["/logo-black.svg"],
  },
  alternates: {
    canonical: "https://www.thelabyrinth.africa",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
