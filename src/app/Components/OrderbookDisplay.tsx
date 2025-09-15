
import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { MAX_LEVELS } from '../lib/constants';
import { FixedSizeList as List } from 'react-window';

type OrderbookRowProps = {
  price: number;
  size: number;
  depth: number;
  cumulative: number;
  type: 'bid' | 'ask';
  isSimulated?: boolean;
};

function OrderbookRow({ price, size, depth, cumulative, type, isSimulated = false }: OrderbookRowProps) {
  const bgClass = type === 'bid' ? 'bg-green-600/20' : 'bg-red-600/20';
  const textClass = type === 'bid' ? 'text-green-400' : 'text-red-400';

  if (isSimulated) {
    return (
      <div className={`relative flex items-center justify-between font-mono text-sm p-1.5 my-0.5 rounded-md border-2 ${type === 'bid' ? 'border-blue-400' : 'border-yellow-400'} bg-gray-700 animate-pulse`}>
        <ArrowRight className={`w-4 h-4 absolute -left-5 ${type === 'bid' ? 'text-blue-400' : 'text-yellow-400'}`} />
        <span className={type === 'bid' ? 'text-blue-400' : 'text-yellow-400'}>
          {typeof price === 'number' ? price.toFixed(4) : '—'}
        </span>
        <span className="text-white">
          {typeof size === 'number' ? size.toFixed(4) : '—'}
        </span>
        <span className="text-gray-400">--</span>
      </div>

    )
  }

  return (
    <div className="relative grid grid-cols-3 font-mono text-sm p-1.5 my-0.5 rounded-md hover:bg-gray-700/50">
      <div className={`absolute top-0 left-0 h-full rounded-md ${bgClass}`} style={{ width: `${depth}%` }}></div>
      <div className="relative z-10">
        <span className={textClass}>{price.toFixed(4)}</span>
      </div>
      <span className="text-white">
        {Number.isFinite(Number(size)) ? Number(size).toFixed(4) : '—'}
      </span>
      <span className="text-gray-400">
        {Number.isFinite(Number(cumulative)) ? Number(cumulative).toFixed(4) : '—'}
      </span>


    </div>
  );
}

type Order = {
  price: number;
  size: number;
  isSimulated?: boolean;
  depth?: number;
  cumulative?: number;
};

type Orderbook = {
  bids: Order[];
  asks: Order[];
};

type SimulatedOrder = {
  side: 'Buy' | 'Sell';
  orderType: 'Limit' | string;
  price: number;
  quantity: number;
} | null;

function insertSimulatedOrder(
  orders: Order[],
  side: 'Buy' | 'Sell',
  simulatedOrder: SimulatedOrder | null
): Order[] {
  if (!simulatedOrder || simulatedOrder.side !== side || simulatedOrder.orderType !== 'Limit') {
    return orders;
  }

  const price = Number(simulatedOrder.price);
  const quantity = Number(simulatedOrder.quantity);

  if (isNaN(price) || isNaN(quantity)) {
    console.warn('Invalid simulated order:', simulatedOrder);
    return orders;
  }

  const newOrders = [...orders];
  let inserted = false;

  for (let i = 0; i < newOrders.length; i++) {
    if ((side === 'Buy' && price >= newOrders[i].price) || (side === 'Sell' && price <= newOrders[i].price)) {
      newOrders.splice(i, 0, { price, size: quantity, isSimulated: true, depth: 0, cumulative: 0 });
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    newOrders.push({ price, size: quantity, isSimulated: true, depth: 0, cumulative: 0 });
  }

  return newOrders.slice(0, MAX_LEVELS);
}




export default function OrderbookDisplay({
  orderbook,
  simulatedOrder,
}: {
  orderbook: Orderbook;
  simulatedOrder: SimulatedOrder;
}) {
  const { bids, asks } = orderbook;

  const processedBids = useMemo(() => {
    let cumulative = 0;
    const processed = bids.map(bid => {
      cumulative += bid.size;
      return { ...bid, cumulative };
    });
    const maxCumulative = processed.at(-1)?.cumulative || 0;
    return processed.map(bid => ({ ...bid, depth: maxCumulative > 0 ? (bid.cumulative / maxCumulative) * 100 : 0 }));
  }, [bids]);

  const processedAsks = useMemo(() => {
    let cumulative = 0;
    const processed = asks.slice(0, MAX_LEVELS).map(ask => {
      cumulative += ask.size;
      return { ...ask, cumulative };
    });
    const maxCumulative = processed[processed.length - 1]?.cumulative || 0;
    return processed.map(ask => ({ ...ask, depth: maxCumulative > 0 ? (ask.cumulative / maxCumulative) * 100 : 0 }));
  }, [asks]);

  const displayBids = useMemo(
    () => insertSimulatedOrder(processedBids, 'Buy', simulatedOrder),
    [processedBids, simulatedOrder]
  );

  const displayAsks = useMemo(
    () => insertSimulatedOrder(processedAsks, 'Sell', simulatedOrder),
    [processedAsks, simulatedOrder]
  );

  const spread = useMemo(() => {
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = Math.max(...bids.map(b => b.price));
      const bestAsk = Math.min(...asks.map(a => a.price));
      console.log(bids, asks, bestAsk, bestBid)
      return Number(bestAsk) - Number(bestBid);
    }
    return 0;
  }, [bids, asks]);

  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white">Order Book</h2>
        <div className="text-sm font-mono text-gray-400">
          Spread: <span className="text-white">{spread.toFixed(4)}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="grid grid-cols-3 text-xs text-gray-400 font-mono px-2 pb-2">
            <span>Price (USD)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          <div className="h-[450px] pr-1">
            <List
              height={450}
              itemCount={displayBids.length}
              itemSize={36} // Adjust based on actual row height (includes padding/margin)
              width="100%"
            >
              {({ index, style }: { index: number; style: React.CSSProperties }) => {
                const bid = displayBids[index];
                return (
                  <div style={style}>

                    <OrderbookRow
                      key={`bid-${bid.price}-${index}`}
                      price={Number(bid.price)}
                      size={Number(bid.size)}
                      depth={Number(bid.depth ?? 0)}
                      cumulative={Number(bid.cumulative ?? 0)}
                      type="bid"
                      isSimulated={bid.isSimulated}
                    />


                  </div>
                );
              }}

            </List>
          </div>


        </div>
        <div>
          <div className="grid grid-cols-3 text-xs text-gray-400 font-mono px-2 pb-2">
            <span>Price (USD)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          <div className="h-[450px] pr-1">
            <List
              height={450}
              itemCount={displayAsks.length}
              itemSize={36}
              width="100%"
            >
              {({ index, style }: { index: number; style: React.CSSProperties }) => {
                const ask = displayAsks[index];
                return (
                  <div style={style}>

                    <OrderbookRow
                      key={`ask-${ask.price}-${index}`}
                      price={Number(ask.price)}
                      size={Number(ask.size)}
                      depth={Number(ask.depth ?? 0)}
                      cumulative={Number(ask.cumulative ?? 0)}
                      type="ask"
                      isSimulated={ask.isSimulated}
                    />

                  </div>
                );
              }}

            </List>
          </div>

        </div>
      </div>
    </div>
  );
}
