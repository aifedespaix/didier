import { Game } from "@/components/3d/Game";
import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans flex h-screen w-screen">
      <main className="flex-1 h-full w-full">
        <Game />
      </main>
    </div>
  );
}
