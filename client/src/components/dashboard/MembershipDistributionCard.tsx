import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MembershipType {
  id: string;
  name: string;
  count: number;
}

interface MembershipDistributionCardProps {
  data: MembershipType[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MembershipDistributionCard: React.FC<MembershipDistributionCardProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="mb-4 text-xl font-semibold">Membership Distribution</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} members`, 'Count']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">{item.name}</span>
            </div>
            <span className="text-sm font-medium">{item.count}</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Members</span>
            <span className="text-sm font-medium">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipDistributionCard; 