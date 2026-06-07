import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  bars: { key: string; color: string; label?: string }[]
  height?: number
  formatY?: (v: unknown) => string
  layout?: 'horizontal' | 'vertical'
}

export function BarChart({ data, xKey, bars, height = 250, formatY, layout = 'horizontal' }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatY} />
          </>
        ) : (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatY} />
            <YAxis type="category" dataKey={xKey} tick={{ fontSize: 12 }} width={100} />
          </>
        )}
        <Tooltip formatter={formatY} />
        <Legend />
        {bars.map(b => (
          <Bar key={b.key} dataKey={b.key} name={b.label ?? b.key} fill={b.color} radius={[3, 3, 0, 0]} />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  )
}
