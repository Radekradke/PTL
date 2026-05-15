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
    card: "border-[#B4D7C4]/70 bg-white",
    label: "text-[#66736B]",
    value: "text-[#2B2B2B]",
    dot: "bg-[#32624A]",
    glow: "shadow-[0_18px_50px_rgba(50,98,74,0.10)]",
  },
  warning: {
    card: "border-[#F59E0B]/30 bg-gradient-to-br from-white to-[#FFF8EA]",
    label: "text-[#9A6505]",
    value: "text-[#B56F00]",
    dot: "bg-[#F59E0B]",
    glow: "shadow-[0_18px_50px_rgba(245,158,11,0.12)]",
  },
  info: {
    card: "border-[#4F93D2]/30 bg-gradient-to-br from-white to-[#EEF7FF]",
    label: "text-[#356D9E]",
    value: "text-[#4F93D2]",
    dot: "bg-[#4F93D2]",
    glow: "shadow-[0_18px_50px_rgba(79,147,210,0.12)]",
  },
  success: {
    card: "border-[#42A95E]/35 bg-gradient-to-br from-white to-[#EBF8EF]",
    label: "text-[#32624A]",
    value: "text-[#42A95E]",
    dot: "bg-[#42A95E]",
    glow: "shadow-[0_18px_50px_rgba(66,169,94,0.14)]",
  },
  danger: {
    card: "border-[#EF4444]/30 bg-gradient-to-br from-white to-[#FFF0F0]",
    label: "text-[#A23A3A]",
    value: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
    glow: "shadow-[0_18px_50px_rgba(239,68,68,0.12)]",
  },
  base: {
    card: "border-[#80B092]/40 bg-gradient-to-br from-white to-[#F0F8F3]",
    label: "text-[#32624A]",
    value: "text-[#32624A]",
    dot: "bg-[#80B092]",
    glow: "shadow-[0_18px_50px_rgba(128,176,146,0.14)]",
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
      className={`${styles.card} ${styles.glow} relative min-h-[150px] overflow-hidden rounded-[1.75rem] border p-5 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(50,98,74,0.16)] sm:p-6`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#DFF5E6] blur-2xl" />

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
