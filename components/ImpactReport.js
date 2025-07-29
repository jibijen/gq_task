/**
 * @fileoverview Defines components for displaying a report of simulated trade orders.
 * @description This file contains the main `ImpactReport` component and its child `OrderCard` component,
 * which work together to list and manage simulated orders from a trade simulation.
 */

import React from 'react';

/**
 * A card component that displays the details of a single simulated order.
 * It shows order parameters, status, and results, and provides actions like cancel or delete.
 *
 * @param {object} props - The component props.
 * @param {object} props.order - The full order object containing its parameters, status, and results.
 * @param {Function} props.onCancel - Callback function to cancel a pending order, taking the order ID as an argument.
 * @param {Function} props.onDelete - Callback function to remove an order from the report, taking the order ID as an argument.
 * @returns {JSX.Element} The rendered order card.
 */
const OrderCard = ({ order, onCancel, onDelete }) => {
    // Destructure for easier access to order properties.
    const { id, params, status, result } = order;

    // --- Dynamic Styling ---
    // Boolean flag for styling buy (green) vs. sell (red) orders.
    const isBuy = params.side === 'Buy';
    // Maps the order status to a specific Tailwind CSS background color for the status badge.
    const statusColor = status === 'Pending Trigger' ? 'bg-blue-500'
                      : status === 'Pending'         ? 'bg-yellow-500'
                      : status === 'Filled'          ? 'bg-green-500'
                      : status === 'Cancelled'       ? 'bg-gray-500'
                      : 'bg-red-500'; // Default/error color

    /**
     * Determines the correct price to display based on the order type.
     * @returns {string|number} The price to display. Returns 'Market' for market orders.
     */
    const displayPrice = () => {
        if (params.orderType === 'Market') return 'Market';
        // For both 'Limit' and 'Trigger Limit' orders, the main price of interest is the limit price.
        return params.price;
    };

    return (
        // The main card container with a fade-in animation.
        <div className="bg-gray-700 p-4 rounded-lg space-y-2 animate-fade-in relative">
            {/* Delete button positioned at the top-right corner of the card. */}
            <button onClick={() => onDelete(id)} className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors" aria-label="Delete order">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            {/* Primary order information line. */}
            <div className="flex justify-between items-center pr-4">
                <span className={`font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                    {params.side.toUpperCase()} {params.quantity} @ {displayPrice()}
                </span>
                <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${statusColor}`}>{status}</span>
            </div>

            {/* --- Conditional Sections --- */}

            {/* Extra information for Trigger Limit orders. */}
            {params.orderType === 'Trigger Limit' && (
                <p className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                    Trigger Price: <span className="font-mono text-blue-400">{params.triggerPrice}</span>
                </p>
            )}

            {/* Display fill results only if the order status is 'Filled' and results exist. */}
            {status === 'Filled' && result && (
                <div className="text-xs text-gray-300 space-y-1 pt-2 border-t border-gray-600">
                    <p><strong>Avg. Fill Price:</strong> {result.avgFillPrice.toFixed(2)}</p>
                    <p><strong>Slippage:</strong> <span className={result.slippage > 0.1 ? 'text-red-400 font-bold' : 'text-green-400'}>{result.slippage.toFixed(4)}%</span></p>
                    <p><strong>Filled:</strong> {result.filledPercentage.toFixed(2)}% of order</p>
                    {result.slippage > 0.1 && <p className="text-red-400 font-bold pt-1">Warning: High Slippage!</p>}
                </div>
            )}

            {/* Display the cancel button only for orders that are still active. */}
            {(status === 'Pending' || status === 'Pending Trigger') && (
                <button onClick={() => onCancel(id)} className="w-full text-center text-xs text-red-400 hover:text-red-300 pt-1 transition-colors">
                    Cancel
                </button>
            )}
        </div>
    );
};


/**
 * The main component that displays a list of all simulated orders.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.orders - An array of order objects to be displayed.
 * @param {Function} props.onCancelOrder - The handler function to cancel a pending order.
 * @param {Function} props.onDeleteOrder - The handler function to delete an order from the list.
 * @returns {JSX.Element} The rendered impact report panel.
 */
export default function ImpactReport({ orders, onCancelOrder, onDeleteOrder }) {
    return (
        // Main container for the report panel. `h-full flex flex-col` allows the inner list to be scrollable.
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl h-full flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Simulated Orders</h2>

            {/* Ternary operator to conditionally render content based on whether orders exist. */}
            {orders.length === 0
                // Display a message if there are no orders to show.
                ? (<p className="text-gray-400 text-center mt-8">No simulated orders yet.</p>)
                // If orders exist, map over the array to render an OrderCard for each one.
                : (<div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {orders.map(order => (
                        <OrderCard
                            key={order.id} // The 'key' prop is crucial for React's list rendering performance.
                            order={order}
                            onCancel={onCancelOrder} // Pass the parent's handler function down to the child.
                            onDelete={onDeleteOrder} // Pass the parent's handler function down to the child.
                        />
                    ))}
                </div>)
            }
        </div>
    );
}