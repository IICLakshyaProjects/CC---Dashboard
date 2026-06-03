import { WalkinTurnedMtdBoard } from "@/components/walkin-turned-mtd-board";
import {
  createEmptyWalkinTurnedMtdLeaderboard,
  loadWalkinTurnedMtdLeaderboard,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WalkinTurnedMtdPage() {
  let data;
  let initialError: string | undefined;

  try {
    data = await loadWalkinTurnedMtdLeaderboard();
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Failed to load walkin turned leaderboard data";
    data = createEmptyWalkinTurnedMtdLeaderboard(initialError);
  }

  return <WalkinTurnedMtdBoard initialData={data} initialError={initialError} />;
}
