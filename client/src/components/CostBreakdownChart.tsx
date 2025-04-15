import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CostBreakdownChartProps {
  breakdown: {
    transportation: number;
    labor: number;
    materials: number;
    other: number;
  };
}

export function CostBreakdownChart({ breakdown }: CostBreakdownChartProps) {
  const data = [
    { name: 'Transportation', value: breakdown.transportation, color: '#4F46E5' },
    { name: 'Labor', value: breakdown.labor, color: '#818CF8' },
    { name: 'Materials', value: breakdown.materials, color: '#C7D2FE' },
    { name: 'Other', value: breakdown.other, color: '#E2E8F0' },
  ];

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={30}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`$${value}`, name]}
            contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
