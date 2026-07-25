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
  title: "AfriHeart – Rencontres sérieuses 100% africaines",
  description:
    "La première plateforme de rencontre sérieuse et sécurisée dédiée aux célibataires africains et de la diaspora. Trouvez l'amour authentique avec AfriHeart.",
  keywords: [
    "rencontre africaine",
    "dating afrique",
    "rencontre sérieuse",
    "célibataires africains",
    "AfriHeart",
  ],
  openGraph: {
    title: "AfriHeart – L'amour authentique commence ici",
    description:
      "Rejoignez la communauté AfriHeart et trouvez votre âme sœur parmi des milliers de célibataires vérifiés.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        {children}
      </body>
    </html>
  );
}
