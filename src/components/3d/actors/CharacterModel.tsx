"use client";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Box3, Vector3 } from "three";
import { SkeletonUtils } from "three-stdlib";
import type { AnimClipHints, AnimStateId } from "@/types/animation";
import { locomotionFromSpeed, useAnimationStateMachine } from "@/systems/animation/useAnimationStateMachine";
import { findRootMotionNodeName } from "@/systems/animation/rootMotion";

export interface CharacterModelProps {
  speed?: number; // current horizontal speed (m/s)
  getSpeed?: () => number; // optional getter to avoid React re-renders
  overrideState?: AnimStateId | null; // e.g., "dash", "cast" later
  clipHints?: AnimClipHints;
  scale?: number;
  /**
   * Optional: automatically fit the model height (in meters).
   * If provided, the final scale becomes (fitHeight / modelHeight) * scale.
   */
  fitHeight?: number;
  /**
   * Optional vertical offset to place feet on the ground.
   * When provided, the model group is positioned at [0, yOffset, 0].
   * Default is -1 to match a ~2m tall collider.
   */
  yOffset?: number;
}

// Preload the asset
useGLTF.preload("/character.glb");

export function CharacterModel({ speed, getSpeed, overrideState = null, clipHints, scale = 1, fitHeight, yOffset }:
  CharacterModelProps) {
  const group = useRef<Group | null>(null);
  const gltf = useGLTF("/character.glb");

  // clone to avoid skeleton sharing issues when instantiating multiple characters
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene) as Group, [gltf.scene]);
  // Find which node likely carries root motion
  const rootMotionNodeName = useMemo(() => findRootMotionNodeName(gltf.animations), [gltf.animations]);

  const { actions, clips } = useAnimations(gltf.animations, group);

  // Compute a scale that fits the requested height (if any)
  const finalScale = useMemo(() => {
    if (!fitHeight) return scale;
    try {
      const box = new Box3().setFromObject(scene);
      const size = new Vector3();
      box.getSize(size);
      const modelHeight = size.y || 1; // avoid div by zero
      // Allow additional manual scaling multiplier via `scale`
      return (fitHeight / modelHeight) * scale;
    } catch (_e) {
      return scale;
    }
  }, [fitHeight, scene, scale]);

  const { play } = useAnimationStateMachine({
    clips,
    actions: actions as any,
    hints: clipHints,
    transitions: {
      idle: { fade: 0.2 },
      walk: { fade: 0.2 },
      run: { fade: 0.2 },
      dash: { fade: 0.12 },
    },
    oneShots: {
      // example for future: dash/cast return to run/idle automatically
      // dash: { next: "run", fade: 0.12 },
    },
  });

  useEffect(() => {
    // Enable shadows on meshes
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Drive animation state every frame (so we don't depend on React re-renders)
  useFrame(() => {
    const s = getSpeed ? getSpeed() : (speed ?? 0);
    const desired = overrideState ?? locomotionFromSpeed(s);
    play(desired);

    // Cancel root motion in XZ so animations play in-place
    if (rootMotionNodeName) {
      const node = scene.getObjectByName(rootMotionNodeName) as any;
      if (node && node.position) {
        node.position.x = 0;
        node.position.z = 0;
        // keep Y to preserve subtle up/down if any; comment next line to lock Y too
        // node.position.y = 0;
      }
    } else {
      // Fallback: some exports animate the scene root directly
      if ((scene as any).position) {
        (scene as any).position.x = 0;
        (scene as any).position.z = 0;
      }
    }
  });

  return (
    <group ref={group} scale={finalScale} position={[0, yOffset ?? -1, 0] /* feet to ground */}>
      {/* The cloned scene is mounted inside the same group used for animations */}
      <primitive object={scene} />
    </group>
  );
}

export default CharacterModel;
