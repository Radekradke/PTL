type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, {
  card: string
  label: string
  value: string
  dot: string
  glow: string
}> = {
  neutral: {
    card: "border-slate-700/70 bg-gradient-to-br from-slate-900 via-zinc-900 to-zinc-950",
    label: "text-slate-300",
    value: "text-slate-50",
    dot: "bg-slate-300",
    glow: "shadow-slate-950/40",
  },
  warning: {
    card: "border-amber-500/35 bg-gradient-to-br from-amber-500/15 via-zinc-950 to-zinc-950",
    label: "text-amber-200",
    value: "text-amber-300",
    dot: "bg-amber-300",
    glow: "shadow-amber-950/30",
  },
  info: {
    card: "border-sky-500/35 bg-gradient-to-br from-sky-500/15 via-zinc-950 to-zinc-950",
    label: "text-sky-200",
    value: "text-sky-300",
    dot: "bg-sky-300",
    glow: "shadow-sky-950/30",
  },
  success: {
    card: "border-emerald-500/35 bg-gradient-to-br from-emerald-500/15 via-zinc-950 to-zinc-950",
    label: "text-emerald-200",
    value: "text-emerald-300",
    dot: "bg-emerald-300",
    glow: "shadow-emerald-950/30",
  },
  danger: {
    card: "border-rose-500/35 bg-gradient-to-br from-rose-500/15 via-zinc-950 to-zinc-950",
    label: "text-rose-200",
    value: "text-rose-300",
    dot: "bg-rose-300",
    glow: "shadow-rose-950/30",
  },
  base: {
    card: "border-indigo-500/35 bg-gradient-to-br from-indigo-500/15 via-zinc-950 to-zinc-950",
    label: "text-indigo-200",
    value: "text-indigo-300",
    dot: "bg-indigo-300",
    glow: "shadow-indigo-950/30",
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
  const selectedTone = resolveTone(tone, color)
  const styles = toneStyles[selectedTone]

  return (
    <div
      className={`${styles.card} ${styles.glow} relative min-h-[150px] overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_18px_45px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)] sm:p-6`}
    >
      <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex min-h-[40px] items-start gap-3">
        <span className={`${styles.dot} mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_18px_currentColor]`} />
        <p className={`${styles.label} text-sm font-semibold uppercase leading-5 tracking-[0.14em]`}>
          {title}
        </p>
      </div>

      <h2 className={`${styles.value} relative mt-5 text-4xl font-bold leading-none tracking-tight`}>
        {value}
      </h2>
    </div>
  )
}
