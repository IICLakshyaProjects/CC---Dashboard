"use client";

import { useEffect, useState } from "react";
import {
  type MetricKey,
  type MetricLeaderboard,
  type CampaignLeaderboard,
  getMetricLabel,
} from "@/lib/leaderboard";

function getRankLabel(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/20 bg-slate-950/90 text-sm font-black tracking-tight text-amber-300 shadow-[0_8px_24px_rgba(0,0,0,0.28)] sm:h-14 sm:w-14 sm:text-base">
      {getRankLabel(rank)}
    </div>
  );
}

type Props = {
  initialData: MetricLeaderboard;
  initialError?: string;
  rotationMetrics: MetricKey[];
  refreshIntervalMs: number;
  campaignRotationIntervalMs?: number;
  headerRightText?: string;
  headerRightTextByMetric?: Partial<Record<MetricKey, string>>;
};

type LoadState = {
  data: MetricLeaderboard;
  status: "idle" | "loading" | "error";
  error?: string;
};

async function readDashboardError(response: Response): Promise<string> {
  const fallback = `Failed to refresh dashboard (${response.status})`;
  const bodyText = await response.text();

  if (!bodyText) return fallback;

  try {
    const parsed = JSON.parse(bodyText) as { error?: string };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    return bodyText;
  }

  return fallback;
}

