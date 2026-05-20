type StatsCardTone = "neutral" | "warning" | "info" | "success" | "danger" | "base"

interface Props {
  title: string
  value: string
  color?: string
  tone?: StatsCardTone
}

const toneStyles: Record<StatsCardTone, { label: string; value: string; accent: string; glow: string }> = {
  neutral: { label: "text-slate-500", value: "text-[#111827]", accent: "bg-[#073B2A]", glow: "bg-[#073B2A]/8" },
  warning: { label: "text-amber-700", value: "text-amber-700", accent: "bg-[#F59E0B]", glow: "bg-amber-100" },
  info: { label: "text-[#102A43]", value: "text-[#102A43]", accent: "bg-[#102A43]", glow: "bg-blue-100" },
  success: { label: "text-[#073B2A]", value: "text-[#00A859]", accent: "bg-[#00A859]", glow: "bg-emerald-100" },
  danger: { label: "text-rose-700", value: "text-rose-700", accent: "bg-rose-500", glow: "bg-rose-100" },
  base: { label: "text-cyan-700", value: "text-cyan-700", accent: "bg-cyan-500", glow: "bg-cyan-100" },
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
    <div className="group relative overflow-hidden rounded-[1.15rem] border border-[#DDE8E2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFA_100%)] p-3 shadow-[0_10px_28px_rgba(16,42,67,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BFEFD7] hover:shadow-[0_20px_54px_rgba(16,42,67,0.12)] sm:rounded-[1.5rem] sm:p-5 sm:shadow-[0_16px_44px_rgba(16,42,67,0.07)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A859]/45 to-transparent" />
      <div className={`absolute left-0 top-0 h-full w-1 sm:w-1.5 ${styles.accent}`} />
      <div className="flex items-start justify-between gap-2 pl-1 sm:gap-3">
        <p className={`${styles.label} max-w-[12rem] text-[10px] font-black uppercase leading-4 tracking-[0.1em] sm:text-xs sm:leading-5 sm:tracking-[0.12em]`}>
          {title}
        </p>
        <span className={`${styles.glow} h-6 w-6 shrink-0 rounded-xl ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8 sm:rounded-2xl`} />
      </div>
      <h2 className={`${styles.value} mt-3 pl-1 text-2xl font-black leading-none tracking-[-0.045em] sm:mt-4 sm:text-4xl sm:tracking-[-0.055em]`}>
        {value}
      </h2>
    </div>
  )
}
