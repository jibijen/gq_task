# 🚀 Orderbook Simulator

A real-time, multi-venue cryptocurrency **Orderbook Viewer & Simulation Tool** built using **Next.js**. This tool enables users to visualize live orderbooks from OKX, Bybit, and Deribit, simulate order placement, and evaluate potential **market impact** and **execution slippage**.

---

## 🧠 Objective

Help traders better understand order placement timing and execution by simulating their orders in live orderbooks across multiple crypto exchanges.

---

## 🌐 Live API Integrations

The app integrates live WebSocket feeds from the following exchanges:

- **OKX** – [API Docs](https://www.okx.com/docs-v5/)
- **Bybit** – [API Docs](https://bybit-exchange.github.io/docs/v5/intro)
- **Deribit** – [API Docs](https://docs.deribit.com/)

Real-time updates are handled via WebSocket streams. Fallback mechanisms using HTTP polling are in place for robustness.

---

## 📦 Tech Stack

- **Next.js** (React-based framework)
- **WebSocket API** (real-time data)
- **Custom React Hooks** for state and data flow
- **Charting Libraries** (for market depth and price impact)
- **Tailwind CSS / Responsive UI** (assumed)

---

## 📁 Project Structure (Important Files)

<pre> ``` components/ │ ├── OrderBookClientView.js // Unified view per venue ├── OrderBookTable.js // Table representation ├── AddQuantityModal.js // Simulation Modals ├── SimulationForm.js // Order simulation form ├── DepthChart.js // Optional depth chart ├── OrderImbalanceIndicator.js // Imbalance metrics ├── OrdersPage.js // Main trading interface └── ... // Other supporting components hooks/ └── useOrderBook.js // WebSocket + rate limiting logic ``` </pre>

page.js // Entry point

---

## ✅ Features

### 📊 Multi-Venue Orderbook
- Live market data from OKX, Bybit, Deribit
- Real-time 15-level depth
- Toggle venues seamlessly

### 📝 Order Simulation
- Simulate Limit / Market orders
- Buy/Sell selection
- Adjustable quantity, price, and timing (0s, 5s, 10s, 30s)

### 📌 Impact Visualization
- Estimated fill %
- Market impact + slippage
- Order highlight in the book

### 📱 Responsive UI
- Mobile & desktop optimized
- Intuitive navigation

---

## 🧪 Assumptions Made

- The APIs used offer **free access** with limited rate limits.
- All symbols (e.g., BTC-USD) are supported uniformly across the 3 venues.
- WebSocket data is preferred where available; otherwise, polling fallback is used.
- Data consistency and latency tolerance is ±500ms for visualization.

---

## ⚙️ Handling Rate Limits

Implemented in `hooks/useOrderBook.js`:
- Uses exchange-specific limits (e.g., 10 req/sec for OKX)
- Fallback polling for failed WebSocket
- Throttling and exponential backoff on HTTP retries

---

## 📄 Instructions to Run Locally

```bash
git clone https://github.com/yourusername/goquant-orderbook-simulator.git
cd goquant-orderbook-simulator

# Install dependencies
npm install

# Run locally
npm run dev
