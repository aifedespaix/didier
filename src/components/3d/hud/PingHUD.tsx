"use client";

export function PingHUD({ peers }: { peers: Array<{ id: string; rtt: number | null }> }) {
  const rtts = peers.map((p) => p.rtt).filter((v): v is number => typeof v === "number");
  const avg = rtts.length ? Math.round(rtts.reduce((a, b) => a + b, 0) / rtts.length) : null;
  return (
    <div className="fixed right-4 bottom-4 text-xs px-2 py-1 rounded bg-black/50 text-white">
      {avg !== null ? `${avg} ms` : "– ms"}
    </div>
  );
}

export default PingHUD;

