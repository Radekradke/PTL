import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Datum = { name: string; total: number }

export function AreaTrend({ data, height = 300 }: { data: Datum[]; height?: number }) {
  const hasData = data.some((d) => d.total > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--surface-inset)] text-sm text-[color:var(--muted-foreground)]" style={{ height }}>
        Sem dados para exibir.
      </div>
    )
  }

  return (
    <div style={{ width: "100%", height }} className="ls-chart-scroll">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="lsAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00A859" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#00A859" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ECECEE" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            interval={0}
            height={48}
            tick={{ fill: "#71717A", fontSize: 11 }}
            angle={-18}
            textAnchor="end"
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} tick={{ fill: "#71717A", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid #E7E7E9", fontSize: 12, boxShadow: "0 12px 24px -8px rgba(24,24,27,0.14)" }}
            cursor={{ stroke: "#00A859", strokeOpacity: 0.25, strokeWidth: 1.5 }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#00A859"
            strokeWidth={2.5}
            fill="url(#lsAreaFill)"
            dot={{ r: 3, fill: "#00A859", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
