/**
 * @fileoverview Defines the main client-side view for the Order Book Dashboard.
 * @description This component orchestrates all client-side logic, including state management,
 * data fetching via hooks, data processing for charts, and rendering of all sub-components.
 */

// This directive is crucial for Next.js, marking the component as a Client Component.
// This allows the use of React hooks (useState, useEffect, useMemo) and browser-side logic.
"use client";

import { useState, useMemo, useEffect } from 'react';
// Custom hook to manage WebSocket connections and order book data.
import useOrderBook from '../hooks/useOrderBook';
// Child components for displaying different parts of the UI.
import OrderBookTable from './OrderBookTable';
import DepthChart from './DepthChart';
import PriceChart from './PriceChart';
import LiveSpreadIndicator from './LiveSpreadIndicator';
import SimulationForm from './SimulationForm';

// A constant array of supported exchanges.
const EXCHANGES = ['OKX', 'BYBIT', 'DERIBIT'];

/**
 * The primary client-side component that assembles the order book dashboard.
 * It manages the application's state and passes data down to presentational components.
 */
export default function OrderBookClientView() {
    // --- State Management ---

    // State to ensure the component only renders on the client-side.
    // This is a common pattern in Next.js to prevent hydration errors with components
    // that rely on browser APIs or have client-specific rendering logic.
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fetches live data and connection status from our custom hook.
    const { orderBooks, connectionStatus, priceHistory } = useOrderBook();

    // State for user interactions and UI control.
    const [selectedExchange, setSelectedExchange] = useState(EXCHANGES[0]); // Currently viewed exchange.
    const [activeChart, setActiveChart] = useState('depth'); // Toggles between 'depth' and 'price' charts.
    const [clickedPrice, setClickedPrice] = useState(null); // Stores price clicked in the order book table.
    const [simulationResult, setSimulationResult] = useState(null); // Stores the results from the simulation form.

    // --- Data Derivation and Memoization ---

    // Retrieves the order book for the currently selected exchange.
    const currentBook = orderBooks[selectedExchange];

    // useMemo is used for performance optimization. This calculation runs only when `currentBook` changes.
    // It processes the raw bid/ask data into a format suitable for the DepthChart component.
    const depthChartData = useMemo(() => {
        // Guard clause: Return an empty structure if the order book data isn't available yet.
        if (!currentBook || currentBook.bids.length === 0 || currentBook.asks.length === 0) {
            return { datasets: [] };
        }

        // Process bids: Calculate cumulative size.
        // Bids are reversed so the chart builds from the center outwards (highest bid price first).
        let cumulativeBidSize = 0;
        const bidsData = currentBook.bids.slice(0, 50).reverse().map(bid => ({ x: bid.price, y: cumulativeBidSize += bid.size }));

        // Process asks: Calculate cumulative size.
        let cumulativeAskSize = 0;
        const asksData = currentBook.asks.slice(0, 50).map(ask => ({ x: ask.price, y: cumulativeAskSize += ask.size }));

        // Return the final data structure expected by Chart.js.
        return {
            datasets: [
                { label: 'Bids', data: bidsData, borderColor: 'rgba(16, 185, 129, 1)', backgroundColor: 'rgba(16, 185, 129, 0.2)', fill: true, stepped: true },
                { label: 'Asks', data: asksData, borderColor: 'rgba(244, 63, 94, 1)', backgroundColor: 'rgba(244, 63, 94, 0.2)', fill: true, stepped: true },
            ],
        };
    }, [currentBook]); // Dependency array: Recalculate only when currentBook changes.

    // Memoized filtering of price history for the selected exchange.
    const priceChartData = useMemo(() => priceHistory.filter(p => p.exchange === selectedExchange), [priceHistory, selectedExchange]);

    // Safely get the best bid and ask prices using optional chaining.
    const bestBid = currentBook?.bids[0]?.price;
    const bestAsk = currentBook?.asks[0]?.price;

    // --- Event Handlers ---

    /**
     * Handles clicks on rows in the OrderBookTable.
     * @param {number} price - The price from the clicked row.
     */
    const handleRowClick = (price) => {
        // Sets the clicked price, which can be used by other components like the simulation form.
        setClickedPrice(price.toString());
    };

    /**
     * Callback function for the SimulationForm component.
     * @param {object} params - The simulation parameters submitted from the form.
     */
    const handleSimulate = (params) => {
        // Lifts the state up from the form to the main view.
        setSimulationResult(params);
        console.log("Simulation triggered on main page:", params);
    };

    // If not on the client, render nothing to avoid server-side rendering issues.
    if (!isClient) {
        return null;
    }

    // --- Render Logic ---
    return (
        <>
            {/* Exchange Selector: Buttons to switch between different exchanges. */}
            <div className="flex justify-center space-x-2 mb-8 bg-gray-800 p-2 rounded-lg shadow-md max-w-xs mx-auto">
                {EXCHANGES.map(exchange => (
                    <button
                        key={exchange}
                        onClick={() => setSelectedExchange(exchange)}
                        // Dynamically applies classes for active vs. inactive states.
                        className={`w-full px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
                            selectedExchange === exchange
                                ? 'bg-cyan-500 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {exchange}
                    </button>
                ))}
            </div>

            {/* Main Dashboard Layout: A responsive grid for all the components. */}
            <main className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Left Column: Charts and Spread Indicator */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    {/* Chart type toggler */}
                    <div className="flex justify-center bg-gray-700 p-1 rounded-lg">
                        <button onClick={() => setActiveChart('depth')} className={`w-full py-2 rounded-md font-semibold transition ${activeChart === 'depth' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>Depth Chart</button>
                        <button onClick={() => setActiveChart('price')} className={`w-full py-2 rounded-md font-semibold transition ${activeChart === 'price' ? 'bg-cyan-600 text-white' : 'text-gray-400'}`}>Price Trend</button>
                    </div>

                    {/* Conditional rendering for the chart: Shows a loading state or the active chart. */}
                    {connectionStatus[selectedExchange] === 'Connected' && currentBook && currentBook.bids.length > 0 ? (
                        activeChart === 'depth' ? <DepthChart data={depthChartData} /> : <PriceChart data={priceChartData} />
                    ) : (
                        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center w-full h-[400px] md:h-[500px] flex justify-center items-center"><p>Waiting for chart data...</p></div>
                    )}

                    <LiveSpreadIndicator bestBid={bestBid} bestAsk={bestAsk} />
                </div>

                {/* Center Column: Order Book Table */}
                <div className="xl:col-span-4">
                    {/* Conditional rendering for the order book table. */}
                    {connectionStatus[selectedExchange] === 'Connected' && currentBook && currentBook.bids.length > 0 ? (
                        <OrderBookTable bids={currentBook.bids} asks={currentBook.asks} onRowClick={handleRowClick} />
                    ) : (
                        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center w-full h-full flex justify-center items-center"><p>Waiting for table data...</p></div>
                    )}
                </div>

                {/* Right Column: Simulation Form */}
                <div className="xl:col-span-3">
                    <SimulationForm
                        selectedExchange={selectedExchange}
                        onSimulate={handleSimulate}
                        clickedPrice={clickedPrice} // Pass the clicked price down to pre-fill the form.
                    />
                </div>
            </main>
        </>
    );
}