export default function StatCard({
  label,
  value,
  icon,
  delta,
  tone = "neutral",
}: {
  label: string
  value: string
  icon: React.ReactNode
  delta?: string
  tone?: "up" | "down" | "neutral"
}) {
  const toneConfig = {
    up: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/20",
    },
    down: {
      text: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      glow: "shadow-rose-500/20",
    },
    neutral: {
      text: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
      glow: "shadow-slate-500/20",
    },
  }

  const config = toneConfig[tone]

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-linear-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:border-slate-700/80 hover:shadow-xl hover:shadow-slate-900/50">
      {/* Animated gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-violet-500/0 via-violet-500/5 to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      {/* Content */}
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left section */}
          <div className="flex flex-1 flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
              {label}
            </span>

            <span className=" text-white  text-md font-bold   sm:text-xl md:text-2xl">
              {value}
            </span>

            {delta && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border ${config.border} ${config.bg} px-3 py-1.5 text-xs font-semibold ${config.text} shadow-sm transition-all duration-300 group-hover:shadow-md ${config.glow}`}
                >
                  {tone === "up" && "↗ "}
                  {tone === "down" && "↘ "}
                  {delta}
                </span>
              </div>
            )}
          </div>

      
        </div>
      </div>

      {/* Border glow effect */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 transition-all duration-500 group-hover:ring-white/10" />
    </div>
  )
}
