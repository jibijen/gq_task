/**
 * @fileoverview Defines the ConfirmationModal component.
 * @description This is a generic, reusable modal component designed to get
 * "Are you sure?" style confirmations from the user before proceeding with an action.
 */

// This directive marks the component as a Client Component in Next.js,
// which is required because it uses event handlers (onClick).
"use client";

import React from 'react';

/**
 * A reusable modal dialog for confirming user actions.
 *
 * @param {object} props - The props for the component.
 * @param {string} props.message - The confirmation message or question to display to the user.
 * @param {Function} props.onConfirm - The callback function to execute if the user confirms the action (clicks "Yes").
 * @param {Function} props.onCancel - The callback function to execute if the user cancels the action (clicks "No").
 * @returns {JSX.Element} The rendered confirmation modal.
 */
export default function ConfirmationModal({ message, onConfirm, onCancel }) {
    return (
        // Modal container: a fixed overlay that covers the screen with a semi-transparent background.
        // `z-50` ensures it appears on top of all other page content.
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            {/* Modal card: styled with a dark background, rounded corners, and a fade-in animation. */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center animate-fade-in">

                {/* The dynamic message passed via props is displayed here. */}
                <h3 className="text-lg font-semibold text-white mb-4">{message}</h3>

                {/* Container for the action buttons. */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel} // Triggers the cancel callback function.
                        className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
                    >
                        No
                    </button>
                    <button
                        onClick={onConfirm} // Triggers the confirm callback function.
                        // The red color visually indicates a potentially destructive or significant action.
                        className="px-6 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                    >
                        Yes
                    </button>
                </div>

            </div>
        </div>
    );
}