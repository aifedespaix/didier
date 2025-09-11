import { Game } from "@/components/3d/Game";
import { InputProvider } from "@/3d/input/input-manager.client";
import { InputDebugHUD } from "@/components/3d/hud/InputDebugHUD.client";

export default function Home() {
  return (
    <div className="font-sans flex h-screen w-screen">
      <main className="flex-1 h-full w-full">
        <InputProvider initialContext="gameplay">
          <Game />
          {/* Debug panel (collapsible HUD) */}
          <InputDebugHUD />
        </InputProvider>
      </main>
    </div>
  );
}
