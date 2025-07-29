/**
 * @fileoverview Defines the OrderImbalanceIndicator component.
 * @description This component visualizes the balance between total buy orders (bids) and sell orders (asks)
 * in the order book, providing a quick look at market sentiment.
 */

import React from 'react';

/**
 * A UI component that displays the bid vs. ask imbalance.
 * It shows the relationship as a percentage-based bar and as absolute quantities.
 *
 * @param {object} props - The component props.
 * @param {object} props.imbalanceData - An object containing the imbalance metrics.
 * @param {number} props.imbalanceData.ratio - The ratio of total bid size to total overall size (bids + asks).
 * @param {number} props.imbalanceData.totalBidSize - The absolute sum of all bid quantities.
 * @param {number} props.imbalanceData.totalAskSize - The absolute sum of all ask quantities.
 * @returns {JSX.Element | null} The rendered indicator component, or null if data is invalid.
 */
export default function OrderImbalanceIndicator({ imbalanceData }) {
    // Guard clause: Prevents rendering if the data is not available or is malformed.
    // This ensures the component doesn't crash or display incorrect information.
    if (!imbalanceData || isNaN(imbalanceData.ratio)) {
        return null;
    }

    // Destructure properties from the data object for easier access.
    const { ratio, totalBidSize, totalAskSize } = imbalanceData;

    // --- Percentage Calculation ---
    // Calculate the percentage representation for both bids and asks based on the provided ratio.
    const bidPercentage = (ratio * 100).toFixed(2);
    const askPercentage = (100 - parseFloat(bidPercentage)).toFixed(2);

    return (
        // The main container for the indicator, styled as a dark card.
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl space-y-3">
            <h3 className="text-md font-semibold text-center text-gray-400">Order Book Imbalance</h3>
            
            {/* --- Percentage Bar Visualization --- */}
            {/* This bar visually represents the calculated bid/ask percentages. */}
            <div className="w-full bg-gray-700 rounded-full h-6 flex overflow-hidden">
                {/* Green segment for the bids (buying pressure). */}
                <div 
                    // The width is set dynamically based on the bid percentage.
                    style={{ width: `${bidPercentage}%` }} 
                    className="bg-green-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ease-in-out"
                >
                    {/* To avoid clutter, the percentage text is only shown if the segment is large enough. */}
                    {bidPercentage > 10 ? `${bidPercentage}%` : ''}
                </div>
                {/* Red segment for the asks (selling pressure). */}
                <div 
                    style={{ width: `${askPercentage}%` }} 
                    className="bg-red-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ease-in-out"
                >
                    {askPercentage > 10 ? `${askPercentage}%` : ''}
                </div>
            </div>

            {/* --- Absolute Quantity Display --- */}
            {/* This section provides the raw total quantities for more detailed analysis. */}
            <div className="flex justify-between text-center text-xs font-mono">
                <div className="text-green-400">
                    <span className="block font-bold">{totalBidSize.toFixed(4)}</span>
                    <span className="text-gray-500">Bids (BTC)</span>
                </div>
                <div className="text-red-400">
                    <span className="block font-bold">{totalAskSize.toFixed(4)}</span>
                    <span className="text-gray-500">Asks (BTC)</span>
                </div>
            </div>
        </div>
    );
}