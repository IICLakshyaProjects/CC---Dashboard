"use client";

import React, { useEffect, useState } from "react";
import type { WalkinTurnedMtdLeaderboard } from "@/lib/leaderboard";

type Campaign = WalkinTurnedMtdLeaderboard["campaigns"][number];
type Agent = Campaign["agents"][number];

type Props = {
  initialData: WalkinTurnedMtdLeaderboard;
  initialError?: string;
  refreshIntervalMs?: number;
  campaignRotationIntervalMs?: number;
};

type LoadState = {
  data: WalkinTurnedMtdLeaderboard;
  status: "idle" | "loading" | "error";
  error?: string;
};

async function readDashboardError(response: Response): Promise<string> {
  const fallback = `Failed to refresh Walkin MTD dashboard (${response.status})`;
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function getRankLabel(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just refreshed";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function getInitialsColor(name: string): string {
  const colors = [
    "bg-violet-100 text-violet-600",
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-rose-100 text-rose-600",
    "bg-amber-100 text-amber-600",
    "bg-indigo-100 text-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] ?? colors[0];
}

function AgentPhoto({
  name,
  photoLink,
  sizeClassName,
  roundedClassName = "rounded-2xl",
}: {
  name: string;
  photoLink: string;
  sizeClassName: string;
  roundedClassName?: string;
}) {
  const initials = getInitials(name);
  const src = photoLink
    ? `/api/image?url=${encodeURIComponent(photoLink)}&label=${encodeURIComponent(initials)}`
    : "";

  if (!src) {
    return (
      <div
        className={`${sizeClassName} ${roundedClassName} ${getInitialsColor(name)} flex items-center justify-center text-2xl font-black`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClassName} ${roundedClassName} overflow-hidden bg-slate-100`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${name} photo`} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

function SparkleIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} style={style} fill="none">
      <path
        d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9 12 3.5Z"
        fill="currentColor"
      />
      <path d="m18.5 15 .6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6.6-1.9Z" fill="currentColor" />
    </svg>
  );
}

function CrownIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path d="m4 8 4 3.2L12 5l4 6.2L20 8l-1.4 9.2H5.4L4 8Z" fill="currentColor" />
      <path d="M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function getAgentCardChrome(rank: number): string {
  if (rank === 2) {
    return "border-slate-300/90 bg-[radial-gradient(circle_at_12%_38%,_rgba(255,255,255,0.99),_transparent_28%),radial-gradient(circle_at_88%_72%,_rgba(226,232,240,0.6),_transparent_34%),linear-gradient(135deg,_rgba(248,250,252,0.99),_rgba(226,232,240,0.92),_rgba(241,245,249,0.96))] ring-slate-300/70";
  }

  if (rank === 3) {
    return "border-[#7B3F00]/55 bg-[radial-gradient(circle_at_14%_38%,_rgba(184,115,51,0.32),_transparent_34%),radial-gradient(circle_at_86%_72%,_rgba(101,50,25,0.26),_transparent_38%),linear-gradient(135deg,_rgba(255,248,242,0.99),_rgba(184,115,51,0.18),_rgba(92,46,0,0.1))] ring-[#8B4513]/32";
  }

  return "border-blue-100/90 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96),_rgba(239,246,255,0.86))] ring-blue-100 shadow-[0_18px_52px_rgba(15,23,42,0.09),0_0_20px_rgba(59,130,246,0.1)]";
}

function getPhotoFrameChrome(rank: number): string {
  if (rank === 2) return "bg-gradient-to-br from-white via-slate-200 to-slate-300 shadow-[0_0_28px_rgba(148,163,184,0.52),0_0_10px_rgba(255,255,255,0.9)] ring-2 ring-slate-300/80";
  if (rank === 3) return "bg-gradient-to-br from-[#D4956A] via-[#B87333] to-[#5C2E00] shadow-[0_0_34px_rgba(92,46,0,0.68),0_0_14px_rgba(184,115,51,0.54)] ring-2 ring-[#8B4513]/55";
  return "bg-gradient-to-br from-amber-200 via-white to-yellow-100 shadow-[0_0_24px_rgba(245,158,11,0.34)] ring-1 ring-amber-300";
}

