import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Layers, AlertTriangle } from 'lucide-react';

type MetricItemProps = {
    label: string;
    value: string;
    icon: React.ReactElement;
};

function MetricItem({ label, value, icon }: MetricItemProps) {
    return (
        <div className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
            <div className="flex items-center gap-2">
                {React.cloneElement(icon, { className: 'w-5 h-5' })}
                <span className="text-sm text-gray-300">{label}</span>
            </div>
            <span className="font-mono text-sm font-semibold text-white">{value}</span>
        </div>
    );
}

type Order = {
    side: 'Buy' | 'Sell';
    quantity: number;
    price: number;
    orderType: 'Market' | 'Limit';
};

type OrderbookLevel = {
    price: number;
    size: number;
};

type Orderbook = {
    bids: OrderbookLevel[];
    asks: OrderbookLevel[];
};

type MetricsPanelProps = {
    order: Order;
    orderbook: Orderbook;
};

export default function MetricsPanel({ order, orderbook }: MetricsPanelProps) {
    const metrics = useMemo(() => {
        if (!order || orderbook.bids.length === 0 || orderbook.asks.length === 0) {
            return { fillPercent: 0, slippage: 0, impact: 0, avgFillPrice: 0, warning: null };
        }

        const { side, quantity, price, orderType } = order;
        let filledQuantity = 0;
        let totalCost = 0;
        let slippage = 0;
        let impact = 0;
        let warning = null;

        if (orderType === 'Market') {
            const bookSide = side === 'Buy' ? orderbook.asks : orderbook.bids;
            const bestPrice = side === 'Buy' ? orderbook.asks[orderbook.asks.length - 1].price : orderbook.bids[0].price;
            let remainingQty = quantity;
            
            const relevantLevels = side === 'Buy' ? [...bookSide].reverse() : bookSide;

            for (const level of relevantLevels) {
                if (remainingQty <= 0) break;
                const qtyAtLevel = Math.min(remainingQty, level.size);
                filledQuantity += qtyAtLevel;
                totalCost += qtyAtLevel * level.price;
                remainingQty -= qtyAtLevel;
            }

            if (filledQuantity > 0) {
                const avgFillPrice = totalCost / filledQuantity;
                slippage = Math.abs(avgFillPrice - bestPrice) / bestPrice * 100;
                
                let lastFillPrice = bestPrice;
                let cumQty = 0;
                for(const level of relevantLevels){
                    cumQty += level.size;
                    if(cumQty >= filledQuantity) {
                        lastFillPrice = level.price;
                        break;
                    }
                }
                impact = Math.abs(lastFillPrice - bestPrice) / bestPrice * 100;

                if (remainingQty > 0) {
                    warning = `Order may not fully fill. Only ${filledQuantity.toFixed(4)} of ${quantity} could be filled with available liquidity.`;
                }
            }
        } else { // Limit Order
            const bookSide = side === 'Buy' ? orderbook.asks : orderbook.bids;
            let cumulativeSize = 0;
            
            if (side === 'Buy') {
                for (let i = bookSide.length - 1; i >= 0; i--) {
                    if (bookSide[i].price <= price) {
                        cumulativeSize += bookSide[i].size;
                    }
                }
            } else { // Sell
                for (const level of bookSide) {
                    if (level.price >= price) {
                        cumulativeSize += level.size;
                    }
                }
            }
            filledQuantity = Math.min(quantity, cumulativeSize);
        }
        
        const fillPercent = quantity > 0 ? (filledQuantity / quantity) * 100 : 0;
        if (slippage > 1) warning = `High slippage warning! Estimated slippage is ${slippage.toFixed(2)}%.`;
        if (impact > 1) warning = (warning ? warning + ' ' : '') + `High market impact warning!`;


        return {
            fillPercent,
            slippage,
            impact,
            avgFillPrice: filledQuantity > 0 && totalCost > 0 ? totalCost / filledQuantity : 0,
            warning
        };

    }, [order, orderbook]);

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Simulation Metrics</h2>
            <div className="space-y-3">
                <MetricItem label="Est. Fill Percentage" value={`${metrics.fillPercent.toFixed(2)}%`} icon={<TrendingUp className="text-blue-400" />} />
                <MetricItem label="Est. Slippage" value={`${metrics.slippage.toFixed(4)}%`} icon={<TrendingDown className="text-blue-400" />} />
                <MetricItem label="Market Impact" value={`${metrics.impact.toFixed(4)}%`} icon={<Layers className="text-blue-400" />} />
                {order.orderType === 'Market' && <MetricItem label="Avg. Fill Price" value={`$${metrics.avgFillPrice.toFixed(4)}`} icon={<Layers className="text-blue-400" />} />}
            </div>
            {metrics.warning && (
                <div className="mt-4 p-3 bg-yellow-900/50 border border-yellow-600/70 rounded-md flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <p className="text-sm text-yellow-300">{metrics.warning}</p>
                </div>
            )}
        </div>
    );
}
