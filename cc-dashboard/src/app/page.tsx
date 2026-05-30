import { LeaderboardDashboard } from "@/components/leaderboard-dashboard";
import { createEmptyMetricLeaderboard, loadMetricLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await loadMetricLeaderboard("admission");
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load leaderboard data";
    initialData = createEmptyMetricLeaderboard("admission", initialError);
  }
  return (
    <LeaderboardDashboard
      initialData={initialData}
      initialError={initialError}
      rotationMetrics={["admission", "walkinTurned"]}
      refreshIntervalMs={15_000}
    />
  );
}