function AgentPhoto({
  name,
  photoLink,
  className = "",
}: {
  name: string;
  photoLink: string;
  className?: string;
}) {
  const src = `/api/image?url=${encodeURIComponent(photoLink)}&label=${encodeURIComponent(
    name.slice(0, 2).toUpperCase(),
  )}`;

  return (
    <div
      className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900 shadow-lg ${className}`}
    >
      {/* Native img avoids Next.js local image query-string restrictions for the proxy route. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} photo`}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function AgentCard({
  agent,
}: {
  agent: CampaignLeaderboard["agents"][number];
}) {
  return (
    <article className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="absolute right-3 top-3">
        <RankBadge rank={agent.rank} />
      </div>
      <div className="flex items-center gap-3">
        <AgentPhoto name={agent.name} photoLink={agent.photoLink} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{agent.name}</p>
          {agent.teamName ? (
            <p className="truncate text-[0.72rem] font-bold uppercase tracking-[0.28em] text-slate-300/80">
              {agent.teamName}
            </p>
          ) : null}
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-300">
            {agent.metricValue}
          </p>
        </div>
      </div>
    </article>
  );
}

function CampaignPanel({
  campaign,
}: {
  campaign: CampaignLeaderboard;
}) {
  const topAgent = campaign.agents[0];

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-300/90">
            Campaign
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">{campaign.campaign}</h2>
        </div>
      </div>

      {topAgent ? (
        <div className="relative mb-5 rounded-[1.7rem] border border-amber-300/20 bg-gradient-to-br from-amber-300/14 via-white/8 to-white/5 p-4 shadow-[0_20px_70px_rgba(245,158,11,0.14)]">
          <div className="absolute right-4 top-4">
            <RankBadge rank={topAgent.rank} />
          </div>
          <div className="flex items-center gap-4">
            <AgentPhoto name={topAgent.name} photoLink={topAgent.photoLink} className="h-24 w-24 sm:h-28 sm:w-28" />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-100/75">Leading agent</p>
              <p className="truncate text-2xl font-black tracking-tight text-white sm:text-[2.1rem]">
                {topAgent.name}
              </p>
              {topAgent.teamName ? (
                <p className="truncate text-[0.72rem] font-bold uppercase tracking-[0.28em] text-slate-200/85">
                  {topAgent.teamName}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-300 px-3 py-1 text-sm font-black text-slate-950 sm:px-4 sm:py-1.5 sm:text-base">
                  {topAgent.metricValue}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
          No agent data found for this campaign.
        </div>
      )}

      <div className="grid gap-3">
        {campaign.agents.slice(1).map((agent) => (
          <AgentCard key={`${campaign.campaign}-${agent.emailId}-${agent.rank}`} agent={agent} />
        ))}
      </div>
    </section>
  );
}

export function LeaderboardDashboard(props: Props) {
  const {
    initialData,
    initialError,
    rotationMetrics,
    refreshIntervalMs,
    campaignRotationIntervalMs,
    headerRightText,
    headerRightTextByMetric,
  } = props;
  const [metric, setMetric] = useState<MetricKey>(initialData.metric);
  const [state, setState] = useState<LoadState>({ data: initialData, status: "idle" });
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function refresh(currentMetric: MetricKey) {
      setState((previous) => ({ ...previous, status: "loading", error: undefined }));

      try {
        const response = await fetch(`/api/leaderboard?metric=${currentMetric}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readDashboardError(response));
        }

        const data = (await response.json()) as MetricLeaderboard;
        if (mounted) {
          setState({ data, status: "idle" });
        }
      } catch (error) {
        if (!mounted) return;
        setState((previous) => ({
          ...previous,
          status: "error",
          error: error instanceof Error ? error.message : "Unable to refresh dashboard",
        }));
      }
    }

    refresh(metric);

    const refreshTimer = window.setInterval(() => refresh(metric), refreshIntervalMs);
    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [metric, refreshIntervalMs]);

  useEffect(() => {
    if (rotationMetrics.length <= 1) return undefined;

    const rotationTimer = window.setInterval(() => {
      setMetric((current) => {
        const currentIndex = rotationMetrics.findIndex((item) => item === current);
        const nextIndex = (currentIndex + 1) % rotationMetrics.length;
        return rotationMetrics[nextIndex] ?? current;
      });
    }, 15000);

    return () => {
      window.clearInterval(rotationTimer);
    };
  }, [rotationMetrics]);

  useEffect(() => {
    if (!campaignRotationIntervalMs) {
      setActiveCampaignIndex(0);
      return;
    }

    if (state.data.campaigns.length === 0) {
      setActiveCampaignIndex(0);
      return;
    }

    setActiveCampaignIndex((current) => Math.min(current, state.data.campaigns.length - 1));
  }, [campaignRotationIntervalMs, state.data.campaigns.length]);

  useEffect(() => {
    if (!campaignRotationIntervalMs || state.data.campaigns.length <= 1) return undefined;

    const campaignTimer = window.setInterval(() => {
      setActiveCampaignIndex((current) => (current + 1) % state.data.campaigns.length);
    }, campaignRotationIntervalMs);

    return () => {
      window.clearInterval(campaignTimer);
    };
  }, [campaignRotationIntervalMs, state.data.campaigns.length]);

  const activeLabel = getMetricLabel(metric);
  const activeHeaderRightText = headerRightTextByMetric?.[metric] ?? headerRightText;

  const visibleCampaigns = state.data.campaigns;
  const activeCampaign =
    campaignRotationIntervalMs && visibleCampaigns.length > 0
      ? visibleCampaigns[activeCampaignIndex] ?? visibleCampaigns[0]
      : undefined;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.24),_transparent_34%),linear-gradient(135deg,_#020617_0%,_#08111f_45%,_#030712_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1 text-center">
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">CC Leaderboard</h1>
              <div className="mt-2">
                <h2 className="text-2xl font-semibold tracking-wide text-amber-300 sm:text-3xl">
                  {activeLabel}
                </h2>
              </div>
            </div>
            {activeHeaderRightText ? (
              <div className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-semibold tracking-wide text-slate-200 sm:px-5 sm:py-3 sm:text-base">
                {activeHeaderRightText}
              </div>
            ) : null}
          </div>
        </header>

        {initialError ? (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {initialError}
          </div>
        ) : null}

        {state.status === "error" && state.error ? (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {state.error}
          </div>
        ) : null}

        <main className={campaignRotationIntervalMs ? "flex flex-1 items-stretch" : "flex flex-1 flex-col gap-4"}>
          {campaignRotationIntervalMs ? (
            activeCampaign ? (
              <div className="flex w-full items-stretch">
                <div
                  key={`${state.data.metric}-${activeCampaign.campaign}`}
                  className="w-full transition-all duration-700 ease-out"
                >
                  <CampaignPanel campaign={activeCampaign} />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[50vh] w-full items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-16 text-center text-slate-300">
                No campaign rows were returned from the sheet.
              </div>
            )
          ) : (
            visibleCampaigns.length > 0 ? (
              visibleCampaigns.map((campaign) => (
                <CampaignPanel key={`${state.data.metric}-${campaign.campaign}`} campaign={campaign} />
              ))
            ) : (
              <div className="flex min-h-[50vh] w-full items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-16 text-center text-slate-300">
                No campaign rows were returned from the sheet.
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
