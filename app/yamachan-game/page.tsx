import type { Metadata } from "next";
import YamachanGame from "@/components/YamachanGame";

export const metadata: Metadata = {
  title: "山ちゃんが飛ぶ!! | ダンス練習アプリ",
  description: "「おばちゃんが飛ぶ」を下敷きにした、山ちゃんが飛ぶフライトゲーム",
};

export default function YamachanGamePage() {
  return <YamachanGame />;
}