function getRankBadgeSrc(rank: number): string {
  const badgeRank = rank >= 1 && rank <= 5 ? rank : 4;
  return `/generated/rank-${badgeRank}.png`;
}

function RankBadge({
  rank,
  className = "",
}: {
  rank: number;
  className?: string;
}) {
  return (
    <span
      className={`achievement-rank-badge inline-flex items-center justify-center ${className}`}
      aria-label={getRankLabel(rank)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getRankBadgeSrc(rank)} alt="" aria-hidden="true" className="h-full w-full object-contain" />
    </span>
  );
}

function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex min-w-32 flex-col rounded-xl px-4 py-3 shadow-sm backdrop-blur ${
        accent
          ? "bg-gradient-to-br from-orange-50 via-white to-amber-50 ring-1 ring-amber-300/70"
          : "bg-gradient-to-br from-white via-blue-50 to-white ring-1 ring-blue-200/80"
      }`}
    >
      <span
        className={`text-[0.6rem] font-bold uppercase tracking-widest ${
          accent ? "text-orange-600" : "text-blue-700"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-0.5 text-3xl font-black leading-none tracking-tight ${
          accent ? "text-orange-600" : "text-blue-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function HeroCard({ agent, campaign }: { agent: Agent; campaign: string }) {
  return (
    <article className="achievement-hero-card achievement-gold-aura relative overflow-hidden rounded-[1.65rem] border-2 border-amber-400/90 bg-[linear-gradient(115deg,_rgba(255,243,196,0.99)_0%,_rgba(255,255,255,0.97)_36%,_rgba(255,244,202,0.98)_66%,_rgba(255,232,150,0.95)_100%)] p-5 ring-1 ring-amber-300/80 backdrop-blur transition duration-300 hover:-translate-y-0.5 sm:p-7">
      <div className="achievement-card-shine" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_21%_51%,_rgba(251,191,36,0.28),_transparent_30%),radial-gradient(circle_at_82%_48%,_rgba(255,225,130,0.62),_transparent_35%),radial-gradient(circle_at_88%_34%,_rgba(255,210,80,0.3),_transparent_28%),linear-gradient(90deg,_rgba(255,255,255,0.58)_0%,_rgba(255,250,220,0.44)_46%,_rgba(255,230,120,0.36)_100%)]" />
      {/* Golden glow blobs */}
      <div className="absolute -right-10 -top-10 h-80 w-80 rounded-full bg-amber-300/80 blur-3xl" />
      <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-yellow-300/60 blur-3xl" />
      <div className="absolute -left-8 top-0 h-44 w-44 rounded-full bg-amber-200/55 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-blue-200/40 blur-2xl" />
      <div className="achievement-light-streak absolute left-0 top-1/2 h-20 w-[58%] -translate-y-1/2" />

      <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6">
        <div className="relative w-fit shrink-0">
          <div className="relative inline-flex rounded-[2.25rem] p-2 lg:p-3">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.44),_transparent_68%)] blur-xl" />
            <div className="relative inline-flex">
              <div className="achievement-gold-orbit" />
              <div className="achievement-gold-orbit achievement-gold-orbit-alt" />
              <div className="relative inline-flex rounded-full bg-gradient-to-br from-amber-300 via-yellow-100 to-amber-200 p-2.5 shadow-[0_18px_48px_rgba(245,158,11,0.36),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                <AgentPhoto
                  name={agent.name}
                  photoLink={agent.photoLink}
                  sizeClassName="h-24 w-24 lg:h-36 lg:w-36"
                  roundedClassName="rounded-full"
                />
                <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-1/2">
                  <RankBadge rank={agent.rank} className="h-14 w-14 lg:h-20 lg:w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400/70 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.28em] text-amber-950 shadow-[0_12px_32px_rgba(245,158,11,0.38),inset_0_1px_0_rgba(255,255,255,0.55)] lg:gap-2 lg:px-4 lg:py-1.5 lg:text-[0.65rem]">
            <CrownIcon className="h-3.5 w-3.5 text-amber-900 lg:h-4 lg:w-4" />
            Champion
          </p>
          <h3 className="mt-2 break-words text-xl font-black tracking-tight text-blue-950 drop-shadow-[0_10px_28px_rgba(15,23,42,0.16)] lg:mt-3 lg:text-3xl xl:text-[2.7rem]">
            {agent.name}
          </h3>
          {agent.teamName ? (
            <p className="mt-0.5 break-words text-xs font-black uppercase tracking-widest text-amber-800 lg:text-sm">
              {agent.teamName}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2 lg:mt-4 lg:gap-3">
            <StatPill label="Walk-in Turned" value={formatNumber(agent.metricValue)} accent />
            <StatPill label="Admissions" value={formatNumber(agent.admission)} />
          </div>
        </div>

        <div className="pointer-events-none relative flex min-h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-white lg:min-h-60 lg:w-72 lg:rounded-[1.4rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/generated/trophy-cutout.png"
            alt=""
            aria-hidden="true"
            className="achievement-trophy-image relative z-10 max-h-24 w-auto object-contain lg:max-h-64"
          />
        </div>
      </div>
    </article>
  );
}

