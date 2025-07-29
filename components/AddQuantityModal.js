/**
 * @fileoverview Defines the AddQuantityModal component.
 * @description This component renders a modal dialog that allows users to add quantity
 * to an existing open position. It takes the position details and callback functions as props.
 */

// This directive marks the component as a Client Component in Next.js, which is
// necessary for using React hooks like `useState` and handling user events.
"use client";

import { useState } from 'react';

/**
 * A modal component for adding quantity to an existing trade position.
 *
 * @param {object} props - The component props.
 * @param {object} props.order - The order/position object to be modified. Contains details like id, symbol, side, and current quantity.
 * @param {Function} props.onConfirm - Callback function executed when the user confirms the action. It receives the order ID and the additional quantity.
 * @param {Function} props.onCancel - Callback function executed when the user cancels or closes the modal.
 * @returns {JSX.Element} The rendered modal component.
 */
export default function AddQuantityModal({ order, onConfirm, onCancel }) {
    // State to manage the value of the additional quantity input field.
    const [additionalQuantity, setAdditionalQuantity] = useState('');

    /**
     * Handles the confirm button click.
     * It validates the input quantity and calls the onConfirm prop if valid.
     */
    const handleConfirm = () => {
        // Parse the input string to a floating-point number.
        const quantity = parseFloat(additionalQuantity);

        // Basic validation: ensure the entered quantity is a positive number.
        if (quantity > 0) {
            // Call the parent's confirm handler with the order ID and the new quantity.
            onConfirm(order.id, quantity);
        } else {
            // Provide simple feedback if the input is invalid.
            alert('Please enter a valid quantity.');
        }
    };

    return (
        // Modal container: a fixed overlay that covers the entire screen.
        // `z-50` ensures it appears on top of all other content.
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            {/* Modal card: styled with a dark background, rounded corners, and a subtle fade-in animation. */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center animate-fade-in">
                <h3 className="text-lg font-semibold text-white mb-2">Add to Position</h3>

                {/* Display the symbol and side of the current position. */}
                <p className="text-sm text-gray-400 mb-4">
                    {order.params.side.toUpperCase()} {order.params.symbol}
                </p>

                {/* Display current position details for user context. */}
                <div className="space-y-1 text-left text-xs mb-4">
                    <p className="flex justify-between"><span>Current Qty:</span> <span>{order.params.quantity}</span></p>
                    <p className="flex justify-between"><span>Avg. Entry Price:</span> <span>${order.result.avgFillPrice.toFixed(2)}</span></p>
                </div>
                
                {/* Controlled input for the user to enter the additional quantity. */}
                <input
                    type="number"
                    value={additionalQuantity}
                    onChange={(e) => setAdditionalQuantity(e.target.value)}
                    placeholder="Additional Quantity"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-4"
                    autoFocus // Automatically focus the input when the modal opens.
                />

                {/* Action buttons for confirming or canceling the operation. */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel} // Closes the modal without taking action.
                        className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm} // Triggers the confirmation logic.
                        className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}