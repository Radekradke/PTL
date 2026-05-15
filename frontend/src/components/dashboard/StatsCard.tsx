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
  accent: string
  iconBg: string
}> = {
  neutral: {
    card: "border-[#D6E6DC] bg-white",
    label: "text-[#5D6B62]",
    value: "text-[#22352B]",
    accent: "bg-[#32624A]",
    iconBg: "bg-[#32624A]/10",
  },
  warning: {
    card: "border-[#F59E0B]/25 bg-[#FFF9EE]",
    label: "text-[#7A5208]",
    value: "text-[#B66C00]",
    accent: "bg-[#F59E0B]",
    iconBg: "bg-[#F59E0B]/12",
  },
  info: {
    card: "border-[#4F93D2]/25 bg-[#F2F8FD]",
    label: "text-[#315F86]",
    value: "text-[#2F75B5]",
    accent: "bg-[#4F93D2]",
    iconBg: "bg-[#4F93D2]/12",
  },
  success: {
    card: "border-[#42A95E]/25 bg-[#F1FAF4]",
    label: "text-[#32624A]",
    value: "text-[#2F8B4C]",
    accent: "bg-[#42A95E]",
    iconBg: "bg-[#42A95E]/12",
  },
  danger: {
    card: "border-[#EF4444]/25 bg-[#FFF4F4]",
    label: "text-[#943333]",
    value: "text-[#D92E2E]",
    accent: "bg-[#EF4444]",
    iconBg: "bg-[#EF4444]/12",
  },
  base: {
    card: "border-[#80B092]/35 bg-[#F4FAF6]",
    label: "text-[#32624A]",
    value: "text-[#32624A]",
    accent: "bg-[#80B092]",
    iconBg: "bg-[#80B092]/14",
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
      className={`${styles.card} group relative min-h-[116px] overflow-hidden rounded-[1.35rem] border p-4 shadow-[0_10px_28px_rgba(50,98,74,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(50,98,74,0.14)] sm:min-h-[132px] sm:rounded-[1.65rem] sm:p-5`}
    >
      <div className={`absolute left-0 top-0 h-full w-1.5 ${styles.accent}`} />
      <div className="flex items-start justify-between gap-3 pl-1">
        <p className={`${styles.label} max-w-[12rem] text-[11px] font-bold uppercase leading-5 tracking-[0.12em] sm:text-xs`}>
          {title}
        </p>
        <span className={`${styles.iconBg} mt-0.5 h-8 w-8 shrink-0 rounded-2xl ring-1 ring-black/5`} />
      </div>
      <h2 className={`${styles.value} mt-4 pl-1 text-3xl font-black leading-none tracking-[-0.06em] sm:text-4xl`}>
        {value}
      </h2>
    </div>
  )
}
