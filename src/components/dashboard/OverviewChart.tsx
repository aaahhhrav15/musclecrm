
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data
const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
  { name: 'Aug', value: 3490 },
  { name: 'Sep', value: 4000 },
  { name: 'Oct', value: 4500 },
  { name: 'Nov', value: 5000 },
  { name: 'Dec', value: 6000 },
];

interface OverviewChartProps {
  title: string;
  valuePrefix?: string;
  valueSuffix?: string;
  dataKey?: string;
  data?: Array<{ name: string; value: number } & Record<string, any>>;
  colors?: {
    stroke: string;
    fill: string;
  };
}

const OverviewChart: React.FC<OverviewChartProps> = ({
  title,
  valuePrefix = '',
  valueSuffix = '',
  dataKey = 'value',
  data: customData,
  colors = {
    stroke: 'hsl(var(--primary))',
    fill: 'hsl(var(--primary) / 0.2)',
  },
}) => {
  const chartData = customData || data;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tickFormatter={(value) => `${valuePrefix}${value}${valueSuffix}`}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [`${valuePrefix}${value}${valueSuffix}`, 'Value']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.375rem',
                }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={colors.stroke}
                fill={colors.fill}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverviewChart;
