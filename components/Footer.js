/**
 * @fileoverview Defines the Footer component for the application.
 * @description This component renders the site-wide footer, which includes a dynamic copyright notice.
 */

// This directive marks the component as a Client Component in Next.js.
// While not strictly necessary for just displaying text, it's good practice
// when using client-side APIs like `new Date()` to avoid potential server-client
// hydration mismatches and ensure the date is generated on the client.
"use client";

import React from 'react';

/**
 * A simple footer component that displays a copyright notice with the current year.
 *
 * @returns {JSX.Element} The rendered footer element.
 */
export default function Footer() {
    // Dynamically gets the current year. This ensures the copyright notice
    // is always up-to-date without needing manual changes.
    const currentYear = new Date().getFullYear();

    return (
        // The <footer> element is styled with a dark background and some top margin
        // to separate it from the content above.
        <footer className="bg-gray-800 mt-12">
            <div className="max-w-screen-2xl mx-auto py-4 px-4 md:px-8">
                {/* Copyright text, centered and styled for readability. */}
                <p className="text-center text-sm text-gray-400">
                    {/* The &copy; HTML entity renders the © symbol. */}
                    &copy; {currentYear} Built by a future GoQuant Developer.
                </p>
            </div>
        </footer>
    );
}