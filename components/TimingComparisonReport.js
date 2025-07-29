/**
 * @fileoverview Defines the TimingComparisonReport component.
 * @description This component is responsible for displaying a side-by-side analysis
 * of different trade timing scenarios, highlighting the optimal result based on a defined metric.
 */

// This directive is crucial for Next.js, marking the component as a Client Component,
// which is necessary for using React hooks like `useMemo`.
"use client";

import { useMemo } from "react";

/**
 * Renders a comparison report for different timing scenarios of a simulated trade.
 *
 * @param {object} props - The component props.
 * @param {Array<object> | null} props.comparisonResult - An array of result objects from the simulation,
 * one for each timing scenario. If null, an empty state is shown.
 * @returns {JSX.Element} The rendered comparison report.
 */
export default function TimingComparisonReport({ comparisonResult }) {
    // This memoized calculation finds the "best" scenario from the results.
    // `useMemo` prevents this logic from re-running on every render, optimizing performance.
    const bestScenario = useMemo(() => {
        // If there are no results, there's no best scenario.
        if (!comparisonResult || comparisonResult.length === 0) return null;

        // The definition of "best" can be changed here. Currently, we use the lowest slippage
        // as a simple, universal metric for the most favorable outcome.
        // The `reduce` function iterates through the results to find the object with the minimum slippage.
        return comparisonResult.reduce((best, current) =>
            current.slippage < best.slippage ? current : best
        );
    }, [comparisonResult]); // Dependency array: Recalculate only when comparisonResult changes.

    // --- Conditional Rendering: Empty State ---
    // If no comparison has been run yet, display a helpful placeholder message.
    if (!comparisonResult) {
        return (
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 h-full flex items-center justify-center">
                <p className="text-gray-500">Click "Compare" on the form to see a timing analysis.</p>
            </div>
        );
    }

    // --- Main Render Logic ---
    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">Timing Scenario Comparison</h3>
            
            {/* Display a summary of the order that was simulated, providing context for the table below. */}
            {comparisonResult[0]?.orderParams && (
                <p className="text-gray-400 mb-4">
                    Order: {comparisonResult[0].orderParams.side} {comparisonResult[0].orderParams.quantity} {comparisonResult[0].orderParams.symbol} ({comparisonResult[0].orderParams.orderType})
                    {/* Conditionally show the limit price if it's a limit order. */}
                    {comparisonResult[0].orderParams.orderType === 'Limit' && ` @ $${comparisonResult[0].orderParams.price}`}
                </p>
            )}

            {/* The `overflow-x-auto` wrapper ensures the table is responsive on small screens. */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3">Scenario</th>
                            <th scope="col" className="px-4 py-3">Avg. Fill Price</th>
                            <th scope="col" className="px-4 py-3">Slippage</th>
                            <th scope="col" className="px-4 py-3">Market Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map over the results to create a table row for each scenario. */}
                        {comparisonResult.map((result, index) => {
                            // Check if the current row's result matches the pre-calculated best scenario.
                            const isBest = bestScenario && result.label === bestScenario.label;
                            return (
                                // Conditionally apply styling to highlight the best row.
                                <tr key={index} className={`border-b border-gray-700 ${isBest ? 'bg-green-900/50' : ''}`}>
                                    <th scope="row" className={`px-4 py-3 font-medium whitespace-nowrap ${isBest ? 'text-green-400' : 'text-white'}`}>
                                        {result.label}
                                    </th>
                                    <td className="px-4 py-3 font-mono">${result.avgFillPrice.toFixed(2)}</td>
                                    <td className="px-4 py-3 font-mono">{result.slippage.toFixed(4)}%</td>
                                    <td className="px-4 py-3 font-mono">${result.priceImpact.toFixed(4)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}