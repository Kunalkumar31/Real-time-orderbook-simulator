import React from 'react';
import { Layers } from 'lucide-react';

interface HeaderProps {
    status: string;
    activeVenue: string;
    symbol: string;
}

export default function Header({ status, activeVenue, symbol }: HeaderProps) {
    const statusColor = status === 'Connected' ? 'text-green-400' : status === 'Connecting...' ? 'text-yellow-400' : 'text-red-400';
    return (
        <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Layers className="w-8 h-8 text-blue-400" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Multi-Venue Orderbook</h1>
                    <p className="text-sm text-gray-400">Real-time simulation & analysis</p>
                </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-800 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : status === 'Connecting...' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    <span className={`font-mono text-sm ${statusColor}`}>{status}</span>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="font-mono text-sm text-white">{activeVenue} / {symbol}</div>
            </div>
        </header>
    );
}
