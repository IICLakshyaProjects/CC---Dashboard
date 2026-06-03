import type { WalkinTurnedMtdLeaderboard } from "@/lib/leaderboard";

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
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
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
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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

function LaurelMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className} fill="none">
      <path
        d="M36 94C20 78 20 44 40 24M84 94c16-16 16-50-4-70"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M31 80c8-2 12-6 13-13M29 63c8 0 13-3 17-10M34 46c7 2 13 0 18-7M89 80c-8-2-12-6-13-13M91 63c-8 0-13-3-17-10M86 46c-7 2-13 0-18-7"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
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

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M7 3v3M17 3v3M4.5 9.2h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getAgentCardChrome(rank: number): string {
  if (rank === 2) {
    return "border-blue-300/90 bg-[radial-gradient(circle_at_12%_38%,_rgba(255,255,255,0.96),_transparent_30%),linear-gradient(135deg,_rgba(248,250,252,0.98),_rgba(219,234,254,0.9),_rgba(255,255,255,0.94))] ring-blue-200/90 shadow-[0_22px_70px_rgba(59,130,246,0.18),0_0_28px_rgba(148,163,184,0.24)]";
  }

  if (rank === 3) {
    return "border-orange-300/90 bg-[radial-gradient(circle_at_16%_42%,_rgba(255,237,213,0.86),_transparent_32%),linear-gradient(135deg,_rgba(255,247,237,0.98),_rgba(255,255,255,0.94),_rgba(254,215,170,0.82))] ring-orange-300/90 shadow-[0_22px_70px_rgba(194,65,12,0.17),0_0_30px_rgba(251,146,60,0.24)]";
  }

  return "border-blue-100/90 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96),_rgba(239,246,255,0.86))] ring-blue-100 shadow-[0_18px_52px_rgba(15,23,42,0.09),0_0_20px_rgba(59,130,246,0.1)]";
}

