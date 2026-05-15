type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, { accent: string; bg: string; text: string; soft: string }> = {
  neutral: { accent: "#174A3A", bg: "bg-white", text: "text-[#17221C]", soft: "bg-[#F1F6F3]" },
  warning: { accent: "#D97706", bg: "bg-white", text: "text-[#92400E]", soft: "bg-[#FFF7ED]" },
  info: { accent: "#2563EB", bg: "bg-white", text: "text-[#1D4ED8]", soft: "bg-[#EFF6FF]" },
  success: { accent: "#2FA866", bg: "bg-white", text: "text-[#147A49]", soft: "bg-[#ECFDF3]" },
  danger: { accent: "#DC2626", bg: "bg-white", text: "text-[#B42318]", soft: "bg-[#FFF1F1]" },
  base: { accent: "#0E7490", bg: "bg-white", text: "text-[#0E7490]", soft: "bg-[#ECFEFF]" },
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
    <div className="relative min-h-[104px] overflow-hidden rounded-3xl border border-[#DFE7E2] bg-white p-4 shadow-[0_10px_28px_rgba(23,34,28,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(23,34,28,0.10)] sm:min-h-[124px] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: styles.accent }} />
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[11rem] text-xs font-bold uppercase leading-5 tracking-[0.10em] text-[#6D7A72]">
          {title}
        </p>
        <span className={`h-8 w-8 rounded-2xl ${styles.soft}`} style={{ boxShadow: `inset 0 0 0 1px ${styles.accent}22` }} />
      </div>
      <h2 className={`mt-4 text-3xl font-black leading-none tracking-[-0.06em] ${styles.text} sm:text-4xl`}>
        {value}
      </h2>
    </div>
  )
}
