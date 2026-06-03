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
}: {
  name: string;
  photoLink: string;
  sizeClassName: string;
}) {
  const initials = getInitials(name);
  const src = photoLink
    ? `/api/image?url=${encodeURIComponent(photoLink)}&label=${encodeURIComponent(initials)}`
    : "";

  if (!src) {
    return (
      <div
        className={`${sizeClassName} ${getInitialsColor(name)} flex items-center justify-center rounded-2xl text-2xl font-black`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClassName} overflow-hidden rounded-2xl bg-slate-100`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${name} photo`} loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}

const RANK_COLORS: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: "bg-amber-400", text: "text-white", ring: "ring-amber-300" },
  2: { bg: "bg-slate-400", text: "text-white", ring: "ring-slate-300" },
  3: { bg: "bg-orange-400", text: "text-white", ring: "ring-orange-300" },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_COLORS[rank] ?? { bg: "bg-slate-200", text: "text-slate-600", ring: "ring-slate-200" };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-2 ring-offset-1 ${style.bg} ${style.text} ${style.ring}`}
    >
      {getRankLabel(rank)}
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
      className={`flex flex-col rounded-xl px-4 py-2.5 ${accent ? "bg-amber-50 ring-1 ring-amber-200" : "bg-slate-50 ring-1 ring-slate-200"}`}
    >
      <span className={`text-[0.6rem] font-semibold uppercase tracking-widest ${accent ? "text-amber-500" : "text-slate-400"}`}>
        {label}
      </span>
      <span className={`mt-0.5 text-xl font-black tracking-tight ${accent ? "text-amber-600" : "text-slate-700"}`}>
        {value}
      </span>
    </div>
  );
}

function HeroCard({ agent }: { agent: WalkinTurnedMtdLeaderboard["agents"][number] }) {
  return (
    <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-md ring-1 ring-amber-200 sm:p-8">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-orange-100/40 blur-2xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <AgentPhoto name={agent.name} photoLink={agent.photoLink} sizeClassName="h-28 w-28 sm:h-36 sm:w-36" />
          <div className="absolute -bottom-2 -right-2">
            <RankBadge rank={agent.rank} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-amber-500">Champion</p>
          <h3 className="mt-1 truncate text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
            {agent.name}
          </h3>
          {agent.teamName ? (
            <p className="mt-0.5 truncate text-xs font-semibold uppercase tracking-widest text-slate-400">
              {agent.teamName}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <StatPill label="Walk-in Turned" value={formatNumber(agent.metricValue)} accent />
            <StatPill label="Admissions" value={formatNumber(agent.admission)} />
          </div>
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
  return (
    <article className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md">
      <div className="relative shrink-0">
        <AgentPhoto
          name={agent.name}
          photoLink={agent.photoLink}
          sizeClassName={compact ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20"}
        />
        <div className="absolute -bottom-1.5 -right-1.5">
          <RankBadge rank={agent.rank} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`truncate font-black tracking-tight text-slate-800 ${compact ? "text-base" : "text-lg sm:text-xl"}`}>
          {agent.name}
        </h3>
        {agent.teamName ? (
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
            {agent.teamName}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="rounded-lg bg-amber-50 px-3 py-1.5 ring-1 ring-amber-100">
          <p className="text-[0.55rem] font-semibold uppercase tracking-widest text-amber-400">Walk-in</p>
          <p className="text-sm font-black text-amber-600">{formatNumber(agent.metricValue)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100">
          <p className="text-[0.55rem] font-semibold uppercase tracking-widest text-slate-400">Admis.</p>
          <p className="text-sm font-black text-slate-600">{formatNumber(agent.admission)}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">

        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-amber-500">Monthly</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
              Walk-in Turned Leaderboard
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 ring-1 ring-amber-200">
              {data.sheetName}
            </span>
            <span className="text-[0.65rem] text-slate-400">Updated {updatedAt}</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 pb-4">
          {hero ? <HeroCard agent={hero} /> : <EmptyState message="No walkin turned rows were returned from the Walkin MTD sheet." />}

          {rest.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2">
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
