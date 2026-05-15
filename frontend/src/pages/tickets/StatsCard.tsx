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
    card: "border-white/15 bg-[linear-gradient(135deg,#102E26_0%,#174A3A_48%,#2563EB_140%)]",
    label: "text-emerald-50/80",
    value: "text-white",
    dot: "bg-emerald-300",
    glow: "shadow-emerald-950/25",
  },
  warning: {
    card: "border-amber-300/25 bg-[linear-gradient(135deg,#3A2B12_0%,#174A3A_55%,#F59E0B_150%)]",
    label: "text-amber-50/85",
    value: "text-white",
    dot: "bg-amber-300",
    glow: "shadow-amber-950/20",
  },
  info: {
    card: "border-sky-300/25 bg-[linear-gradient(135deg,#102E36_0%,#174A3A_55%,#2563EB_145%)]",
    label: "text-sky-50/85",
    value: "text-white",
    dot: "bg-sky-300",
    glow: "shadow-sky-950/20",
  },
  success: {
    card: "border-emerald-300/25 bg-[linear-gradient(135deg,#123C2D_0%,#1C6B4C_55%,#2FA866_140%)]",
    label: "text-emerald-50/85",
    value: "text-white",
    dot: "bg-emerald-200",
    glow: "shadow-emerald-950/20",
  },
  danger: {
    card: "border-rose-300/25 bg-[linear-gradient(135deg,#3A171B_0%,#174A3A_55%,#EF4444_150%)]",
    label: "text-rose-50/85",
    value: "text-white",
    dot: "bg-rose-300",
    glow: "shadow-rose-950/20",
  },
  base: {
    card: "border-blue-300/25 bg-[linear-gradient(135deg,#102E36_0%,#174A3A_52%,#2563EB_140%)]",
    label: "text-blue-50/85",
    value: "text-white",
    dot: "bg-blue-300",
    glow: "shadow-blue-950/20",
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
    <div
      className={`${styles.card} ${styles.glow} group relative min-h-[126px] overflow-hidden rounded-[1.65rem] border p-5 shadow-[0_18px_44px_rgba(15,23,42,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.28)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%)]" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className={`${styles.label} max-w-[12rem] text-xs font-bold uppercase leading-5 tracking-[0.13em]`}>
          {title}
        </p>
        <span className={`${styles.dot} mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_18px_currentColor]`} />
      </div>
      <h2 className={`${styles.value} relative mt-5 text-4xl font-black leading-none tracking-[-0.06em]`}>
        {value}
      </h2>
    </div>
  )
}
