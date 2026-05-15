type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<
  StatsCardTone,
  {
    accent: string
    soft: string
    value: string
  }
> = {
  neutral: {
    accent: "bg-[#32624A]",
    soft: "bg-[#32624A]/8",
    value: "text-[#253128]",
  },
  warning: {
    accent: "bg-[#F59E0B]",
    soft: "bg-[#F59E0B]/10",
    value: "text-[#9A5B00]",
  },
  info: {
    accent: "bg-[#4F93D2]",
    soft: "bg-[#4F93D2]/10",
    value: "text-[#2F6FA8]",
  },
  success: {
    accent: "bg-[#42A95E]",
    soft: "bg-[#42A95E]/10",
    value: "text-[#2F8B4C]",
  },
  danger: {
    accent: "bg-[#EF4444]",
    soft: "bg-[#EF4444]/10",
    value: "text-[#C92D2D]",
  },
  base: {
    accent: "bg-[#80B092]",
    soft: "bg-[#80B092]/14",
    value: "text-[#32624A]",
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
    <div className="group relative min-h-[96px] overflow-hidden rounded-2xl border border-[#E5ECE7] bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#B4D7C4] hover:shadow-[0_12px_28px_rgba(50,98,74,0.10)] sm:min-h-[112px] sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`} />

      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[11rem] text-xs font-medium leading-5 text-[#6E7D73]">
          {title}
        </p>

        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${styles.accent}`} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <h2 className={`text-3xl font-semibold leading-none tracking-[-0.04em] ${styles.value} sm:text-4xl`}>
          {value}
        </h2>

        <div className={`h-9 w-9 rounded-2xl ${styles.soft}`} />
      </div>
    </div>
  )
}
