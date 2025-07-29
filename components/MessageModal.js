/**
 * @fileoverview Defines the MessageModal component.
 * @description This is a generic, reusable modal component designed to display
 * a simple informational message with a title to the user.
 */

// This directive marks the component as a Client Component in Next.js,
// which is required because it uses event handlers (onClick).
"use client";

import React from 'react';

/**
 * A simple modal dialog for displaying a message to the user.
 * It's purely presentational and controlled by its parent component.
 *
 * @param {object} props - The props for the component.
 * @param {string} props.title - The title to be displayed at the top of the modal.
 * @param {string} props.message - The main message content to be displayed in the modal body.
 * @param {Function} props.onClose - The callback function to execute when the user clicks the "OK" button to close the modal.
 * @returns {JSX.Element} The rendered message modal.
 */
const MessageModal = ({ title, message, onClose }) => {
    return (
        // Modal container: a fixed overlay that covers the screen with a semi-transparent background.
        // `z-50` ensures it appears on top of all other page content.
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {/* Modal card: styled with a dark background, rounded corners, and a centered layout. */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center">

                {/* The dynamic title passed via props is displayed here. */}
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>

                {/* The dynamic message passed via props is displayed here. */}
                <p className="text-gray-300 mb-6">{message}</p>

                {/* The single action button to close the modal. */}
                <button
                    onClick={onClose} // Triggers the parent's close handler.
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                >
                    OK
                </button>
            </div>
        </div>
    );
};

export default MessageModal;