function getPhotoFrameChrome(rank: number): string {
  if (rank === 2) return "bg-gradient-to-br from-white via-slate-200 to-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.34)] ring-1 ring-blue-200";
  if (rank === 3) return "bg-gradient-to-br from-orange-300 via-white to-amber-200 shadow-[0_0_30px_rgba(251,146,60,0.42)] ring-1 ring-orange-200";
  return "bg-gradient-to-br from-blue-200 via-white to-slate-100 shadow-[0_0_24px_rgba(37,99,235,0.22)] ring-1 ring-blue-200";
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
    <div className={`flex min-w-32 flex-col rounded-xl px-4 py-3 shadow-sm backdrop-blur ${accent ? "bg-gradient-to-br from-orange-50 via-white to-amber-50 ring-1 ring-amber-300/70" : "bg-gradient-to-br from-white via-blue-50 to-white ring-1 ring-blue-200/80"}`}>
      <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${accent ? "text-orange-600" : "text-blue-700"}`}>
        {label}
      </span>
      <span className={`mt-0.5 text-3xl font-black leading-none tracking-tight ${accent ? "text-orange-600" : "text-blue-700"}`}>
        {value}
      </span>
    </div>
  );
}

function HeroCard({ agent }: { agent: WalkinTurnedMtdLeaderboard["agents"][number] }) {
  return (
    <article className="achievement-hero-card relative overflow-hidden rounded-[1.65rem] border border-amber-300/90 bg-[linear-gradient(115deg,_rgba(255,246,213,0.98)_0%,_rgba(255,255,255,0.97)_42%,_rgba(255,241,185,0.92)_100%)] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.16),0_0_72px_rgba(245,158,11,0.28)] ring-1 ring-white/90 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_38px_120px_rgba(15,23,42,0.2),0_0_88px_rgba(245,158,11,0.36)] sm:p-7">
      <div className="achievement-card-shine" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_21%_51%,_rgba(251,191,36,0.2),_transparent_30%),radial-gradient(circle_at_82%_48%,_rgba(255,232,184,0.58),_transparent_35%),radial-gradient(circle_at_88%_34%,_rgba(255,213,213,0.24),_transparent_28%),linear-gradient(90deg,_rgba(255,255,255,0.62)_0%,_rgba(255,252,244,0.44)_46%,_rgba(255,238,188,0.34)_100%)]" />
      <div className="absolute -right-14 -top-14 h-72 w-72 rounded-full bg-amber-200/75 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-blue-200/60 blur-2xl" />
      <div className="achievement-light-streak absolute left-0 top-1/2 h-20 w-[58%] -translate-y-1/2" />
      <div className="achievement-sparkle achievement-sparkle-delay absolute right-28 bottom-10 h-1.5 w-1.5 rounded-full bg-blue-500" />
      <LaurelMark className="absolute right-10 top-10 hidden h-36 w-36 text-amber-300/60 md:block" />

      <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="relative mx-auto w-fit shrink-0 pl-16 md:mx-0">
          <div className="relative inline-flex rounded-[2.25rem] p-3">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,_rgba(251,191,36,0.34),_transparent_68%)] blur-xl" />
            <div className="relative inline-flex rounded-full bg-gradient-to-br from-amber-200 via-white to-yellow-100 p-2 shadow-[0_18px_48px_rgba(245,158,11,0.26)]">
              <AgentPhoto
                name={agent.name}
                photoLink={agent.photoLink}
                sizeClassName="h-32 w-32 sm:h-40 sm:w-40"
                roundedClassName="rounded-full"
              />
            </div>
          </div>
          <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2">
            <RankBadge rank={agent.rank} className="h-16 w-16 sm:h-20 sm:w-20" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-100 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.28em] text-orange-700 shadow-[0_10px_28px_rgba(245,158,11,0.24)]">
            <CrownIcon className="h-4 w-4 text-orange-500" />
            Champion
          </p>
          <h3 className="mt-3 truncate text-3xl font-black tracking-tight text-blue-950 drop-shadow-[0_10px_22px_rgba(15,23,42,0.12)] sm:text-[2.7rem]">
            {agent.name}
          </h3>
          {agent.teamName ? (
            <p className="mt-0.5 truncate text-sm font-black uppercase tracking-widest text-blue-600">
              {agent.teamName}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <StatPill label="Walk-in Turned" value={formatNumber(agent.metricValue)} accent />
            <StatPill label="Admissions" value={formatNumber(agent.admission)} />
          </div>
        </div>

        <div className="pointer-events-none relative hidden min-h-60 w-80 shrink-0 items-center justify-center rounded-[1.4rem] bg-white md:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/generated/trophy-cutout.png"
            alt=""
            aria-hidden="true"
            className="achievement-trophy-image relative z-10 max-h-64 w-auto object-contain"
          />
        </div>
      </div>
    </article>
  );
}

function AgentCard({
  agent,
  compact = false,
}: {
  agent: WalkinTurnedMtdLeaderboard["agents"][number];
  compact?: boolean;
}) {
  const isTopRank = agent.rank <= 3;
  const cardChrome = getAgentCardChrome(agent.rank);
  const photoFrameChrome = getPhotoFrameChrome(agent.rank);

  return (
    <article className={`group relative overflow-hidden rounded-2xl border p-4 ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_62px_rgba(15,23,42,0.14)] ${cardChrome}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.14),_transparent_34%)] opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="achievement-card-mini-shine" />
      {isTopRank ? <SparkleIcon className="achievement-sparkle absolute right-4 top-3 h-4 w-4 text-amber-400/80" /> : null}
      <div className="relative flex items-center gap-4">
        <div className="relative shrink-0 pl-12">
          <div className={isTopRank ? `rounded-full ${photoFrameChrome} p-1.5` : ""}>
            <AgentPhoto
              name={agent.name}
              photoLink={agent.photoLink}
              sizeClassName={compact ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20"}
              roundedClassName="rounded-full"
            />
          </div>
          <div className="absolute left-0 top-1/2 z-20 -translate-y-1/2">
            <RankBadge rank={agent.rank} className={agent.rank <= 3 ? "h-14 w-14" : "h-16 w-12"} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={`truncate font-black tracking-tight text-blue-950 ${compact ? "text-base" : "text-lg sm:text-xl"}`}>
            {agent.name}
          </h3>
          {agent.teamName ? (
            <p className="truncate text-[0.65rem] font-black uppercase tracking-widest text-blue-600">
              {agent.teamName}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="rounded-lg bg-gradient-to-br from-amber-50 to-white px-3 py-1.5 shadow-sm ring-1 ring-amber-200">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-amber-600">Walk-in</p>
            <p className="text-sm font-black text-amber-700">{formatNumber(agent.metricValue)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-slate-500">Admis.</p>
            <p className="text-sm font-black text-slate-700">{formatNumber(agent.admission)}</p>
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

export function WalkinTurnedMtdBoard({ data }: { data: WalkinTurnedMtdLeaderboard }) {
  const topFive = data.agents.slice(0, 5);
  const hero = topFive[0];
  const rest = topFive.slice(1);
  const updatedAt = formatUpdatedAt(data.updatedAt);

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
            <p className="text-[0.7rem] font-black uppercase tracking-[0.45em] text-orange-600">Monthly</p>
            <div className="mt-2 flex items-center gap-3">
              <LaurelMark className="hidden h-16 w-16 shrink-0 text-amber-400 sm:block" />
              <h1 className="max-w-full text-3xl font-black leading-tight tracking-tight text-blue-950 drop-shadow-[0_8px_18px_rgba(15,23,42,0.08)] sm:text-5xl">
                Walk-in Turned Leaderboard
              </h1>
              <LaurelMark className="hidden h-16 w-16 shrink-0 scale-x-[-1] text-amber-400 sm:block" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-950 px-4 py-2 text-xs font-black text-white shadow-[0_12px_28px_rgba(30,64,175,0.22)] ring-1 ring-blue-900">
              {data.sheetName}
              <CalendarIcon className="h-4 w-4 text-white" />
            </span>
            <span className="inline-flex items-center gap-2 text-[0.72rem] font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.75)]" />
              Updated {updatedAt}
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 pb-4">
          {hero ? <HeroCard agent={hero} /> : <EmptyState message="No walkin turned rows were returned from the Walkin MTD sheet." />}

          {rest.length > 0 ? (
            <section className="grid gap-4 sm:grid-cols-2">
              {rest.map((agent) => (
                <AgentCard key={`${agent.emailId}-${agent.rank}`} agent={agent} compact={agent.rank > 3} />
              ))}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
