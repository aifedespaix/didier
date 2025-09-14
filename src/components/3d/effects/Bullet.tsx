"use client";
import { Color } from "three";
import { useMemo } from "react";

export function BulletVisual({
	color = "#facc15",
	radius = 0.2,
}: {
	color?: string;
	radius?: number;
}) {
	const emissive = useMemo(() => new Color(color), [color]);
	return (
		<group>
			<mesh castShadow>
				<sphereGeometry args={[radius, 16, 16]} />
				<meshStandardMaterial
					color={color}
					emissive={emissive}
					emissiveIntensity={0.8}
				/>
			</mesh>
			<pointLight color={color} intensity={1.5} distance={4} decay={2} />
		</group>
	);
}

export default BulletVisual;
