/**
 * @fileoverview Defines the LiveSpreadIndicator component.
 * @description This component displays the live bid-ask spread for a financial instrument,
 * indicating the difference between the best available buy and sell prices.
 */

import React from 'react';

/**
 * A UI component that calculates and displays the current market spread.
 *
 * @param {object} props - The component props.
 * @param {number | null | undefined} props.bestBid - The best (highest) price a buyer is willing to pay.
 * @param {number | null | undefined} props.bestAsk - The best (lowest) price a seller is willing to accept.
 * @returns {JSX.Element} The rendered spread indicator component.
 */
export default function LiveSpreadIndicator({ bestBid, bestAsk }) {
    // A guard clause to handle the initial state where data might not be available yet.
    // This prevents calculation errors and provides clear feedback to the user.
    if (!bestBid || !bestAsk) {
        return (
            <div className="bg-gray-800 p-4 rounded-lg shadow-xl text-center">
                <p className="text-gray-400">Waiting for spread data...</p>
            </div>
        );
    }

    // --- Spread Calculation ---
    // The absolute spread is the difference between the best ask and the best bid.
    const spread = bestAsk - bestBid;
    // The spread percentage is calculated relative to the ask price.
    const spreadPercentage = (spread / bestAsk) * 100;

    return (
        // The main container for the indicator, styled as a dark card.
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl text-center">
            <h3 className="text-md font-semibold text-gray-400 mb-2">Market Spread</h3>
            
            {/* Display the calculated absolute spread, formatted to two decimal places. */}
            <p className="text-2xl font-bold text-cyan-400">
                {spread.toFixed(2)}
            </p>

            {/*
             * Display the spread percentage.
             * The color changes based on the spread's width:
             * - Red for a wide spread (potentially higher cost to trade).
             * - Green for a tight spread (potentially lower cost to trade).
             * The threshold (0.5) is set as an example value for what constitutes a "wide" spread.
            */}
            <p className={`text-sm font-medium ${spread > 0.5 ? 'text-red-500' : 'text-green-500'}`}>
                ({spreadPercentage.toFixed(4)}%)
            </p>
        </div>
    );
}