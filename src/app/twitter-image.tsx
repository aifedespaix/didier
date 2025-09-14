import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const alt = "Didier Twitter Card";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image(_req: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          color: "#e5e7eb",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700 }}>Didier</div>
      </div>
    ),
    {
      ...size,
    },
  );
}

