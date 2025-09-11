import type { AnimationClip, KeyframeTrack } from "three";

// Heuristic list of bone keywords we generally DON'T want to treat as root motion tracks
const BONE_KEYWORDS = [
  "hip",
  "hips",
  "pelvis",
  "spine",
  "chest",
  "neck",
  "head",
  "arm",
  "leg",
  "foot",
  "hand",
  "toe",
  "finger",
];

function isLikelyRootNode(name: string): boolean {
  const n = name.toLowerCase();
  if (n.includes("armature") || n === "root" || n.endsWith(":root")) return true;
  // Avoid common bone names
  if (BONE_KEYWORDS.some((k) => n.includes(k))) return false;
  // Fallback: if it doesn't look like a bone, accept it as potential root
  return true;
}

/**
 * Attempts to find the node name that carries root motion `.position` tracks.
 * Returns null if none found.
 */
export function findRootMotionNodeName(clips: AnimationClip[]): string | null {
  // Collect candidate names that have `.position` tracks
  const candidates: Record<string, number> = {};

  const considerTrack = (t: KeyframeTrack) => {
    if (!t.name || !t.name.endsWith(".position")) return;
    // Extract node name from track name: "Node.property" or "Node/path.property"
    const idx = t.name.lastIndexOf(".");
    const node = idx >= 0 ? t.name.slice(0, idx) : t.name;
    if (!node) return;
    const score = isLikelyRootNode(node) ? 5 : 1;
    candidates[node] = (candidates[node] ?? 0) + score;
  };

  for (const clip of clips) {
    for (const track of clip.tracks) considerTrack(track);
  }

  const names = Object.keys(candidates);
  if (names.length === 0) return null;
  // Pick the highest score
  names.sort((a, b) => (candidates[b] ?? 0) - (candidates[a] ?? 0));
  return names[0];
}

