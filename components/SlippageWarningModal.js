/**
 * @fileoverview Defines the SlippageWarningModal component.
 * @description This component renders a confirmation dialog specifically to warn users
 * when their simulated order is predicted to cause high slippage.
 */

// This directive marks the component as a Client Component in Next.js,
// which is required because it uses event handlers (onClick).
"use client";

import React from 'react';

/**
 * A modal dialog that warns the user about high potential slippage and asks for confirmation.
 *
 * @param {object} props - The component props.
 * @param {number} props.slippage - The calculated slippage percentage to display in the warning.
 * @param {Function} props.onConfirm - The callback function to execute if the user chooses to proceed.
 * @param {Function} props.onCancel - The callback function to execute if the user cancels the action.
 * @returns {JSX.Element} The rendered warning modal.
 */
export default function SlippageWarningModal({ slippage, onConfirm, onCancel }) {
    return (
        // Modal container: a fixed overlay that covers the screen with a semi-transparent background.
        // `z-50` ensures it appears on top of all other page content.
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            {/* Modal card: styled with a dark background, rounded corners, and a fade-in animation. */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center animate-fade-in">
                
                {/* A prominent warning icon to immediately convey caution to the user. */}
                <div className="flex justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">High Slippage Warning</h3>
                
                {/* The main warning message, dynamically displaying the slippage percentage. */}
                <p className="text-gray-300 mb-4">
                    The order may result in a significant slippage of approximately <span className="font-bold text-yellow-400">{slippage.toFixed(4)}%</span>.
                </p>

                <p className="text-sm text-gray-400 mb-6">
                    Do you want to proceed?
                </p>

                {/* Action buttons for the user to confirm or cancel. */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel} // Triggers the cancel callback.
                        className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm} // Triggers the confirm callback.
                        // The red color visually indicates a risky or potentially costly action.
                        className="px-6 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                    >
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </div>
    );
}