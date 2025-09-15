import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type DepthChartData = {
    bids: { price: number; size: number }[];
    asks: { price: number; size: number }[];
};

export default function DepthChart({ data }: { data: DepthChartData }) {
    const chartData = useMemo(() => {
        if (!data || !data.bids || !data.asks) return [];
        const bids = data.bids.slice(0, 50).map(b => ({...b}));
        const asks = data.asks.slice(0, 50).map(a => ({...a}));

        let cumulativeBidSize = 0;
        const bidData = bids
            .sort((a, b) => b.price - a.price)
            .map(bid => {
                cumulativeBidSize += bid.size;
                return { price: bid.price, Bids: cumulativeBidSize };
            }).reverse();

        let cumulativeAskSize = 0;
        const askData = asks
            .sort((a, b) => a.price - b.price)
            .map(ask => {
                cumulativeAskSize += ask.size;
                return { price: ask.price, Asks: cumulativeAskSize };
            });

        // Merge and sort data for a continuous price axis
        const combined = new Map();
        bidData.forEach(item => combined.set(item.price, { ...combined.get(item.price), ...item }));
        askData.forEach(item => combined.set(item.price, { ...combined.get(item.price), ...item }));
        
        const sortedData = Array.from(combined.values()).sort((a, b) => a.price - b.price);

        // Fill forward for bids and backward for asks to create the "mountain" effect
        for (let i = 1; i < sortedData.length; i++) {
            if (sortedData[i].Bids === undefined) {
                sortedData[i].Bids = sortedData[i-1].Bids;
            }
        }
        for (let i = sortedData.length - 2; i >= 0; i--) {
            if (sortedData[i].Asks === undefined) {
                sortedData[i].Asks = sortedData[i+1].Asks;
            }
        }

        return sortedData;
    }, [data]);

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg h-80">
            <h2 className="text-lg font-semibold text-white mb-4">Market Depth</h2>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <defs>
                        <linearGradient id="colorBids" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAsks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F87171" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="price" 
                        domain={['dataMin', 'dataMax']} 
                        type="number"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(price) => `$${price.toFixed(2)}`}
                    />
                    <YAxis 
                        orientation="right" 
                        tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                        tickFormatter={(size) => (size / 1000).toFixed(1) + 'k'}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563', borderRadius: '0.5rem' }}
                        labelStyle={{ color: '#F9FAFB' }}
                        formatter={(value, name) => [typeof value === 'number' ? value.toFixed(4) : value, name]}
                        labelFormatter={(label) => `Price: $${label.toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{fontSize: "14px", bottom: 0}}/>
                    <Area type="step" dataKey="Bids" stroke="#10B981" fillOpacity={1} fill="url(#colorBids)" />
                    <Area type="step" dataKey="Asks" stroke="#F87171" fillOpacity={1} fill="url(#colorAsks)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
