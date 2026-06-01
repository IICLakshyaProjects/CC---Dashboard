import { LeaderboardDashboard } from "@/components/leaderboard-dashboard";
import { createEmptyMetricLeaderboard, loadMetricLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROTATION_METRICS = [
  "admission",
  "walkinTurned",
  "admissionYesterday",
  "walkinTurnedYesterday",
] as const;

function formatYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(yesterday);
}

export default async function Home() {
  let initialData;
  let initialError: string | undefined;

  try {
    initialData = await loadMetricLeaderboard(ROTATION_METRICS[0]);
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load leaderboard data";
    initialData = createEmptyMetricLeaderboard(ROTATION_METRICS[0], initialError);
  }
  return (
    <LeaderboardDashboard
      initialData={initialData}
      initialError={initialError}
      rotationMetrics={[...ROTATION_METRICS]}
      refreshIntervalMs={15_000}
      headerRightTextByMetric={{
        admissionYesterday: formatYesterdayDate(),
        walkinTurnedYesterday: formatYesterdayDate(),
      }}
    />
  );
}
