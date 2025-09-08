import { Game } from "@/three/Game";
import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans flex p-12 h-screen">
      <main className="">
        <Game />
      </main>
    </div>
  );
}