function getCardShineClass(rank: number): string {
  if (rank === 2) return "achievement-silver-shine";
  if (rank === 3) return "achievement-bronze-shine";
  return "achievement-card-mini-shine";
}

function getCardAnimClass(rank: number): string {
  if (rank === 2) return " achievement-silver-card";
  if (rank === 3) return " achievement-bronze-card";
  return "";
}

function AgentCard({
  agent,
  compact = false,
}: {
  agent: Agent;
  compact?: boolean;
}) {
  const isTopRank = agent.rank <= 3;
  const cardChrome = getAgentCardChrome(agent.rank);
  const photoFrameChrome = getPhotoFrameChrome(agent.rank);

  return (
    <article
      className={`group relative h-full overflow-hidden rounded-2xl border p-4 ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_62px_rgba(15,23,42,0.14)]${getCardAnimClass(agent.rank)} ${cardChrome}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_34%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className={getCardShineClass(agent.rank)} />
      <div className="relative flex flex-row items-start gap-3 lg:gap-4">
        <div className="relative w-fit shrink-0">
          <div className={isTopRank ? `rounded-full ${photoFrameChrome} p-1.5` : ""}>
            <AgentPhoto
              name={agent.name}
              photoLink={agent.photoLink}
              sizeClassName="h-16 w-16 lg:h-24 lg:w-24"
              roundedClassName="rounded-full"
            />
          </div>
          <div className="absolute bottom-0 left-0 z-20">
            <RankBadge rank={agent.rank} className="h-9 w-9 lg:h-12 lg:w-12" />
          </div>
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h3 className="break-words text-sm font-black tracking-tight text-blue-950 lg:text-lg">
            {agent.name}
          </h3>
          {agent.teamName ? (
            <p className="break-words text-[0.6rem] font-black uppercase tracking-widest text-blue-600 lg:text-[0.65rem]">
              {agent.teamName}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
          <div className="rounded-lg bg-gradient-to-br from-amber-50 to-white px-2.5 py-1.5 shadow-sm ring-1 ring-amber-200 lg:px-3 lg:py-2">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-amber-600">WT</p>
            <p className="text-sm font-black leading-tight text-amber-700 lg:text-base">{formatNumber(agent.metricValue)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 ring-1 ring-slate-200 lg:px-3 lg:py-2">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-slate-500">Adm</p>
            <p className="text-sm font-black leading-tight text-slate-700 lg:text-base">{formatNumber(agent.admission)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-400">
      {message}
    </div>
  );
}

export function WalkinTurnedMtdBoard({
  initialData,
  initialError,
  refreshIntervalMs = 15_000,
  campaignRotationIntervalMs = 15_000,
}: Props) {
  const [state, setState] = useState<LoadState>({
    data: initialData,
    status: "idle",
  });
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      setState((previous) => ({ ...previous, status: "loading", error: undefined }));

      try {
        const response = await fetch("/api/walkin-mtd", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readDashboardError(response));
        }

        const data = (await response.json()) as WalkinTurnedMtdLeaderboard;
        if (mounted) {
          setState({ data, status: "idle" });
        }
      } catch (error) {
        if (!mounted) return;
        setState((previous) => ({
          ...previous,
          status: "error",
          error: error instanceof Error ? error.message : "Unable to refresh Walkin MTD dashboard",
        }));
      }
    }

    refresh();

    const refreshTimer = window.setInterval(refresh, refreshIntervalMs);
    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [refreshIntervalMs]);

  useEffect(() => {
    if (state.data.campaigns.length === 0) {
      setActiveCampaignIndex(0);
      return undefined;
    }

    setActiveCampaignIndex((current) => Math.min(current, state.data.campaigns.length - 1));
    return undefined;
  }, [state.data.campaigns.length]);

  useEffect(() => {
    if (!campaignRotationIntervalMs || state.data.campaigns.length <= 1) return undefined;

    const rotationTimer = window.setInterval(() => {
      setActiveCampaignIndex((current) => (current + 1) % state.data.campaigns.length);
    }, campaignRotationIntervalMs);

    return () => {
      window.clearInterval(rotationTimer);
    };
  }, [campaignRotationIntervalMs, state.data.campaigns.length]);

  const activeCampaign = state.data.campaigns[activeCampaignIndex] ?? state.data.campaigns[0];
  const updatedAt = formatUpdatedAt(state.data.updatedAt);

  return (
    <div className="achievement-page relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.24),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.2),_transparent_32%),radial-gradient(circle_at_48%_10%,_rgba(255,255,255,0.96),_transparent_38%),linear-gradient(135deg,_#f7fbff_0%,_#ffffff_38%,_#eaf3ff_100%)] text-blue-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="achievement-confetti left-[8%] top-12 bg-pink-500" />
        <span className="achievement-confetti left-[18%] top-28 bg-amber-400" />
        <span className="achievement-confetti left-[34%] top-14 bg-yellow-400" />
        <span className="achievement-confetti left-[46%] top-24 bg-sky-500" />
        <span className="achievement-confetti left-[72%] top-16 bg-blue-500" />
        <span className="achievement-confetti left-[86%] top-32 bg-emerald-500" />
        <span className="achievement-confetti left-[94%] top-20 bg-red-500" />
        <span className="achievement-confetti left-[4%] top-[58%] bg-amber-500" />
        <span className="achievement-confetti left-[96%] top-[54%] bg-fuchsia-500" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-7 sm:px-6 lg:px-8">
        <header className="achievement-header mb-6 flex flex-wrap items-end justify-between gap-4 px-2 py-3">
          <div className="relative min-w-0">
            <h1 className="max-w-full break-words text-3xl font-black leading-tight tracking-tight text-blue-950 drop-shadow-[0_8px_18px_rgba(15,23,42,0.08)] sm:text-5xl">
              CC Performers Leaderboard
              {state.data.month ? (
                <span className="text-blue-900"> - {state.data.month.replace(/\s*\d{4}\s*$/, "").trim()}</span>
              ) : null}
            </h1>
            {activeCampaign ? (
              <p className="mt-1 w-full break-words text-center text-lg font-black uppercase tracking-[0.28em] text-blue-600">
                {activeCampaign.campaign}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-2 text-[0.72rem] font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.75)]" />
              Updated {updatedAt}
            </span>
            {initialError ? (
              <span className="max-w-[22rem] break-words text-right text-[0.68rem] font-semibold text-rose-600">
                {initialError}
              </span>
            ) : null}
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 pb-4">
          {activeCampaign?.agents[0] ? (
            <HeroCard agent={activeCampaign.agents[0]} campaign={activeCampaign.campaign} />
          ) : (
            <EmptyState message="No walkin turned rows were returned from the Walkin MTD sheet." />
          )}

          {activeCampaign && activeCampaign.agents.slice(1).length > 0 ? (
            <section className="grid flex-1 grid-cols-2 gap-3 auto-rows-fr">
              {activeCampaign.agents.slice(1).map((agent) => (
                <AgentCard
                  key={`${activeCampaign.campaign}-${agent.emailId}-${agent.rank}`}
                  agent={agent}
                  compact={agent.rank > 3}
                />
              ))}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
