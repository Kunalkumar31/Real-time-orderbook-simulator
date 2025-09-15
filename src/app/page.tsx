'use client'; // Enables Client Component mode in Next.js (necessary for useState, useEffect, etc.)

import React, { useState, useEffect } from 'react';

// Importing custom UI components
import Header from './Components/Header';
import ControlPanel from './Components/ControlPanel';
import MetricsPanel from './Components/MetricsPanel';
import OrderbookDisplay from './Components/OrderbookDisplay';
import DepthChart from './Components/DepthChart';

// Constants and types
import { SYMBOLS, WEBSOCKET_URLS, VenueKey, Orderbook } from './lib/constants';

// Interface for simulated order data
interface SimulatedOrder {
  orderType: "Market" | "Limit";
  side: 'Buy' | 'Sell';
  price: number;
  quantity: number;
  delay: string;
}

export default function App() {
  // State for current active venue (OKX, BYBIT, or DERIBIT)
  const [activeVenue, setActiveVenue] = useState<VenueKey>('OKX');

  // State for current symbol selected (based on active venue)
  const [symbol, setSymbol] = useState(SYMBOLS['OKX'][0]);

  // State to hold live orderbook data (bids and asks)
  const [orderbook, setOrderbook] = useState<Orderbook>({
    bids: [],
    asks: [],
  });

  // State to track WebSocket connection status
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // State to manage a currently simulated order (for metrics visualization)
  const [simulatedOrder, setSimulatedOrder] = useState<SimulatedOrder | null>(null);

  // WebSocket connection and live data handler
  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    let ws: WebSocket | null = null;

    // Reset state on venue or symbol change
    setOrderbook({ bids: [], asks: [] });
    setSimulatedOrder(null);
    setConnectionStatus('Connecting...');

    try {
      // Open WebSocket connection
      ws = new WebSocket(WEBSOCKET_URLS[activeVenue]);

      // Handle connection open event
      ws.onopen = () => {
        if (!isMounted || !ws) return;

        setConnectionStatus('Connected');

        // Prepare venue-specific subscription message
        let subMsg;
        switch (activeVenue) {
          case 'OKX':
            subMsg = {
              op: 'subscribe',
              args: [{ channel: 'books', instId: symbol }],
            };
            break;
          case 'BYBIT':
            subMsg = {
              op: 'subscribe',
              args: [`orderbook.50.${symbol}`],
            };
            break;
          case 'DERIBIT':
            subMsg = {
              jsonrpc: '2.0',
              id: 1,
              method: 'public/subscribe',
              params: {
                channels: [`book.${symbol}.100ms`],
              },
            };
            break;
        }


        // Send subscription message
        if (ws.readyState === WebSocket.OPEN && subMsg) {
          ws.send(JSON.stringify(subMsg));
        }
      };

      // Handle incoming WebSocket messages
      ws.onmessage = (event) => {
        if (!isMounted) return;

        try {
          const data = JSON.parse(event.data);

          // Handle error event
          if (data.event === 'error') {
            setConnectionStatus(`Error: ${data.msg}`);
            return;
          }

          let newBids: { price: number; size: number }[] = [];
          let newAsks: { price: number; size: number }[] = [];

          // Parse orderbook data for each exchange format
          switch (activeVenue) {
            case 'OKX':
              if (data.arg?.channel === 'books' && Array.isArray(data.data) && data.data.length > 0) {
                const book = data.data[0];
                newBids = book.bids.map(([price, size]: [string, string]) => ({
                  price: parseFloat(price),
                  size: parseFloat(size),
                }));
                newAsks = book.asks.map(([price, size]: [string, string]) => ({
                  price: parseFloat(price),
                  size: parseFloat(size),
                }));
                setOrderbook({ bids: newBids, asks: newAsks.reverse() }); // Reverse asks for display
              }
              break;
            case 'BYBIT':
              if (data.topic?.startsWith('orderbook.50') && data.data) {
                const { b, a } = data.data;
                newBids = b.map(([price, size]: [string, string]) => ({
                  price: parseFloat(price),
                  size: parseFloat(size),
                }));
                newAsks = a.map(([price, size]: [string, string]) => ({
                  price: parseFloat(price),
                  size: parseFloat(size),
                }));
                setOrderbook({ bids: newBids, asks: newAsks });
              }
              break;
            case 'DERIBIT':
              if (data.method === 'subscription' && data.params?.channel.startsWith('book.')) {
                const { bids, asks } = data.params.data;
                newBids = bids.map(([price, size]: [number, number]) => ({ price, size }));
                newAsks = asks.map(([price, size]: [number, number]) => ({ price, size }));
                setOrderbook({ bids: newBids, asks: newAsks });
              }
              break;
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
          setConnectionStatus('Data parsing error');
        }
      };

      // Handle WebSocket disconnection
      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('Disconnected');
      };

      // Handle WebSocket error
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        if (isMounted) setConnectionStatus('Error');
      };
    } catch (err) {
      console.error('WebSocket setup error:', err);
      setConnectionStatus('Error creating connection');
    }

    // Cleanup on unmount or dependency change
    return () => {
      isMounted = false;
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          // Send unsubscribe message to avoid stale subscriptions
          let unsubMsg;
          switch (activeVenue) {
            case 'OKX':
              unsubMsg = { op: 'unsubscribe', args: [{ channel: 'books', instId: symbol }] };
              break;
            case 'BYBIT':
              unsubMsg = { op: 'unsubscribe', args: [`orderbook.50.${symbol}`] };
              break;
            case 'DERIBIT':
              unsubMsg = {
                jsonrpc: '2.0',
                method: 'public/unsubscribe',
                params: { channels: [`book.${symbol}.100ms`] },
              };
              break;
          }

          // Attempt to send unsubscribe message
          if (unsubMsg) {
            try {
              ws.send(JSON.stringify(unsubMsg));
            } catch (err) {
              console.warn('Failed to send unsubscribe:', err);
            }
          }
        }

        // Close WebSocket connection
        ws.close();
      }
    };
  }, [activeVenue, symbol]); // Dependencies to re-run effect on change

  // Handler for venue change (resets symbol too)
  const handleVenueChange = (venue: VenueKey) => {
    setActiveVenue(venue);
    setSymbol(SYMBOLS[venue][0]);
  };

  // Handler for symbol selection
  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  // Handler to simulate an order
  const handleSimulate = (order: SimulatedOrder) => {
    setSimulatedOrder(order);
  };

  // Handler to clear simulated order
  const handleClearSimulation = () => {
    setSimulatedOrder(null);
  };

  // UI rendering
  return (
    <div className="bg-gray-900 text-gray-200 font-sans min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header with status info */}
        <Header status={connectionStatus} activeVenue={activeVenue} symbol={symbol} />

        {/* Main layout with sidebar and main content */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left panel with controls and metrics */}
          <div className="lg:col-span-3 space-y-6">
            <ControlPanel
              activeVenue={activeVenue}
              onVenueChange={handleVenueChange}
              symbol={symbol}
              onSymbolChange={handleSymbolChange}
              onSimulate={handleSimulate}
              onClear={handleClearSimulation}
              orderbook={orderbook}
            />
            {/* Show metrics only if a simulated order is active */}
            {simulatedOrder && <MetricsPanel order={simulatedOrder} orderbook={orderbook} />}
          </div>

          {/* Right panel with orderbook and depth chart */}
          <div className="lg:col-span-9 space-y-6">
            <OrderbookDisplay orderbook={orderbook} simulatedOrder={simulatedOrder} />
            <DepthChart data={orderbook} />
          </div>
        </main>
      </div>
    </div>
  );
}
