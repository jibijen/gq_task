# 🚀 Orderbook Simulator

A real-time, multi-venue cryptocurrency **Orderbook Viewer & Simulation Tool** built using **Next.js**. This tool enables users to visualize live orderbooks from OKX, Bybit, and Deribit, simulate order placement, and evaluate potential **market impact** and **execution slippage**.

---

## 🧠 Objective

Help traders better understand order placement timing and execution by simulating their orders in live orderbooks across multiple crypto exchanges.

---

---
## Video Demonstration
A complete video demonstration of the application's functionality and a code walkthrough can be found here:

---

## 🌐 Live API Integrations

The app integrates live WebSocket feeds from the following exchanges:

- **OKX** – [API Docs](https://www.okx.com/docs-v5/):-
   Provides real-time market data through WebSocket for order books, trades, tickers, etc.
   We subscribe to books and tickers channels for accurate bid-ask updates.
   Robust API with low-latency feed, used primarily for spot and futures markets.
- **Bybit** – [API Docs](https://bybit-exchange.github.io/docs/v5/intro):-
  Offers both public (market data) and private (user-specific) WebSocket endpoints.
  We use public WebSocket channels to stream order book depth, tickers, and trades.
  Suitable for derivatives as well as spot trading scenarios.
- **Deribit** – [API Docs](https://docs.deribit.com/):-
  Specialized in options and futures trading on crypto assets.
  Provides detailed and granular data over WebSocket (e.g., Greeks, volatility, etc.).
  We connect to their book and trades streams to track real-time price movement.

Real-time updates are handled via WebSocket streams. Fallback mechanisms using HTTP polling are in place for robustness.

---

## 📦 Tech Stack

- **Next.js** (React-based framework)
- **WebSocket API** (real-time data)
- **Custom React Hooks** for state and data flow
- **Charting Libraries**(chart.js) (for market depth and price impact)
- **Tailwind CSS / Responsive UI**
- **UUID**(For generating unique IDs for simulated orders.)
---

## 📁 Project Structure (Important Files)

```
components/ 
├── OrderBookClientView.js // Unified view per venue 
├── OrderBookTable.js // Table representation
├── AddQuantityModal.js // Simulation Modals
├── SimulationForm.js // Order simulation form
├── DepthChart.js // Optional depth chart
├── OrderImbalanceIndicator.js // Imbalance metrics
├── OrdersPage.js // Main trading interface
└── ... // Other supporting components hooks/
└── useOrderBook.js // WebSocket + rate limiting logic ```

page.js // Entry point
```

---

## ✅ Features

## Core Features:
• Multi-Venue Connectivity: Real-time order book data streaming from OKX, Bybit, and Deribit via persistent WebSocket connections.
• Multi-Asset Support: Seamlessly switch between BTC-USDT and ETH-USDT order books.
• Live Data Visualization:
   - Interactive Depth Chart: A professional, line-based depth chart to visualize market liquidity and "walls".
   - Live Price Trend Chart: A simple line chart showing the real-time movement of the mid-price.
   - Order Book Table: Displays 15+ levels of bids and asks, updating in real-time.

• Professional Trading Workflow:
   - Order Placement: Place Market and Limit orders.
   - Position Management: Open positions are tracked, allowing for actions like adding quantity or setting a Stop Loss.
   - Live P&L: Open positions display a live, unrealized Profit and Loss based on the current market price.
   - Complete Order Lifecycle: Full simulation of Pending, Filled (Position), Cancelled, and Closed states.
   - Stop Loss Orders: Ability to add Stop Loss Market or Stop Loss Limit orders to open positions.

## " UX Features:
• Slippage Warning: A pre-trade warning pop-up alerts the user if a large order is likely to cause significant slippage.

• Position Averaging: Placing a new order in the same direction as an existing position correctly averages the entry price and updates the total quantity.

• Click-to-Fill: Clicking any price in the order book table instantly populates the price field in the order form.

• Live Analytics: Real-time Market Spread and Order Book Imbalance indicators provide deeper market insights.

• Intuitive Navigation: A clean, single-page application (SPA) design with a "multi-page" feel for a seamless user experience without losing WebSocket connections.


---

## 🧪 Assumptions Made

• Spot Market Simulation: The application simulates a spot market. Therefore, placing a SELL order without having a corresponding BUY position is not permitted and will fail, mimicking real-world spot trading      rules.

• Average Costing: When adding quantity to an existing position, the entry price is averaged. This is a common and robust method for position management. A more advanced implementation could use FIFO costing.

• Data Persistence: Simulated orders and user settings (like the last selected exchange) are stored in the browser's localStorage. This means the state will persist on page refresh but is local to the user's       browser.

---

## ⚙️ Handling Rate Limits

• Since we are using public WebSocket streams, we are generally not subject to the same strict request-based rate limits as REST APIs. However, to maintain stable connections and act as a good API citizen, the     following measures are in place:

• Persistent Connections: The app establishes a single, persistent WebSocket connection per exchange, avoiding the overhead and limits of frequent HTTP requests.

• Heartbeats/Pings: For Bybit and Deribit, periodic "ping" or "test" messages are sent (every 20-30 seconds) to keep the connection alive, as required by their documentation. This prevents the connections from     being terminated due to inactivity.

Implemented in `hooks/useOrderBook.js`:

• Real-time orderbook data is fetched using native WebSocket connections for OKX, Bybit, and Deribit.

• Exchange-specific ping requirements are implemented to keep connections alive and comply with rate limits:
  - OKX: ping every 25s
  - Bybit: JSON ping every 20s
  - Deribit: public/test ping every 30s
    
• Reconnect logic exists on connection failure, with proper cleanup on unmount.

---

## 📄 Instructions to Run Locally

```bash
git clone https://github.com/jibijen/gq_task.git
cd gq_task

# Install dependencies
npm install

# Run locally
npm run dev

# View the application:
Open your web browser and navigate to http://localhost:3000.
