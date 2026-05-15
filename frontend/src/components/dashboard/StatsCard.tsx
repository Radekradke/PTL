type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, {
  accent: string
  badge: string
  value: string
}> = {
  neutral: {
    accent: "bg-slate-500",
    badge: "bg-slate-100 text-slate-600",
    value: "text-slate-900",
  },
  warning: {
    accent: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
    value: "text-amber-700",
  },
  info: {
    accent: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700",
    value: "text-blue-700",
  },
  success: {
    accent: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    value: "text-emerald-700",
  },
  danger: {
    accent: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700",
    value: "text-rose-700",
  },
  base: {
    accent: "bg-teal-600",
    badge: "bg-teal-50 text-teal-700",
    value: "text-teal-700",
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
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`} />

      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[12rem] text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {title}
        </p>
        <span className={`h-2.5 w-2.5 rounded-full ${styles.accent}`} />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <h2 className={`text-3xl font-bold leading-none tracking-[-0.04em] sm:text-4xl ${styles.value}`}>
          {value}
        </h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}>
          Atual
        </span>
      </div>
    </div>
  )
}
