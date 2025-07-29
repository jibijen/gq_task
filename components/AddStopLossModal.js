/**
 * @fileoverview Defines the AddStopLossModal component.
 * @description This component renders a modal for adding a "Stop Loss Market" order to an existing position.
 * It's a simplified version focused solely on this type of stop order.
 */

// Marks the component as a Client Component, necessary for using React hooks and event handlers.
"use client";

import { useState } from 'react';

/**
 * A modal component for setting a Stop Loss Market order on an open position.
 *
 * @param {object} props - The component props.
 * @param {object} props.position - The position object to which the stop loss will be added.
 * @param {Function} props.onConfirm - Callback function executed on form submission. It receives the position ID and an object containing the stop loss details.
 * @param {Function} props.onCancel - Callback function executed when the user closes the modal.
 * @returns {JSX.Element} The rendered modal component.
 */
export default function AddStopLossModal({ position, onConfirm, onCancel }) {
    // State to manage the value of the stop price input field.
    const [stopPrice, setStopPrice] = useState('');

    /**
     * Handles the form submission for setting the stop loss.
     * @param {React.FormEvent} e - The form event object.
     */
    const handleSubmit = (e) => {
        // Prevent the default form submission behavior, which would cause a page reload.
        e.preventDefault();

        // Validate that the stop price is a positive number.
        if (!stopPrice || parseFloat(stopPrice) <= 0) {
            // Provide simple feedback for invalid input.
            // In a production app, this could be replaced with a more robust notification system.
            alert('Please enter a valid stop price.');
            return;
        }

        // Call the parent's onConfirm callback with the required data.
        // The order type is hardcoded to 'Stop Loss Market' as this modal is specialized for that purpose.
        // limitPrice is null because it's not applicable for a market stop order.
        onConfirm(position.id, {
            stopPrice,
            orderType: 'Stop Loss Market',
            limitPrice: null
        });
    };

    // Determine the side of the closing (stop) order.
    // A stop loss for a 'Buy' position is a 'Sell' order, and vice-versa.
    const oppositeSide = position.params.side === 'Buy' ? 'Sell' : 'Buy';

    return (
        // Modal container with a semi-transparent background overlay.
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-fade-in">
            {/* The main modal card with styling. */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-xl font-bold text-white mb-2">Add Stop Loss</h2>
                {/* Contextual information for the user about the position being modified. */}
                <p className="text-sm text-gray-400 mb-6">
                    For your {position.params.quantity} {position.params.symbol} position.
                </p>

                {/* The form is used to group inputs and handle submission logic. */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Input section for the Stop Price. */}
                        <div>
                            <label htmlFor="stop-price" className="block text-sm font-medium text-gray-300">
                                Stop Price
                            </label>
                            {/* Helper text to clarify the action for the user. */}
                            <p className="text-xs text-gray-500 mb-1">
                                If the market price reaches this value, a {oppositeSide.toLowerCase()} order will be placed.
                            </p>
                            <input
                                id="stop-price"
                                type="number"
                                value={stopPrice}
                                onChange={(e) => setStopPrice(e.target.value)}
                                placeholder="Enter stop price"
                                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-cyan-500 focus:border-cyan-500"
                                required // HTML5 validation for a required field.
                                step="any" // Allows for floating-point (decimal) numbers.
                                autoFocus // Automatically focus the input when the modal opens.
                            />
                        </div>
                    </div>

                    {/* Action buttons at the bottom of the modal. */}
                    <div className="mt-8 flex justify-end gap-4">
                        <button
                            type="button" // Important: type="button" prevents this from submitting the form.
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" // This button triggers the form's onSubmit handler.
                            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors"
                        >
                            Set Stop Loss
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}