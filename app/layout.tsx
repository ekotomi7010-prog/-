import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ダンス練習アプリ",
  description: "動画を区切って、区間ごとに動きの解説を生成します",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
