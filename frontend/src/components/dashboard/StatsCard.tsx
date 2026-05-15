type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, { accent: string; icon: string; value: string }> = {
  neutral: { accent: "bg-slate-500", icon: "bg-slate-100", value: "text-slate-950" },
  warning: { accent: "bg-amber-500", icon: "bg-amber-50", value: "text-amber-700" },
  info: { accent: "bg-blue-600", icon: "bg-blue-50", value: "text-blue-700" },
  success: { accent: "bg-emerald-600", icon: "bg-emerald-50", value: "text-emerald-700" },
  danger: { accent: "bg-rose-600", icon: "bg-rose-50", value: "text-rose-700" },
  base: { accent: "bg-cyan-600", icon: "bg-cyan-50", value: "text-cyan-700" },
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
    <div className="group relative min-h-[108px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:min-h-[124px] sm:p-5">
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.accent}`} />
      <div className="flex items-start justify-between gap-3 pl-1">
        <p className="max-w-[12rem] text-[11px] font-black uppercase leading-5 tracking-[0.12em] text-slate-500 sm:text-xs">{title}</p>
        <span className={`${styles.icon} mt-0.5 h-8 w-8 shrink-0 rounded-2xl ring-1 ring-slate-200`} />
      </div>
      <h2 className={`${styles.value} mt-4 pl-1 text-3xl font-black leading-none tracking-[-0.06em] sm:text-4xl`}>{value}</h2>
    </div>
  )
}
