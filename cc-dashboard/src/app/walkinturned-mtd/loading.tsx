export default function Loading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#09111f_44%,_#020617_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-5 backdrop-blur-xl">
          <div className="h-3 w-32 rounded-full bg-white/10" />
          <div className="mt-4 h-10 w-[min(700px,85%)] rounded-2xl bg-white/10" />
          <div className="mt-3 h-4 w-[min(560px,75%)] rounded-full bg-white/8" />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="h-32 rounded-[1.6rem] bg-white/10" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="h-56 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl" />
            <div className="h-56 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-28 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl" />
            <div className="h-28 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
