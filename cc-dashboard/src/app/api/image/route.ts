import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function createFallbackSvg(label: string) {
  const safeLabel = label.replace(/[<>&]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" fill="none">
      <rect width="640" height="640" rx="56" fill="#111827"/>
      <circle cx="320" cy="240" r="92" fill="#F59E0B" opacity="0.95"/>
      <path d="M180 500c24-96 92-144 140-144s116 48 140 144" stroke="#FDE68A" stroke-width="28" stroke-linecap="round"/>
      <text x="50%" y="574" text-anchor="middle" fill="#F9FAFB" font-size="36" font-family="Arial, sans-serif">${safeLabel}</text>
    </svg>
  `;

  return new Response(svg.trim(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const label = request.nextUrl.searchParams.get("label") ?? "Agent";

  if (!url) {
    return createFallbackSvg(label);
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "CC-Dashboard/1.0",
      },
    });

    if (!response.ok || !response.body) {
      return createFallbackSvg(label);
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return createFallbackSvg(label);
  }
}
