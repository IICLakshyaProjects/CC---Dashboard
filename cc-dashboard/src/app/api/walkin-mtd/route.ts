import { loadWalkinTurnedMtdLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await loadWalkinTurnedMtdLeaderboard();
    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Walkin MTD error";
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
