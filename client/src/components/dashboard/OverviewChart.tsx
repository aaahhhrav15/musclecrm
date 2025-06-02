import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  month: string;
  total: number;
}

interface OverviewChartProps {
  title: string;
  valuePrefix?: string;
  data: ChartData[];
}

const OverviewChart: React.FC<OverviewChartProps> = ({ title, valuePrefix = '', data }) => {
  return (
    <div className="p-6 border rounded-lg">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`${valuePrefix}${value.toLocaleString()}`, 'Value']}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewChart;
