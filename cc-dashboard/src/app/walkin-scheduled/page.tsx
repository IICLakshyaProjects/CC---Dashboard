import { LeaderboardDashboard } from "@/components/leaderboard-dashboard";
import { createEmptyMetricLeaderboard, loadMetricLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrentDate(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

export default async function WalkinScheduledPage() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await loadMetricLeaderboard("walkinScheduled");
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load leaderboard data";
    initialData = createEmptyMetricLeaderboard("walkinScheduled", initialError);
  }

  return (
    <LeaderboardDashboard
      initialData={initialData}
      initialError={initialError}
      rotationMetrics={["walkinScheduled"]}
      refreshIntervalMs={5 * 60 * 1000}
      headerRightText={formatCurrentDate()}
    />
  );
}
