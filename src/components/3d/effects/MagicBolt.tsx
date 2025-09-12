"use client";
import { useMemo, useRef } from "react";
import { Color, ShaderMaterial, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";

const vert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vNormalW = normalMatrix * normal;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    // Fresnel-like rim
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    float core = smoothstep(0.6, 1.0, rim);
    float pulse = 0.6 + 0.4 * sin(uTime * 10.0);
    vec3 col = mix(uColor * 0.3, uColor, core) * (0.9 + 0.1 * pulse);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function MagicBoltVisual({ color = "#7c3aed", radius = 0.35 }: { color?: string; radius?: number }) {
  const mat = useRef<ShaderMaterial | null>(null);
  const uColor = useMemo(() => new Color(color), [color]);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: uColor } },
        vertexShader: vert,
        fragmentShader: frag,
      }),
    [uColor],
  );
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 24]} />
        {/* @ts-expect-error three types */}
        <primitive ref={mat as any} object={material} attach="material" />
      </mesh>
      {/* Soft point light traveling with bolt */}
      <pointLight color={color} intensity={2.2} distance={6} decay={2} />
    </group>
  );
}

export default MagicBoltVisual;

