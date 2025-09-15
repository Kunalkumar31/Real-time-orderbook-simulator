# Real-Time Orderbook Viewer with Order Simulation

A **Next.js** application that visualizes real-time orderbooks from **OKX, Bybit, and Deribit** with **order simulation**, **metrics analysis**, and **depth chart visualization**. This project is designed for traders and developers to analyze market depth, simulate orders, and study trading behavior in real-time.

---

## Features

- 🌐 Real-time orderbook visualization for multiple venues
- ⚡ Order simulation with configurable:
  - Venue
  - Symbol
  - Order type (Market/Limit)
  - Side (Buy/Sell)
  - Price and Quantity
  - Timing
- 📊 Metrics panel displaying:
  - Fill percentage
  - Market impact
  - Slippage
  - Time to fill
- 📈 Depth chart with live updates
- 🔄 Multi-venue support: OKX, Bybit, Deribit
- 🛠 Built with **Next.js**, **TypeScript**, **Tailwind CSS**, and **WebSockets**

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, TypeScript  
- **Backend / Real-Time Data:** WebSockets, API integrations (OKX, Bybit, Deribit)  
- **Visualization:** Recharts / Custom depth charts  

---

## Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/Kunalkumar31/real-time-orderbook-simulator.git
