import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface VelocityChartProps {
  data: { time: number; velocity: number }[];
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ data }) => {
  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
            itemStyle={{ color: '#818cf8' }}
          />
          <Line type="monotone" dataKey="velocity" stroke="#818cf8" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
