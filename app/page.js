// app/page.js
// This is the main application file, acting as the central controller for the trading simulation platform.
// It manages global state, handles data flow between components, and orchestrates order execution logic.

"use client"; // Marks this component as a Client Component in Next.js, enabling interactivity.

import { useState, useMemo, useEffect, useCallback } from 'react'; // React hooks for state, memoization, side effects, and memoized callbacks.
import { v4 as uuidv4 } from 'uuid'; // Library to generate unique IDs for orders.

// Custom hooks and components used in the application.
import useOrderBook from '../hooks/useOrderBook'; // Custom hook to fetch real-time order book data from exchanges.
import OrderBookTable from '../components/OrderBookTable'; // Component to display the order book (bids and asks).
import DepthChart from '../components/DepthChart'; // Component to visualize market depth.
import PriceChart from '../components/PriceChart'; // Component to display historical price trends.
import SimulationForm from '../components/SimulationForm'; // Form for users to input and simulate orders.
import OrderImbalanceIndicator from '../components/OrderImbalanceIndicator'; // Component to show bid/ask imbalance.
import OrdersPage from '../components/OrdersPage'; // Page to display simulated orders and positions.
import ConfirmationModal from '../components/ConfirmationModal'; // Generic modal for user confirmation.
import AddStopLossModal from '../components/AddStopLossModal'; // Modal for adding stop-loss orders.
import SlippageWarningModal from '../components/SlippageWarningModal'; // Modal to warn about high slippage.
import AddQuantityModal from '../components/AddQuantityModal'; // Modal for adding quantity to an existing position.
import Navbar from '../components/Navbar'; // Navigation bar component.
import Footer from '../components/Footer'; // Footer component.
import MessageModal from '../components/MessageModal'; // Generic modal for displaying messages/errors.

// --- Constants for application configuration ---
const EXCHANGES = ['OKX', 'BYBIT', 'DERIBIT']; // List of supported cryptocurrency exchanges.
const SYMBOLS = ['BTC-USDT', 'ETH-USDT']; // List of supported trading pairs.

// Defines different timing scenarios for order execution simulation,
// including a delay in milliseconds and a factor for increased slippage.
const TIMING_SCENARIOS = [
    { label: 'Immediate (Best)', delayInMs: 0, delayFactor: 0 },
    { label: '5s Delay', delayInMs: 5000, delayFactor: 0.05 }, // 5-second delay, 5% additional slippage factor
    { label: '10s Delay', delayInMs: 10000, delayFactor: 0.10 }, // 10-second delay, 10% additional slippage factor
    { label: '30s Delay', delayInMs: 30000, delayFactor: 0.25 }, // 30-second delay, 25% additional slippage factor
];

/**
 * Calculates the market impact of a simulated order against a given order book.
 * This function determines the average fill price, slippage, filled percentage, and price impact.
 *
 * @param {object} orderParams - Parameters of the order (side, quantity, orderType, price, venue).
 * @param {object} book - The current order book for the selected exchange ({ bids: [], asks: [] }).
 * @returns {object} An object containing avgFillPrice, slippage, filledPercentage, and priceImpact.
 */
const calculateMarketImpact = (orderParams, book) => {
    const { side, quantity, orderType, price, venue } = orderParams;
    const orderSize = parseFloat(quantity);

    // Return zero impact if quantity is invalid.
    if (isNaN(orderSize) || orderSize <= 0) return { avgFillPrice: 0, slippage: 0, filledPercentage: 0, priceImpact: 0 };

    let sizeToFill = orderSize; // Remaining quantity to fill.
    let totalCost = 0; // Total cost of the filled portion.
    let filledSize = 0; // Total quantity filled.
    // Select the relevant side of the order book (asks for buy orders, bids for sell orders).
    const relevantBook = side === 'Buy' ? book.asks : book.bids;

    // Return zero impact if the relevant order book is empty or invalid.
    if (!relevantBook || relevantBook.length === 0) return { avgFillPrice: 0, slippage: 0, filledPercentage: 0, priceImpact: 0 };

    // Get the best available price (lowest ask for buy, highest bid for sell).
    const bestPrice = side === 'Buy' ? parseFloat(book.asks[0]?.price) : parseFloat(book.bids[0]?.price);

    // Return zero impact if best price is invalid.
    if (isNaN(bestPrice) || bestPrice <= 0) return { avgFillPrice: 0, slippage: 0, filledPercentage: 0, priceImpact: 0 };

    // Iterate through the order book levels to simulate filling the order.
    for (const level of relevantBook) {
        if (sizeToFill <= 0) break; // Stop if the order is fully filled.

        const levelPrice = parseFloat(level.price);
        // Deribit's size is often in terms of USD value, so convert to base currency quantity.
        const levelSizeInBase = venue === 'DERIBIT' ? parseFloat(level.size) / levelPrice : parseFloat(level.size);

        if (isNaN(levelPrice) || isNaN(levelSizeInBase)) continue; // Skip invalid levels.

        // For Limit orders, ensure the price is within the specified limit.
        if (side === 'Buy' && orderType.includes('Limit') && levelPrice > parseFloat(price)) continue;
        if (side === 'Sell' && orderType.includes('Limit') && levelPrice < parseFloat(price)) continue;

        // Determine how much can be filled at the current level.
        const fillableSize = Math.min(sizeToFill, levelSizeInBase);
        totalCost += fillableSize * levelPrice; // Add to total cost.
        filledSize += fillableSize; // Add to filled quantity.
        sizeToFill -= fillableSize; // Decrease remaining quantity.
    }

    // If nothing was filled, return zero impact.
    if (filledSize === 0) return { avgFillPrice: 0, slippage: 0, filledPercentage: 0, priceImpact: 0 };

    const avgFillPrice = totalCost / filledSize; // Calculate average fill price.
    // Calculate slippage as a percentage of the best price.
    const slippage = Math.abs((avgFillPrice - bestPrice) / bestPrice) * 100;
    // Calculate the percentage of the original order size that was filled.
    const filledPercentage = (filledSize / orderSize) * 100;
    // Calculate the absolute difference between average fill price and best price.
    const priceImpact = Math.abs(avgFillPrice - bestPrice);

    return { avgFillPrice, slippage, filledPercentage, priceImpact };
};

