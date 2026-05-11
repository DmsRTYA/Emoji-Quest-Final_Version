import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EmojiQuest - Ultimate Emoji Guessing Game",
  description: "Real-time multiplayer emoji guessing game. Casual, Ranked & PVP modes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
