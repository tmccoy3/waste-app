"use client"

import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ProfitTierData {
  name: string
  value: number
  fill: string
}

interface ProfitTiersPieChartProps {
  data: ProfitTierData[]
}

export default function ProfitTiersPieChart({ data }: ProfitTiersPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie 
          data={data} 
          dataKey="value" 
          nameKey="name"
          cx="50%" 
          cy="50%" 
          outerRadius={80} 
          label={({ name, value }) => `${name}: ${value}`}
        />
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
} 