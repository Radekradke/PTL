type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, { ring: string; icon: string; value: string; accent: string }> = {
  neutral: {
    ring: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-600",
    value: "text-slate-950",
    accent: "from-slate-400 to-slate-600",
  },
  warning: {
    ring: "border-amber-200 bg-amber-50/70",
    icon: "bg-amber-100 text-amber-700",
    value: "text-amber-800",
    accent: "from-amber-400 to-orange-500",
  },
  info: {
    ring: "border-blue-200 bg-blue-50/70",
    icon: "bg-blue-100 text-blue-700",
    value: "text-blue-800",
    accent: "from-blue-500 to-cyan-500",
  },
  success: {
    ring: "border-emerald-200 bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-800",
    accent: "from-emerald-500 to-teal-500",
  },
  danger: {
    ring: "border-rose-200 bg-rose-50/70",
    icon: "bg-rose-100 text-rose-700",
    value: "text-rose-800",
    accent: "from-rose-500 to-red-500",
  },
  base: {
    ring: "border-cyan-200 bg-cyan-50/70",
    icon: "bg-cyan-100 text-cyan-700",
    value: "text-cyan-800",
    accent: "from-cyan-500 to-blue-500",
  },
}

function resolveTone(tone?: StatsCardTone, color?: string): StatsCardTone {
  if (tone) return tone
  if (color?.includes("yellow") || color?.includes("amber")) return "warning"
  if (color?.includes("blue") || color?.includes("sky")) return "info"
  if (color?.includes("green") || color?.includes("emerald")) return "success"
  if (color?.includes("red") || color?.includes("rose")) return "danger"
  if (color?.includes("purple") || color?.includes("indigo")) return "base"
  return "neutral"
}

export function StatsCard({ title, value, color, tone }: Props) {
  const styles = toneStyles[resolveTone(tone, color)]

  return (
    <div className={`${styles.ring} group relative min-h-[112px] overflow-hidden rounded-3xl border p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(15,23,42,0.10)] sm:min-h-[132px] sm:p-5`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[12rem] text-[11px] font-black uppercase leading-5 tracking-[0.12em] text-slate-500 sm:text-xs">
          {title}
        </p>
        <span className={`${styles.icon} grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-xs font-black ring-1 ring-black/5`}>
          {value}
        </span>
      </div>
      <h2 className={`${styles.value} mt-4 text-3xl font-black leading-none tracking-[-0.06em] sm:text-4xl`}>
        {value}
      </h2>
    </div>
  )
}
