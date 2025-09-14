"use client";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";

export function ViewPanel({ camFollow }: { camFollow: boolean }) {
	return (
		<Collapsible
			defaultOpen
			style={{
				position: "absolute",
				left: 12,
				top: 12,
				width: 240,
				pointerEvents: "auto",
			}}
		>
			<CollapsibleTrigger
				style={{
					width: "100%",
					textAlign: "left",
					background: "rgba(0,0,0,0.6)",
					color: "#fff",
					padding: "6px 8px",
					borderRadius: 6,
					fontSize: 12,
					cursor: "pointer",
					border: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				View ▾
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div
					style={{
						marginTop: 6,
						background: "rgba(0,0,0,0.55)",
						color: "#fff",
						padding: "6px 8px",
						borderRadius: 6,
						fontSize: 12,
						pointerEvents: "none",
					}}
				>
					<div>Camera follow: {camFollow ? "ON" : "OFF"}</div>
					<div style={{ opacity: 0.8 }}>Toggle follow: L</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
