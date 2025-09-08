import { Game } from "@/components/3d/Game";
import { InputProvider } from "@/3d/input/input-manager.client";
import { InputDebugPanel } from "@/3d/input/debug/panel.client";

export default function Home() {
  return (
    <div className="font-sans flex h-screen w-screen">
      <main className="flex-1 h-full w-full">
        <InputProvider initialContext="gameplay">
          <Game />
          {/* Debug panel optionally visible; lightweight */}
          <InputDebugPanel />
        </InputProvider>
      </main>
    </div>
  );
}
