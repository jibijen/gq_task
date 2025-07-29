/**
 * @fileoverview Defines the Navbar component for the application.
 * @description This component renders the main navigation bar, providing links to different sections of the app.
 * It's designed to be sticky at the top of the viewport and uses a parent-controlled state for navigation.
 */

// This directive marks the component as a Client Component in Next.js.
// It's necessary because the component uses React hooks like `useState` (implicitly via the `setPage` prop) and event handlers (`onClick`).
"use client";

import React from 'react';

/**
 * A responsive and sticky navigation bar component.
 *
 * @param {object} props - The props for the component.
 * @param {Function} props.setPage - A state setter function passed from the parent component.
 * This function is called with a string ('home', 'orders', etc.) to change the currently displayed page.
 * @returns {JSX.Element} The rendered navigation bar element.
 */
export default function Navbar({ setPage }) {
    return (
        // The <nav> element is styled to be sticky at the top of the screen (sticky top-0),
        // with a semi-transparent, blurred background effect for a modern look.
        // The z-index (z-40) ensures it stays above other content.
        <nav className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-40">
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* --- Logo and Brand Name Section --- */}
                    <div className="flex-shrink-0">
                        {/* The link navigates to the 'home' page using the setPage function. */}
                        <a href="#" onClick={() => setPage('home')} className="flex items-center gap-2">
                            {/* You can place an <svg> or <img> tag here for a graphical logo. */}
                            <span className="text-white text-xl font-bold">GoQuant Task</span>
                        </a>
                    </div>

                    {/* --- Navigation Links Section --- */}
                    {/* This container is hidden on small screens (mobile-first) and visible on medium screens and larger (md:block). */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {/* Each link is an anchor tag styled for consistency. */}
                            {/* onClick handler calls the setPage function to switch views instead of causing a full page reload. */}
                            <a href="#" onClick={() => setPage('home')} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</a>
                            <a href="#" onClick={() => setPage('orders')} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Orders & Positions</a>
                        </div>
                    </div>

                </div>
            </div>
        </nav>
    );
}