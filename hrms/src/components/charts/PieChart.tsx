import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface PieChartProps {
  data: { name: string; value: number }[]
  colors?: string[]
  height?: number
  innerRadius?: number
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export function PieChart({ data, colors = DEFAULT_COLORS, height = 250, innerRadius = 0 }: PieChartProps) {
  const outerRadius = Math.round(height * 0.3)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          isAnimationActive={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => (value as number).toLocaleString()} />
        <Legend />
      </RePieChart>
    </ResponsiveContainer>
  )
}
