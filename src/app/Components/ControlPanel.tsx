import React, { useState, useEffect } from 'react';
import { VENUES, SYMBOLS, SimulatedOrder } from '../lib/constants';

type VenueKey = keyof typeof VENUES;

interface ControlPanelProps {
  activeVenue: VenueKey;
  onVenueChange: (venue: VenueKey) => void;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  onSimulate: (order: SimulatedOrder) => void;
  onClear: () => void;
  orderbook: {
    bids: { price: number; size: number }[];
    asks: { price: number; size: number }[];
  };
}


export default function ControlPanel({
  activeVenue,
  onVenueChange,
  symbol,
  onSymbolChange,
  onSimulate,
  onClear,
  orderbook,
}: ControlPanelProps) {
  const [formState, setFormState] = useState({
    orderType: 'Limit',
    side: 'Buy',
    price: '',
    quantity: '',
    delay: '0',
  });

  useEffect(() => {
    if (orderbook.asks.length > 0 && orderbook.bids.length > 0) {
      const bestAsk = orderbook.asks[orderbook.asks.length - 1].price;
      const bestBid = orderbook.bids[0].price;
      if (formState.side === 'Buy') {
        setFormState(prev => ({ ...prev, price: bestAsk.toString() }));
      } else {
        setFormState(prev => ({ ...prev, price: bestBid.toString() }));
      }
    }
  }, [orderbook, formState.side]);


  interface FormState {
    orderType: 'Limit' | 'Market';
    side: 'Buy' | 'Sell';
    price: string;
    quantity: string;
    delay: string;
  }

  interface InputChangeEvent {
    target: {
      name: keyof FormState;
      value: string;
    };
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as InputChangeEvent['target'];
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  interface SimulatedOrder {
    orderType: "Market" | "Limit";
    side: "Buy" | "Sell";
    price: number;
    quantity: number;
    delay: string;
  }


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const price: number = formState.orderType === 'Limit' ? parseFloat(formState.price) : 0;
    const quantity: number = parseFloat(formState.quantity);

    const normalizedOrderType = formState.orderType === 'Limit' ? 'Limit' : 'Market';
    const normalizedSide = formState.side === 'Buy' ? 'Buy' : 'Sell';

    if (quantity > 0 && (normalizedOrderType === 'Market' || price > 0)) {
      onSimulate({
        ...formState,
        orderType: normalizedOrderType,
        side: normalizedSide,
        price,
        quantity,
      } as SimulatedOrder);
    } else {
      alert("Please enter a valid quantity and price for limit orders.");
    }
  };



  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
      <h2 className="text-lg font-semibold text-white mb-4">Order Simulation</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">Venue</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(VENUES).map(venue => (
            <button
              key={venue}
              onClick={() => onVenueChange(venue as VenueKey)}
              className={`px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${activeVenue === venue ? 'bg-blue-600 text-white shadow' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
            >
              {venue}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="symbol" className="block text-sm font-medium text-gray-400 mb-1">Symbol</label>
        <div className="relative">
          <select
            id="symbol"
            name="symbol"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SYMBOLS[activeVenue].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
            <select name="orderType" value={formState.orderType} onChange={handleInputChange} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white">
              <option>Limit</option>
              <option>Market</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Side</label>
            <div className="grid grid-cols-2">
              <button type="button" onClick={() => setFormState(p => ({ ...p, side: 'Buy' }))} className={`py-2 text-sm rounded-l-md ${formState.side === 'Buy' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>BUY</button>
              <button type="button" onClick={() => setFormState(p => ({ ...p, side: 'Sell' }))} className={`py-2 text-sm rounded-r-md ${formState.side === 'Sell' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}>SELL</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Price</label>
            <input type="number" step="any" name="price" value={formState.price} onChange={handleInputChange} disabled={formState.orderType === 'Market'} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white disabled:bg-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
            <input type="number" step="any" name="quantity" value={formState.quantity} onChange={handleInputChange} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-1">Timing (Delay)</label>
          <select name="delay" value={formState.delay} onChange={handleInputChange} className="w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3 text-white">
            <option value="0">Immediate</option>
            <option value="5">5s Delay</option>
            <option value="10">10s Delay</option>
            <option value="30">30s Delay</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all">Simulate Order</button>
          <button type="button" onClick={onClear} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-all">Clear</button>
        </div>
      </form>
    </div>
  );
}
