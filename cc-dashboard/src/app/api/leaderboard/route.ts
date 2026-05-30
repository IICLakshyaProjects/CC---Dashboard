import { NextRequest } from "next/server";
import { loadMetricLeaderboard, toMetricKey } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const metric = toMetricKey(request.nextUrl.searchParams.get("metric"));

  try {
    const data = await loadMetricLeaderboard(metric);
    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown leaderboard error";
    const status = message.includes("Google Sheets API is disabled") ? 503 : 500;
    return Response.json(
      {
        error: message,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
