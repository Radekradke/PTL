interface Props {
  title: string
  value: string
  color?: string
}

export function StatsCard({ title, value, color = "bg-zinc-900" }: Props) {
  return (
    <div className={`${color} rounded-[1.75rem] border border-zinc-800 p-6 shadow-[0_15px_40px_rgba(15,23,42,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:border-cyan-500/40`}>
      <p className="text-zinc-400 text-sm uppercase tracking-[0.16em]">{title}</p>
      <h2 className="mt-4 text-4xl font-semibold text-white">{value}</h2>
    </div>
  )
}