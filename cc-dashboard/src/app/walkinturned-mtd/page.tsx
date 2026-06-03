import { WalkinTurnedMtdBoard } from "@/components/walkin-turned-mtd-board";
import {
  createEmptyWalkinTurnedMtdLeaderboard,
  loadWalkinTurnedMtdLeaderboard,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WalkinTurnedMtdPage() {
  let data;

  try {
    data = await loadWalkinTurnedMtdLeaderboard();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load walkin turned leaderboard data";
    data = createEmptyWalkinTurnedMtdLeaderboard(message);
  }

  return <WalkinTurnedMtdBoard data={data} />;
}