/**
 * HomePageContent is a presentational component responsible for rendering the main trading interface.
 * It receives data and handlers as props from the PageController.
 */
const HomePageContent = ({ pageData, handlers }) => {
    // Destructure data and handlers for easier access.
    const { orderBooks, connectionStatus, priceHistory, selectedExchange, activeChart, simulatedOrders, clickedPrice, symbol } = pageData;
    const { setSelectedExchange, setActiveChart, handleRowClick, handleSimulate, setPage, setSymbol, handleCompare } = handlers;

    // Get the current order book for the selected exchange.
    const currentBook = orderBooks[selectedExchange];

    // Memoized data for the Depth Chart.
    // Recalculates only when currentBook changes.
    const depthChartData = useMemo(() => {
        if (!currentBook || currentBook.bids.length === 0) return { datasets: [] };
        let cumulativeBidsSize = 0;
        // Process bids: reverse to start from lowest price, accumulate size.
        const bidsData = currentBook.bids.slice(0, 50).reverse().map(b => ({ x: b.price, y: cumulativeBidsSize += b.size }));
        let cumulativeAsksSize = 0;
        // Process asks: accumulate size.
        const asksData = currentBook.asks.slice(0, 50).map(a => ({ x: a.price, y: cumulativeAsksSize += a.size }));
        return {
            datasets: [
                { label: 'Bids', data: bidsData, borderColor: 'rgba(16, 185, 129, 1)', backgroundColor: 'rgba(16, 185, 129, 0.2)', fill: true, stepped: true },
                { label: 'Asks', data: asksData, borderColor: 'rgba(244, 63, 94, 1)', backgroundColor: 'rgba(244, 63, 94, 0.2)', fill: true, stepped: true }
            ]
        };
    }, [currentBook]);

    // Memoized data for the Price Trend Chart.
    // Filters price history to show only data for the currently selected exchange.
    const priceChartData = useMemo(() => priceHistory.filter(p => p.exchange === selectedExchange), [priceHistory, selectedExchange]);

    // Memoized data for Order Imbalance Indicator.
    // Calculates the ratio of total bid size to total combined bid/ask size.
    const imbalanceData = useMemo(() => {
        if (!currentBook || !currentBook.bids.length) return null;
        const totalBidSize = currentBook.bids.reduce((s, b) => s + b.size, 0);
        const totalAskSize = currentBook.asks.reduce((s, a) => s + a.size, 0);
        if (totalBidSize + totalAskSize === 0) return null;
        return { ratio: totalBidSize / (totalBidSize + totalAskSize), totalBidSize, totalAskSize };
    }, [currentBook]);

    // Finds the price of a pending limit order to display on the depth chart.
    const pendingOrderPrice = simulatedOrders.find(o => o.status === 'Pending' && o.params.orderType === 'Limit')?.params.price;

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                {/* Exchange selection buttons */}
                <div className="flex bg-gray-800 p-2 rounded-lg shadow-md max-w-xs">
                    {EXCHANGES.map(exchange => (
                        <button
                            key={exchange}
                            onClick={() => setSelectedExchange(exchange)}
                            className={`w-full px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 ${selectedExchange === exchange ? 'bg-cyan-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            {exchange}
                        </button>
                    ))}
                </div>
                {/* Button to navigate to the Orders & Positions page */}
                <button
                    onClick={() => setPage('orders')}
                    className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors"
                >
                    View Orders & Positions ({simulatedOrders.filter(o => o.status === 'Filled' && !o.pnl).length})
                </button>
            </div>
            <main className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Chart Section */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    {/* Chart type selection buttons */}
                    <div className="flex justify-center bg-gray-700 p-1 rounded-lg">
                        <button onClick={() => setActiveChart('depth')} className={`w-full py-2 rounded-md font-semibold transition ${activeChart === 'depth' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>Depth Chart</button>
                        <button onClick={() => setActiveChart('price')} className={`w-full py-2 rounded-md font-semibold transition ${activeChart === 'price' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>Price Trend</button>
                    </div>
                    {/* Conditional rendering of Depth Chart or Price Chart, or a loading message */}
                    {connectionStatus[selectedExchange] === 'Connected' && currentBook && currentBook.bids.length > 0 ? (
                        activeChart === 'depth' ? (
                            <DepthChart data={depthChartData} simulatedPrice={pendingOrderPrice} />
                        ) : (
                            <PriceChart data={priceChartData} />
                        )
                    ) : (
                        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center w-full h-[400px] md:h-[500px] flex justify-center items-center">
                            <p>Waiting for chart data for {symbol}...</p>
                        </div>
                    )}
                    {/* Order Imbalance Indicator */}
                    <OrderImbalanceIndicator imbalanceData={imbalanceData} />
                </div>
                {/* Order Book Table Section */}
                <div className="xl:col-span-4">
                    {/* Conditional rendering of OrderBookTable or a loading message */}
                    {connectionStatus[selectedExchange] === 'Connected' && currentBook && currentBook.bids.length > 0 ? (
                        <OrderBookTable bids={currentBook.bids} asks={currentBook.asks} onRowClick={handleRowClick} />
                    ) : (
                        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center w-full h-full flex justify-center items-center">
                            <p>Waiting for table data for {symbol}...</p>
                        </div>
                    )}
                </div>
                {/* Simulation Form Section */}
                <div className="xl:col-span-3">
                    <SimulationForm
                        selectedExchange={selectedExchange}
                        symbol={symbol}
                        setSymbol={setSymbol}
                        onSimulate={handleSimulate}
                        onCompare={handleCompare}
                        clickedPrice={clickedPrice}
                        currentBook={currentBook}
                        calculateMarketImpact={calculateMarketImpact}
                    />
                </div>
            </main>
        </div>
    );
};

/**
 * PageController is the main functional component that manages the application's state and logic.
 * It orchestrates data fetching, order simulation, and interaction with various UI components.
 */
export default function PageController() {
    // State to track if the component is mounted on the client-side (for localStorage access).
    const [isClient, setIsClient] = useState(false);
    // State to control which page is currently displayed ('home' or 'orders').
    const [page, setPage] = useState('home');
    // State for the currently selected exchange.
    const [selectedExchange, setSelectedExchange] = useState(EXCHANGES[0]);
    // State for the currently selected trading symbol.
    const [symbol, setSymbol] = useState(SYMBOLS[0]);

    // Callback for handling WebSocket errors, memoized to prevent unnecessary re-creations.
    const handleWebSocketError = useCallback((title, message) => { setMessageModal({ title, message }); }, []);
    // Custom hook to get real-time order book data, connection status, and price history.
    const { orderBooks, connectionStatus, priceHistory } = useOrderBook(symbol, handleWebSocketError);

    // State for the active chart type ('depth' or 'price').
    const [activeChart, setActiveChart] = useState('depth');
    // State to store the price clicked in the order book table.
    const [clickedPrice, setClickedPrice] = useState(null);
    // State to store all simulated orders (pending, filled, cancelled, untriggered).
    const [simulatedOrders, setSimulatedOrders] = useState([]);
    // State to hold the ID of the order to be cancelled (for confirmation modal).
    const [orderToCancel, setOrderToCancel] = useState(null);
    // State to hold the order for which a stop-loss is being added.
    const [orderForSl, setOrderForSl] = useState(null);
    // State to hold the order for which quantity is being added.
    const [orderForQty, setOrderForQty] = useState(null);
    // State to trigger and pass data to the slippage warning modal.
    const [slippageWarning, setSlippageWarning] = useState(null);
    // State to trigger and pass data to a generic message modal.
    const [messageModal, setMessageModal] = useState(null);
    // State to store the results of the comparison simulation.
    const [comparisonResult, setComparisonResult] = useState(null);

    // useEffect hook to run once on component mount to set `isClient` and load orders from localStorage.
    useEffect(() => {
        setIsClient(true); // Indicate that the component is mounted on the client.
        try {
            const storedOrders = localStorage.getItem('simulatedOrders');
            if (storedOrders) {
                // Parse stored orders and convert date strings back to Date objects.
                const loadedOrders = JSON.parse(storedOrders).map(order => {
                    if (typeof order.createdAt === 'string') order.createdAt = new Date(order.createdAt);
                    if (order.result && typeof order.result.executedAt === 'string') order.result.executedAt = new Date(order.result.executedAt);
                    if (order.exitResult && typeof order.exitResult.executedAt === 'string') order.exitResult.executedAt = new Date(order.exitResult.executedAt);
                    return order;
                });
                setSimulatedOrders(loadedOrders);
            }
        } catch (error) {
            console.error("Failed to load orders from Local Storage:", error);
            // Optionally, clear corrupted data or show an error message to the user.
        }
    }, []); // Empty dependency array means this runs only once on mount.

    // useEffect hook to persist `simulatedOrders` to localStorage whenever they change.
    useEffect(() => {
        if (isClient) { // Only attempt to access localStorage if on the client-side.
            localStorage.setItem('simulatedOrders', JSON.stringify(simulatedOrders));
        }
    }, [simulatedOrders, isClient]); // Dependencies: `simulatedOrders` and `isClient`.

    // Memoized callback to calculate Profit and Loss (PnL) for a given order.
    const calculatePnl = useCallback((order, currentPrice) => {
        if (!order?.result?.avgFillPrice || !currentPrice) return 0;
        const entryPrice = order.result.avgFillPrice;
        const quantity = parseFloat(order.params.quantity);
        // PnL calculation depends on the side of the order.
        return order.params.side === 'Buy' ? (currentPrice - entryPrice) * quantity : (entryPrice - currentPrice) * quantity;
    }, []); // No dependencies, as it only uses its arguments.

    // --- REVISED AND CORRECTED USEEFFECT FOR ORDER EXECUTION AND PNL UPDATES ---
    // This useEffect continuously monitors the order book and simulated orders
    // to trigger executions, update PnL, and manage order statuses.
    useEffect(() => {
        const currentBook = orderBooks[selectedExchange]; // Get the order book for the currently selected exchange.
        const bestBid = currentBook?.bids[0]?.price;
        const bestAsk = currentBook?.asks[0]?.price;
        // Calculate the mid-price (average of best bid and best ask).
        const midPrice = bestBid && bestAsk ? (parseFloat(bestBid) + parseFloat(bestAsk)) / 2 : null;

        // If no valid mid-price or best bid/ask, return early as market data is not ready.
        if (!midPrice || !bestBid || !bestAsk) return;

        let ordersHaveChanged = false; // Flag to track if any order status or PnL has been updated.
        let updatedOrders = [...simulatedOrders]; // Create a mutable copy of orders to work with.

        /**
         * Executes a triggered order (Limit order fill or Stop Loss trigger) against the current book.
         * @param {object} orderToExecute - The order object to be executed.
         * @param {object} book - The current order book.
         * @returns {boolean} True if execution was successful and order was filled, false otherwise.
         */
        const executeTriggeredOrder = (orderToExecute, book) => {
            // For untriggered orders (like stop-loss), they are executed as Market orders.
            const executionParams = orderToExecute.status === 'Untriggered'
                ? { ...orderToExecute.params, orderType: 'Market' }
                : orderToExecute.params;

            // Calculate market impact for the execution.
            const result = calculateMarketImpact(executionParams, book);
            if (result.filledPercentage <= 0) return false; // If not filled, return false.

            if (orderToExecute.status === 'Untriggered') {
                // If it's an untriggered (stop-loss) order, find its corresponding position.
                const originalPositionIndex = updatedOrders.findIndex(p => p.id === orderToExecute.positionId);
                if (originalPositionIndex !== -1) {
                    const originalPosition = updatedOrders[originalPositionIndex];
                    // Calculate PnL for the closed position.
                    const pnl = calculatePnl(originalPosition, result.avgFillPrice);
                    const finalExitResult = { ...result, executedAt: new Date() };
                    // Update the original position with PnL and exit details.
                    updatedOrders[originalPositionIndex] = { ...originalPosition, pnl, exitResult: finalExitResult };
                }
                // Remove the untriggered stop-loss order itself from the list.
                updatedOrders = updatedOrders.filter(o => o.id !== orderToExecute.id);
            } else {
                // For a pending limit order being filled.
                const orderIndex = updatedOrders.findIndex(o => o.id === orderToExecute.id);
                if (orderIndex !== -1) {
                    // Update the order status to 'Filled' and record execution details.
                    updatedOrders[orderIndex] = {
                        ...updatedOrders[orderIndex],
                        status: 'Filled',
                        result: { ...result, executedAt: new Date() },
                        timeToFill: (new Date() - new Date(orderToExecute.createdAt)) / 1000 // Calculate time to fill in seconds.
                    };
                }
            }
            return true; // Indicate successful execution.
        };

        // Filter orders that need processing: Pending (limit orders), Untriggered (stop-loss),
        // or Filled orders that need PnL updates.
        const ordersToProcess = updatedOrders.filter(o =>
            o.status === 'Pending' ||
            o.status === 'Untriggered' ||
            (o.status === 'Filled' && !o.pnl) // Only update PnL for positions that are still open.
        );

        ordersToProcess.forEach(order => {
            // If the order's symbol doesn't match the current selected symbol,
            // reset its live PnL to 0 if it had any, as it's not relevant to the current view.
            if (order.params.symbol !== symbol) {
                if (order.livePnl) {
                    const orderIndex = updatedOrders.findIndex(o => o.id === order.id);
                    if (orderIndex !== -1) {
                       updatedOrders[orderIndex].livePnl = 0;
                       ordersHaveChanged = true;
                    }
                }
                return; // Skip further processing for this order.
            }

            // Update live PnL for currently open (filled but not closed) positions.
            if (order.status === 'Filled' && !order.pnl) {
                const newLivePnl = calculatePnl(order, midPrice);
                // Only update if PnL has actually changed to avoid unnecessary re-renders.
                if (order.livePnl !== newLivePnl) {
                    const orderIndex = updatedOrders.findIndex(o => o.id === order.id);
                    if (orderIndex !== -1) {
                        updatedOrders[orderIndex].livePnl = newLivePnl;
                        ordersHaveChanged = true;
                    }
                }
            }

            let conditionMet = false; // Flag to check if an order's execution condition is met.
            if (order.status === 'Pending' && order.params.orderType === 'Limit') {
                // Check if a pending Limit order can be filled.
                const limitPrice = parseFloat(order.params.price);
                if (
                    (order.params.side === 'Buy' && limitPrice >= parseFloat(bestAsk)) || // Buy limit order fills if limit price is at or above best ask.
                    (order.params.side === 'Sell' && limitPrice <= parseFloat(bestBid))   // Sell limit order fills if limit price is at or below best bid.
                ) {
                    conditionMet = true;
                }
            } else if (order.status === 'Untriggered') {
                // Check if an untriggered order (like a stop-loss) should be triggered.
                const stopPrice = parseFloat(order.stopLoss.stopPrice);
                if (
                    (order.params.side === 'Sell' && midPrice <= stopPrice) || // Sell stop-loss triggers if mid-price falls to or below stop price.
                    (order.params.side === 'Buy' && midPrice >= stopPrice)    // Buy stop-loss triggers if mid-price rises to or above stop price.
                ) {
                    conditionMet = true;
                }
            }

            // If an order's condition is met, attempt to execute it.
            if (conditionMet) {
                const executionSuccessful = executeTriggeredOrder(order, currentBook);
                if (executionSuccessful) {
                    ordersHaveChanged = true; // Set flag if an order was successfully executed.
                }
            }
        });

        // If any order changes occurred during this cycle, update the state.
        if (ordersHaveChanged) {
            setSimulatedOrders(updatedOrders);
        }

    }, [symbol, orderBooks, simulatedOrders, selectedExchange, calculatePnl]); // STABLE DEPENDENCY ARRAY
    // Dependencies:
    // - `symbol`: Changes when the user selects a different trading pair.
    // - `orderBooks`: Updates frequently with new market data.
    // - `simulatedOrders`: Changes when new orders are placed, cancelled, or filled.
    // - `selectedExchange`: Changes when the user switches exchanges.
    // - `calculatePnl`: This is a memoized callback, so it's stable unless its own dependencies change.
    // This array ensures the effect re-runs only when necessary to process new market data or order state changes.
    // --- END OF REVISED CODE ---

    // Handler for clicking a row in the order book table, sets the clicked price in the simulation form.
    const handleRowClick = (price) => setClickedPrice(price.toString());

    // The NEW, corrected function with slippage threshold logic.
    /**
     * Handles the simulation of a new order.
     * It first calculates the potential market impact and checks for high slippage.
     * If slippage is above a threshold, a warning modal is shown; otherwise, the order is scheduled for execution.
     * @param {object} params - Parameters of the order to simulate.
     */
    const handleSimulate = (params) => {
        // 1. Get the current order book for the selected venue.
        const executionBook = orderBooks[params.venue];

        // Check if the book data is available before proceeding.
        if (!executionBook?.bids.length > 0 || !executionBook?.asks.length > 0) {
            setMessageModal({ title: "Simulation Error", message: "Market data is not available to calculate impact." });
            return;
        }

        // 2. Calculate the potential market impact BEFORE placing the order.
        const impact = calculateMarketImpact(params, executionBook);

        // 3. Define your slippage threshold (e.g., 1.0% or 0.01 as a decimal).
        const SLIPPAGE_THRESHOLD = 0.01; // Example: 1% slippage.

        // Determine the delay for order execution based on the selected timing scenario.
        const delayInMs = parseInt(params.timing, 10) || 0;

        // 4. Check if the calculated slippage exceeds your threshold.
        if (impact.slippage > SLIPPAGE_THRESHOLD) {
            // If slippage is high, set the state to show the warning modal.
            // Pass all necessary info so the modal's "Confirm" button can work.
            setSlippageWarning({
                slippage: impact.slippage,
                priceImpact: impact.priceImpact,
                params: params,
                delayInMs: delayInMs
            });
        } else {
            // If slippage is acceptable, execute the order directly as before.
            scheduleOrderExecution(params, delayInMs);
        }
    };

    /**
     * Schedules the actual execution of an order after a specified delay.
     * This function updates the order's status and calculates the final fill details.
     * @param {object} params - Parameters of the order to execute.
     * @param {number} delayInMs - The delay in milliseconds before execution.
     */
    const scheduleOrderExecution = (params, delayInMs) => {
        // Create a new order object with a unique ID and initial 'Pending' status.
        const newOrder = { id: uuidv4(), params, status: 'Pending', createdAt: new Date(), result: null };
        setSimulatedOrders(prev => [newOrder, ...prev]); // Add the new order to the list.
        setPage('orders'); // Navigate to the orders page.

        // Set a timeout for delayed execution.
        setTimeout(() => {
            setSimulatedOrders(prevOrders => {
                // Find the order to execute by its ID.
                const orderToExecute = prevOrders.find(o => o.id === newOrder.id);
                // If the order is not found or its status is no longer 'Pending' (e.g., cancelled), return previous state.
                if (!orderToExecute || orderToExecute.status !== 'Pending') return prevOrders;

                // Get the current order book for the order's venue.
                const executionBook = orderBooks[params.venue];
                // If market data is unavailable at the time of execution, mark the order as 'Failed'.
                if (!executionBook?.bids.length > 0 || !executionBook?.asks.length > 0) {
                    return prevOrders.map(o => o.id === newOrder.id ? { ...o, status: 'Failed', result: { error: 'Market data unavailable.' } } : o);
                }

                // Calculate the market impact at the time of execution.
                const result = calculateMarketImpact(params, executionBook);

                if (result.filledPercentage > 0) {
                    const executedAt = new Date();
                    const timeToFill = (executedAt - new Date(newOrder.createdAt)) / 1000; // Time from creation to fill.

                    // Check if there's an existing open position for the same symbol, side, and venue.
                    const existingPosition = prevOrders.find(o =>
                        o.status === 'Filled' && !o.pnl && // Must be a filled position that hasn't been closed.
                        o.params.symbol === params.symbol &&
                        o.params.side === params.side &&
                        o.params.venue === params.venue
                    );

                    if (existingPosition) {
                        // If an existing position is found, average the prices and combine quantities.
                        const oldTotalCost = existingPosition.result.avgFillPrice * parseFloat(existingPosition.params.quantity);
                        const newTotalCost = result.avgFillPrice * parseFloat(params.quantity);
                        const totalQuantity = parseFloat(existingPosition.params.quantity) + parseFloat(params.quantity);
                        const newAvgPrice = (oldTotalCost + newTotalCost) / totalQuantity;

                        // Update the existing position and remove the new (now combined) order.
                        return prevOrders.map(o => {
                            if (o.id === existingPosition.id) {
                                return { ...o, params: { ...o.params, quantity: totalQuantity }, result: { ...o.result, avgFillPrice: newAvgPrice } };
                            }
                            return o;
                        }).filter(o => o.id !== newOrder.id); // Remove the newly added order as it's merged.
                    } else {
                        // If no existing position, simply mark the new order as 'Filled'.
                        return prevOrders.map(o => o.id === newOrder.id ? { ...o, status: 'Filled', result: { ...result, executedAt }, timeToFill } : o);
                    }
                } else {
                    // If the order could not be filled (e.g., insufficient liquidity for market order).
                    if (params.orderType === 'Market') {
                        return prevOrders.map(o => o.id === newOrder.id ? { ...o, status: 'Failed', result: { error: 'Market order could not be filled.' } } : o);
                    }
                    // For limit orders that couldn't be filled, they remain 'Pending' until conditions are met.
                    return prevOrders;
                }
            });
        }, delayInMs);
    };

    /**
     * Confirms and cancels a pending order.
     */
    const confirmCancelOrder = () => {
        if (!orderToCancel) return; // Ensure there's an order selected for cancellation.
        setSimulatedOrders(p => p.map(o => o.id === orderToCancel ? { ...o, status: 'Cancelled' } : o));
        setOrderToCancel(null); // Clear the order to cancel state.
    };

    /**
     * Handles closing an open position (a filled order without PnL).
     * It simulates a market order in the opposite direction.
     * @param {string} orderId - The ID of the position to close.
     */
    const handleClosePosition = (orderId) => {
        const orderToClose = simulatedOrders.find(o => o.id === orderId);
        if (!orderToClose) return;

        // Determine the opposite side for closing the position.
        const closeSide = orderToClose.params.side === 'Buy' ? 'Sell' : 'Buy';
        // Create parameters for the closing market order.
        const closeParams = { ...orderToClose.params, side: closeSide, orderType: 'Market' };
        const book = orderBooks[orderToClose.params.venue]; // Get the order book for the relevant venue.

        if (book?.bids.length > 0 && book?.asks.length > 0) {
            // Calculate the market impact of the closing order.
            const closeResult = calculateMarketImpact(closeParams, book);
            // Calculate the final PnL for the position.
            const pnl = calculatePnl(orderToClose, closeResult.avgFillPrice);
            const finalExitResult = { ...closeResult, executedAt: new Date() };

            // Update the simulated orders:
            // 1. Mark the original position with its final PnL and exit details.
            // 2. Filter out any untriggered stop-loss orders associated with this closed position.
            setSimulatedOrders(p => p.map(o => o.id === orderId ? { ...o, pnl, exitResult: finalExitResult } : o).filter(sl => sl.positionId !== orderId));
        } else {
            setMessageModal({ title: "Error Closing Position", message: "Order book not available for closing." });
        }
    };

    /**
     * Handles adding a stop-loss order to an existing position.
     * @param {string} positionId - The ID of the position to attach the stop-loss to.
     * @param {object} slParams - Stop-loss parameters (e.g., stopPrice).
     */
    const handleAddStopLoss = (positionId, slParams) => {
        const position = simulatedOrders.find(o => o.id === positionId);
        if (!position) return;

        // The stop-loss side is opposite to the original position's side.
        const slSide = position.params.side === 'Buy' ? 'Sell' : 'Buy';
        const newSlOrder = {
            id: uuidv4(), // Unique ID for the stop-loss order.
            positionId, // Link to the original position.
            params: { ...position.params, side: slSide }, // Inherit params, but reverse side.
            status: 'Untriggered', // Initial status: waiting for trigger.
            stopLoss: slParams, // Specific stop-loss details.
            createdAt: new Date()
        };
        setSimulatedOrders(p => [...p, newSlOrder]); // Add the new stop-loss order to the list.
        setOrderForSl(null); // Close the stop-loss modal.
    };

    /**
     * Handles adding additional quantity to an existing open position.
     * It simulates a market order for the additional quantity and averages the fill price.
     * @param {string} orderId - The ID of the position to modify.
     * @param {number} additionalQuantity - The quantity to add.
     */
    const handleAddQuantity = (orderId, additionalQuantity) => {
        const orderToModify = simulatedOrders.find(o => o.id === orderId);
        if (!orderToModify) return;

        // Create parameters for the additional quantity market order.
        const addParams = { ...orderToModify.params, quantity: additionalQuantity, orderType: 'Market' };
        const book = orderBooks[orderToModify.params.venue]; // Get the order book.

        if (book?.bids.length > 0 && book?.asks.length > 0) {
            const addResult = calculateMarketImpact(addParams, book); // Calculate impact of the additional quantity.

            // Calculate new average fill price for the combined position.
            const oldTotalCost = orderToModify.result.avgFillPrice * parseFloat(orderToModify.params.quantity);
            const newTotalCost = addResult.avgFillPrice * additionalQuantity;
            const totalQuantity = parseFloat(orderToModify.params.quantity) + additionalQuantity;
            const newAvgPrice = (oldTotalCost + newTotalCost) / totalQuantity;

            // Update the existing order with new total quantity and averaged fill price.
            setSimulatedOrders(p => p.map(o => o.id === orderId ? { ...o, params: { ...o.params, quantity: totalQuantity }, result: { ...o.result, avgFillPrice: newAvgPrice } } : o));
        } else {
            setMessageModal({ title: "Error Adding Quantity", message: "Order book not available." });
        }
        setOrderForQty(null); // Close the add quantity modal.
    };

    /**
     * Handles the comparison simulation for different timing scenarios.
     * It calculates the market impact for each scenario based on adjusted slippage.
     * @param {object} params - Base order parameters for comparison.
     */
    const handleCompare = useCallback((params) => {
        const book = orderBooks[params.venue]; // Get the order book for the selected venue.
        if (!book?.bids.length > 0 || !book?.asks.length > 0) {
            setMessageModal({ title: "Comparison Error", message: "Order book not available." });
            return;
        }

        // Map through each timing scenario to calculate adjusted impact.
        const results = TIMING_SCENARIOS.map(scenario => {
            const baseImpact = calculateMarketImpact(params, book); // Calculate base impact.
            // Adjust slippage based on the scenario's delay factor.
            const adjustedSlippage = baseImpact.slippage * (1 + scenario.delayFactor);
            const adjustedPriceImpact = baseImpact.priceImpact * (1 + scenario.delayFactor);

            let adjustedAvgFillPrice = baseImpact.avgFillPrice;
            // Adjust average fill price based on the change in slippage.
            if (scenario.delayFactor > 0 && baseImpact.avgFillPrice > 0) {
                const priceChange = baseImpact.avgFillPrice * (adjustedSlippage - baseImpact.slippage) / 100;
                adjustedAvgFillPrice = params.side === 'Buy' ? baseImpact.avgFillPrice + priceChange : baseImpact.avgFillPrice - priceChange;
            }
            return {
                ...scenario,
                avgFillPrice: adjustedAvgFillPrice,
                slippage: adjustedSlippage,
                priceImpact: adjustedPriceImpact,
                filledPercentage: baseImpact.filledPercentage,
                orderParams: params
            };
        });
        setComparisonResult(results); // Store the comparison results.
        setPage('orders'); // Navigate to the orders page to display results.
    }, [orderBooks, calculateMarketImpact]); // Dependencies: `orderBooks` and `calculateMarketImpact`.

    // Render a loading screen until the component is confirmed to be client-side.
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center">
                <h1 className="text-4xl font-bold text-cyan-400 animate-pulse">Initializing Application...</h1>
            </div>
        );
    }

    // Calculate midPrice here to pass as a prop to OrdersPage, ensuring it's always based on current data.
    const midPriceForProps = orderBooks[selectedExchange] && orderBooks[selectedExchange].bids[0] && orderBooks[selectedExchange].asks[0]
        ? (parseFloat(orderBooks[selectedExchange].bids[0].price) + parseFloat(orderBooks[selectedExchange].asks[0].price)) / 2
        : null;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
            <Navbar setPage={setPage} /> {/* Navigation bar */}
            <div className="flex-grow p-4 md:p-8">
                {/* Conditional rendering based on the current page state */}
                {page === 'home' ? (
                    <HomePageContent
                        pageData={{ orderBooks, connectionStatus, priceHistory, selectedExchange, activeChart, simulatedOrders, clickedPrice, symbol }}
                        handlers={{ setSelectedExchange, setActiveChart, handleRowClick, handleSimulate, setPage, setSymbol, handleCompare }}
                    />
                ) : (
                    <OrdersPage
                        orders={simulatedOrders}
                        handlers={{
                            setPage,
                            handleCancelOrder: (id) => setOrderToCancel(id), // Set order ID for cancellation confirmation.
                            handleClosePosition,
                            handleAddStopLoss: (id) => setOrderForSl(simulatedOrders.find(o => o.id === id)), // Find order for SL modal.
                            handleAddQuantity: (id) => setOrderForQty(simulatedOrders.find(o => o.id === id)) // Find order for quantity modal.
                        }}
                        midPrice={midPriceForProps} // Pass current mid-price for PnL calculation on OrdersPage.
                        comparisonResult={comparisonResult}
                        setComparisonResult={setComparisonResult} // Allow OrdersPage to clear comparison results.
                    />
                )}
                {/* Modals, conditionally rendered based on their respective states */}
                {orderToCancel && <ConfirmationModal message="Are you sure you want to cancel this order?" onConfirm={confirmCancelOrder} onCancel={() => setOrderToCancel(null)} />}
                {orderForSl && <AddStopLossModal position={orderForSl} onConfirm={handleAddStopLoss} onCancel={() => setOrderForSl(null)} />}
                {orderForQty && <AddQuantityModal order={orderForQty} onConfirm={handleAddQuantity} onCancel={() => setOrderForQty(null)} />}
                {slippageWarning && (
                    <SlippageWarningModal
                        slippage={slippageWarning.slippage}
                        priceImpact={slippageWarning.priceImpact}
                        onConfirm={() => {
                            scheduleOrderExecution(slippageWarning.params, slippageWarning.delayInMs);
                            setSlippageWarning(null); // Clear warning after confirmation.
                        }}
                        onCancel={() => setSlippageWarning(null)} // Clear warning on cancel.
                    />
                )}
                {messageModal && <MessageModal title={messageModal.title} message={messageModal.message} onClose={() => setMessageModal(null)} />}
            </div>
            <Footer /> {/* Application footer */}
        </div>
    );
}
