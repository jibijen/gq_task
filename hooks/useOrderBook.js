import { useState, useEffect, useRef } from 'react';

// Define WebSocket URLs for each exchange
const WEBSOCKET_URLS = {
  OKX: 'wss://ws.okx.com:8443/ws/v5/public',
  BYBIT: 'wss://stream.bybit.com/v5/public/spot',
  DERIBIT: 'wss://www.deribit.com/ws/api/v2',
};

// Define symbol mappings for each exchange as they often differ
const SYMBOLS = {
  'BTC-USDT': { OKX: 'BTC-USDT', BYBIT: 'BTCUSDT', DERIBIT: 'BTC-PERPETUAL' },
  'ETH-USDT': { OKX: 'ETH-USDT', BYBIT: 'ETHUSDT', DERIBIT: 'ETH-PERPETUAL' },
};

/**
 * Custom React hook to fetch and manage real-time order book data
 * from multiple cryptocurrency exchanges (OKX, Bybit, Deribit).
 *
 * @param {string} symbol - The trading pair symbol (e.g., 'BTC-USDT', 'ETH-USDT').
 * @returns {object} An object containing order book data, connection status, and price history.
 */
export default function useOrderBook(symbol) {
  // State to store the order books for each exchange.
  // Each order book contains 'bids' (buy orders) and 'asks' (sell orders).
  const [orderBooks, setOrderBooks] = useState({
    OKX: { bids: [], asks: [] },
    BYBIT: { bids: [], asks: [] },
    DERIBIT: { bids: [], asks: [] }
  });

  // State to store the history of mid-prices for charting or analysis.
  const [priceHistory, setPriceHistory] = useState([]);

  // Ref to track the last time the price history was updated to control update frequency.
  const lastPriceUpdateRef = useRef(0);

  // Ref to store the raw order book data as Maps for efficient updates.
  // Using Maps allows for quick addition, deletion, and modification of price levels.
  const bookRefs = useRef({
    OKX: { bids: new Map(), asks: new Map() },
    BYBIT: { bids: new Map(), asks: new Map() },
    DERIBIT: { bids: new Map(), asks: new Map() }
  });

  // State to track the connection status for each exchange's WebSocket.
  const [connectionStatus, setConnectionStatus] = useState({
    OKX: 'Connecting...',
    BYBIT: 'Connecting...',
    DERIBIT: 'Connecting...'
  });

  // useEffect hook to manage WebSocket connections.
  // It runs once on component mount and whenever the 'symbol' changes.
  useEffect(() => {
    // Stores WebSocket instances for cleanup.
    const sockets = {};
    // Stores interval IDs for ping messages to keep connections alive.
    const intervals = {};
    // Get the specific symbol mapping for the current trading pair.
    const currentSymbols = SYMBOLS[symbol];

    // --- Reset state when the symbol changes ---
    setOrderBooks({ OKX: { bids: [], asks: [] }, BYBIT: { bids: [], asks: [] }, DERIBIT: { bids: [], asks: [] } });
    setPriceHistory([]);
    // Clear the internal Map-based order books for a fresh start.
    Object.values(bookRefs.current).forEach(book => { book.bids.clear(); book.asks.clear(); });
    // Set connection status back to 'Connecting...' for all exchanges.
    setConnectionStatus({ OKX: 'Connecting...', BYBIT: 'Connecting...', DERIBIT: 'Connecting...' });


    /**
     * Establishes a WebSocket connection to a specific exchange.
     * @param {string} exchange - The name of the exchange (e.g., 'OKX', 'BYBIT', 'DERIBIT').
     */
    const connect = (exchange) => {
      try {
        const ws = new WebSocket(WEBSOCKET_URLS[exchange]);
        sockets[exchange] = ws; // Store WebSocket instance

        // WebSocket 'onopen' event handler.
        ws.onopen = () => {
          setConnectionStatus(prev => ({ ...prev, [exchange]: 'Connected' })); // Update connection status
          let subMsg; // Subscription message specific to each exchange

          // Construct the subscription message and set up a ping interval.
          switch (exchange) {
            case 'OKX':
              subMsg = { op: 'subscribe', args: [{ channel: 'books', instId: currentSymbols.OKX }] };
              // OKX requires sending 'ping' messages to keep the connection alive.
              intervals.OKX = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send('ping');
              }, 25000); // Ping every 25 seconds
              break;

            case 'BYBIT':
              subMsg = { op: 'subscribe', args: [`orderbook.50.${currentSymbols.BYBIT}`] };
              // Bybit requires sending JSON ping messages.
              intervals.BYBIT = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: "ping" }));
              }, 20000); // Ping every 20 seconds
              break;

            case 'DERIBIT':
              subMsg = {
                jsonrpc: '2.0',
                method: 'public/subscribe',
                params: { channels: [`book.${currentSymbols.DERIBIT}.100ms`] }
              };
              // Deribit requires sending a specific test method as a keep-alive.
              intervals.DERIBIT = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ jsonrpc: '2.0', method: 'public/test', params: {} }));
              }, 30000); // Ping every 30 seconds
              break;
          }

          ws.send(JSON.stringify(subMsg)); // Send the subscription message
        };

        // WebSocket 'onmessage' event handler for incoming data.
        ws.onmessage = (event) => {
          let response;
          try {
            response = JSON.parse(event.data);
          } catch (err) {
            // Handle non-JSON messages (like 'pong' responses)
            if (event.data === 'pong') return;
            console.warn(`${exchange} non-JSON message:`, event.data);
            return;
          }

          // Filter out unwanted messages (errors, heartbeats, pongs)
          if (
            response.event === 'error' ||
            response.success === false ||
            response.method === 'heartbeat' ||
            (response.op && response.op === 'pong')
          ) return;

          const bookRef = bookRefs.current[exchange]; // Get the specific book reference for the exchange

          /**
           * Helper function to convert the Map-based order book data into a sorted array
           * and update the component's state. It also updates the price history.
           */
          const updateUI = () => {
            // Convert bids Map to array, parse values, filter out NaNs, and sort in descending order of price.
            const bids = Array.from(bookRef.bids.entries())
              .map(([p, s]) => ({ price: parseFloat(p), size: parseFloat(s) }))
              .filter(b => !isNaN(b.price) && !isNaN(b.size))
              .sort((a, b) => b.price - a.price);

            // Convert asks Map to array, parse values, filter out NaNs, and sort in ascending order of price.
            const asks = Array.from(bookRef.asks.entries())
              .map(([p, s]) => ({ price: parseFloat(p), size: parseFloat(s) }))
              .filter(a => !isNaN(a.price) && !isNaN(a.size))
              .sort((a, b) => a.price - b.price);

            // Update the React state for order books.
            setOrderBooks(prev => ({ ...prev, [exchange]: { bids, asks } }));

            // Update price history (mid-price) at a controlled frequency.
            const now = Date.now();
            if (bids[0] && asks[0] && now - lastPriceUpdateRef.current > 750) { // Update roughly every 750ms
              const midPrice = (bids[0].price + asks[0].price) / 2;
              setPriceHistory(prev => [...prev, { x: now, y: midPrice, exchange }].slice(-100)); // Keep last 100 data points
              lastPriceUpdateRef.current = now;
            }
          };

          // Process incoming messages based on the exchange.
          switch (exchange) {
            case 'OKX':
            case 'BYBIT': {
              if (response.data) {
                // Determine if the incoming message is a full snapshot or a delta update.
                const isSnapshot = response.action === 'snapshot' || response.type === 'snapshot';
                // Extract order book data based on exchange-specific structure.
                const bookData = exchange === 'OKX' ? response.data[0] : response.data;
                const bidsDelta = exchange === 'OKX' ? bookData.bids : bookData.b;
                const asksDelta = exchange === 'OKX' ? bookData.asks : bookData.a;

                if (isSnapshot) {
                  // For a snapshot, replace the entire order book.
                  bookRef.bids = new Map(bidsDelta);
                  bookRef.asks = new Map(asksDelta);
                } else {
                  // For delta updates, iterate and update bids/asks.
                  // If size is 0, delete the price level; otherwise, set/update it.
                  bidsDelta.forEach(([p, s]) => (parseFloat(s) === 0 ? bookRef.bids.delete(p) : bookRef.bids.set(p, s)));
                  asksDelta.forEach(([p, s]) => (parseFloat(s) === 0 ? bookRef.asks.delete(p) : bookRef.asks.set(p, s)));
                }

                updateUI(); // Update the UI after processing data.
              }
              break;
            }

            case 'DERIBIT': {
              if (response.params?.data) {
                const bookData = response.params.data;

                if (bookData.type === 'snapshot') {
                  // For a snapshot, clear existing data and populate with new.
                  bookRef.bids.clear();
                  bookRef.asks.clear();
                  bookData.bids.forEach(([p, s]) => bookRef.bids.set(p, s));
                  bookData.asks.forEach(([p, s]) => bookRef.asks.set(p, s));
                } else {
                  /**
                   * Helper for Deribit's delta updates, which can include 'delete', 'new', 'change' types.
                   * @param {Array} deltas - Array of price level changes.
                   * @param {Map} book - The specific bid or ask Map to update.
                   */
                  const updateBook = (deltas, book) => {
                    if (!Array.isArray(deltas)) return;
                    deltas.forEach(delta => {
                      if (!Array.isArray(delta) || delta.length !== 3) return;
                      const [type, price, size] = delta; // Deribit deltas have type, price, size
                      if (type === 'delete' || size === 0) book.delete(price);
                      else book.set(price, size);
                    });
                  };
                  updateBook(bookData.bids, bookRef.bids);
                  updateBook(bookData.asks, bookRef.asks);
                }

                updateUI(); // Update the UI after processing data.
              }
              break;
            }
          }
        };

        ws.onerror = (event) => {
  console.error(`${exchange} WebSocket error:`, {
    type: event?.type,
    message: event?.message || 'No message',
    event,  // this will help see the raw event object in the console
  });

  // Optional: you can also set a flag here or attempt reconnect logic
};



        // WebSocket 'onclose' event handler.
       ws.onclose = (event) => {
  console.warn(`${exchange} WebSocket closed`, {
    code: event.code,
    reason: event.reason || 'No reason provided',
    wasClean: event.wasClean,
  });
};


      } catch (error) {
        console.error(`Failed to connect to ${exchange}:`, error);
        setConnectionStatus(prev => ({ ...prev, [exchange]: 'Failed to Connect' }));
      }
    };

    // Initiate connections to all exchanges.
    connect('OKX');
    connect('BYBIT');
    connect('DERIBIT');

    // Cleanup function: This runs when the component unmounts or when the 'symbol' changes.
    return () => {
      // Close all active WebSocket connections.
      Object.values(sockets).forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      });
      // Clear all active ping intervals.
      Object.values(intervals).forEach(clearInterval);
    };
  }, [symbol]); // Dependency array: Re-run effect if 'symbol' changes.

  // Return the relevant state variables for the component to use.
  return { orderBooks, connectionStatus, priceHistory };
}