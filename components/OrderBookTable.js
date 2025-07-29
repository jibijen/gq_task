/**
 * @fileoverview Defines components for rendering a standard financial order book table.
 * @description This file contains the main `OrderBookTable` component and its child `OrderRow`,
 * which work together to display separate, sorted lists of bids and asks.
 */

import React from 'react';

/**
 * Renders a single, clickable row in the order book table.
 *
 * @param {object} props - The component props.
 * @param {number} props.price - The price level for the order.
 * @param {number} props.size - The quantity available at this price level.
 * @param {number} props.total - The cumulative quantity up to this price level.
 * @param {'bid' | 'ask'} props.type - Determines the row's color ('bid' for green, 'ask' for red).
 * @param {Function} props.onRowClick - Callback function executed when the row is clicked, passing up the price.
 * @returns {JSX.Element | null} The rendered table row, or null if data is invalid.
 */
const OrderRow = ({ price, size, total, type, onRowClick }) => {
    // Guard clause to prevent rendering errors if essential data is missing or not a number.
    if (typeof price !== 'number' || typeof size !== 'number') return null;

    // Determine text color based on whether it's a bid or an ask.
    const color = type === 'bid' ? 'text-green-400' : 'text-red-400';

    return (
        // The row is a 3-column grid. It's clickable to allow interaction (e.g., pre-filling a trade form).
        <div
            className={`grid grid-cols-3 gap-2 text-sm font-mono ${color} p-1 rounded-md cursor-pointer hover:bg-gray-700 transition-colors duration-150`}
            onClick={() => onRowClick(price)}
        >
            {/* Using toFixed() for consistent decimal formatting. `truncate` prevents long numbers from breaking the layout. */}
            <span className="text-left min-w-0 truncate">{price.toFixed(2)}</span>
            <span className="text-right min-w-0 truncate">{size.toFixed(4)}</span>
            <span className="text-right min-w-0 truncate">{total.toFixed(4)}</span>
        </div>
    );
};

/**
 * The main component that structures and displays the entire order book.
 * It processes raw bid/ask data to include cumulative totals before rendering.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} [props.bids=[]] - An array of bid objects, sorted highest price first.
 * @param {Array<object>} [props.asks=[]] - An array of ask objects, sorted lowest price first.
 * @param {Function} props.onRowClick - The function to handle clicks on individual rows.
 * @returns {JSX.Element} The rendered order book table with separate bid and ask sections.
 */
export default function OrderBookTable({ bids = [], asks = [], onRowClick }) {
    // --- Data Processing ---
    // The component first processes the raw bids and asks to add cumulative totals,
    // which are essential for understanding market depth.

    // Process the top 15 bids to calculate their cumulative size.
    let cumulativeBidTotal = 0;
    const processedBids = bids.slice(0, 15).map(bid => ({ ...bid, total: cumulativeBidTotal += bid.size }));

    // Process the top 15 asks.
    let cumulativeAskTotal = 0;
    // The asks array is reversed so the lowest ask price (the best ask) is displayed at the bottom,
    // visually connecting with the highest bid price. This is standard UI for order books.
    const processedAsks = asks.slice(0, 15).reverse().map(ask => ({ ...ask, total: cumulativeAskTotal += ask.size }));

    // --- Render Logic ---
    return (
        // Main container for the order book.
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full">
            {/* The layout splits into two columns on medium screens and larger for a side-by-side view. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Bids Section (Buy Orders) */}
                <div>
                    <h3 className="text-lg font-semibold text-center text-green-400 mb-2">Bids</h3>
                    {/* Column Headers */}
                    <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-gray-400 mb-2 px-1">
                        <span>Price (USDT)</span><span className="text-right">Size (BTC)</span><span className="text-right">Total</span>
                    </div>
                    {/* Render each processed bid as an OrderRow. */}
                    <div className="space-y-1">
                        {processedBids.map((bid, index) => (
                            <OrderRow
                                key={`bid-${bid.price}-${index}`} // Unique key for React's rendering list.
                                {...bid} // Spread all properties of the bid object as props.
                                type="bid"
                                onRowClick={onRowClick} // Pass the handler function down.
                            />
                        ))}
                    </div>
                </div>

                {/* Asks Section (Sell Orders) */}
                <div>
                    <h3 className="text-lg font-semibold text-center text-red-400 mb-2">Asks</h3>
                    {/* Column Headers */}
                    <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-gray-400 mb-2 px-1">
                        <span>Price (USDT)</span><span className="text-right">Size (BTC)</span><span className="text-right">Total</span>
                    </div>
                    {/* Render each processed ask as an OrderRow. */}
                    <div className="space-y-1">
                        {processedAsks.map((ask, index) => (
                            <OrderRow
                                key={`ask-${ask.price}-${index}`}
                                {...ask}
                                type="ask"
                                onRowClick={onRowClick}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}