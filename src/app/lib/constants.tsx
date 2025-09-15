// lib/constants.ts

export const VENUES = {
  OKX: 'OKX',
  BYBIT: 'BYBIT',
  DERIBIT: 'DERIBIT',
};


export type VenueKey = keyof typeof VENUES;

export const SYMBOLS = {
  [VENUES.OKX]: ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'],
  [VENUES.BYBIT]: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  [VENUES.DERIBIT]: ['BTC-PERPETUAL', 'ETH-PERPETUAL', 'SOL-PERPETUAL'],
};

export const WEBSOCKET_URLS = {
  OKX: "wss://ws.okx.com:8443/ws/v5/public",
  BYBIT: "wss://stream.bybit.com/v5/public/spot", 
  DERIBIT: "wss://www.deribit.com/ws/api/v2",
};


export const MAX_LEVELS = 15;


// lib/constants.ts
export interface SimulatedOrder {
  orderType: "Limit" | "Market";
  side: "Buy" | "Sell";
  price: number;
  quantity: number;
  delay: string;
}

export type Order = {
  price: number;
  size: number;
  isSimulated?: boolean; 
};

export type Orderbook = {
  bids: Order[];
  asks: Order[];
};

