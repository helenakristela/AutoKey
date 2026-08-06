import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AutoKey · Editor Bahasa Indonesia",
  description: "Autocomplete, spell check, dan auto-space berbasis Trie & Dynamic Programming"
};
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <html lang="id">
      <body>{children}</body>
    </html>;
}
