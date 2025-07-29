
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
