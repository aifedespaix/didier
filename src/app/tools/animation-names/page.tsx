"use client";
import { useCallback, useMemo, useState } from "react";
import type { AnimationClip } from "three";

export default function AnimationNamesTool() {
  const [clips, setClips] = useState<AnimationClip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGLB = useCallback(async (url: string) => {
    setError(null);
    setLoading(true);
    setClips([]);
    try {
      // Lazy-load loader only on client
      const [{ GLTFLoader }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js") as Promise<{
          GLTFLoader: new () => any;
        }>,
      ]);

      const loader = new GLTFLoader();

      // Attempt to wire DRACO if present locally (optional best-effort)
      try {
        const { DRACOLoader } = (await import(
          "three/examples/jsm/loaders/DRACOLoader.js"
        )) as { DRACOLoader: new () => any };
        const draco = new DRACOLoader();
        // By default, try CDN; if offline or blocked, non-DRACO models still work
        draco.setDecoderConfig({ type: "js" });
        draco.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
        loader.setDRACOLoader(draco);
      } catch (_e) {
        // ignore if DRACO can't be set; many GLBs won't need it
      }

      const gltf: any = await new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
      setClips(gltf.animations ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load model");
    } finally {
      setLoading(false);
    }
  }, []);

  const onFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      loadGLB(url).finally(() => {
        // Revoke later to allow loader to finish; small timeout is fine
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      });
    },
    [loadGLB]
  );

  const clipNames = useMemo(
    () => clips.map((c) => c.name).filter(Boolean),
    [clips]
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Animation Name Explorer</h1>
      <p className="text-sm opacity-80">
        Charge un fichier .glb/.gltf pour lister les noms d’animations.
      </p>

      <div className="flex flex-col gap-3">
        <label className="inline-flex items-center gap-3">
          <input
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-sm">Sélectionner un fichier local</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            className="rounded bg-black/10 px-3 py-1 text-sm hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
            onClick={() => loadGLB("/character.glb")}
          >
            Tester avec /character.glb
          </button>
          {loading && <span className="text-sm opacity-70">Chargement…</span>}
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {String(error)}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Clips trouvés</h2>
        {clipNames.length === 0 ? (
          <p className="text-sm opacity-70">
            Aucun clip détecté pour le moment.
          </p>
        ) : (
          <>
            <ul className="list-disc pl-5 text-sm">
              {clipNames.map((name) => (
                <li key={name} className="break-words">
                  {name}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <CopyButton text={JSON.stringify(clipNames, null, 2)} />
              <code className="text-xs opacity-70">
                {clipNames.length} clip(s)
              </code>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="rounded bg-black/10 px-3 py-1 text-sm hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
    >
      {copied ? "Copié !" : "Copier JSON"}
    </button>
  );
}
