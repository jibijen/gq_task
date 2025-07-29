/**
 * @fileoverview Defines the SimulationForm component.
 * @description This component provides the primary user interface for configuring and submitting
 * simulated trade orders. It allows users to set all order parameters and either place a single
 * simulated order or trigger a comparison of different execution scenarios.
 */

"use client";

import { useState, useEffect, useMemo } from 'react';

// A constant array of supported trading symbols.
const SYMBOLS = ['BTC-USDT', 'ETH-USDT'];

/**
 * A form for creating and submitting simulated trade orders.
 *
 * @param {object} props - The component props.
 * @param {string} props.selectedExchange - The currently selected exchange (read-only in this form).
 * @param {string} props.symbol - The currently selected trading symbol.
 * @param {Function} props.setSymbol - Callback function to update the parent's symbol state.
 * @param {Function} props.onSimulate - Callback to submit a single simulation order.
 * @param {Function} props.onCompare - Callback to trigger a comparison of multiple scenarios.
 * @param {string|null} props.clickedPrice - A price clicked from the order book to pre-fill the form.
 * @param {object} props.currentBook - The live order book data for real-time calculations.
 * @param {Function} props.calculateMarketImpact - A function passed from a parent to calculate potential trade impact.
 * @returns {JSX.Element} The rendered simulation form.
 */
export default function SimulationForm({ selectedExchange, symbol, setSymbol, onSimulate, onCompare, clickedPrice, currentBook, calculateMarketImpact }) {
    // A single state object to manage all form fields, simplifying state updates.
    const [formState, setFormState] = useState({
        orderType: 'Limit',
        side: 'Buy',
        price: '',
        quantity: '',
        timing: '0', // Represents execution delay in milliseconds.
    });
    
    // This effect listens for changes to `clickedPrice` (from the order book table)
    // and updates the form's price field, providing a seamless user experience.
    useEffect(() => {
        if (clickedPrice) {
            setFormState(prev => ({ ...prev, price: clickedPrice }));
        }
    }, [clickedPrice]);

    /**
     * A generic change handler for all form inputs.
     * It uses the input's `name` attribute to update the correct property in the form state.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - The change event.
     */
    const handleChange = (e) => setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // Calculates the potential market impact of the configured order in real-time.
    // `useMemo` ensures this potentially expensive calculation only runs when relevant form fields change,
    // optimizing performance by preventing unnecessary recalculations on every render.
    const potentialImpact = useMemo(() => {
        if (!currentBook || !formState.quantity || !calculateMarketImpact) return null;
        // The result of this calculation can be used to display a live preview to the user.
        return calculateMarketImpact({ ...formState, symbol, venue: selectedExchange }, currentBook);
    }, [formState, symbol, selectedExchange, currentBook, calculateMarketImpact]);

    /**
     * Handles the submission of a single simulated order.
     */
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default browser form submission.
        // Basic validation for quantity and limit price.
        if (!formState.quantity || parseFloat(formState.quantity) <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }
        if (formState.orderType === 'Limit' && (!formState.price || parseFloat(formState.price) <= 0)) {
            alert('Please enter a valid price for a limit order.');
            return;
        }
        
        // Calls the parent's simulate handler with all form parameters.
        onSimulate({ ...formState, symbol, venue: selectedExchange });
    };

    /**
     * Handles the "Compare" action, which triggers a multi-scenario analysis.
     */
    const handleCompare = () => {
        // Perform the same validation as a regular submission.
        if (!formState.quantity || parseFloat(formState.quantity) <= 0) {
            alert('Please enter a valid quantity to compare.');
            return;
        }
        if (formState.orderType === 'Limit' && (!formState.price || parseFloat(formState.price) <= 0)) {
            alert('Please enter a valid price to compare.');
            return;
        }

        // The 'timing' or execution delay is specific to a single simulation,
        // so it's removed before triggering the comparison view.
        const { timing, ...params } = formState;
        onCompare({ ...params, symbol, venue: selectedExchange });
    };

    // Dynamically sets the text color for the "Side" dropdown based on selection.
    const sideColorClass = formState.side === 'Buy' ? 'text-green-400' : 'text-red-400';

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Place Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* --- Form Fields --- */}
                <div><label className="block text-sm font-medium text-gray-400">Venue</label><input type="text" value={selectedExchange} readOnly className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-300 cursor-not-allowed" /></div>
                <div><label className="block text-sm font-medium text-gray-400">Symbol</label><select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">{SYMBOLS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-400">Order Type</label><select name="orderType" value={formState.orderType} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"><option>Limit</option><option>Market</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-400">Side</label><select name="side" value={formState.side} onChange={handleChange} className={`mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 font-bold ${sideColorClass}`}><option className="text-green-400" value="Buy">Buy</option><option className="text-red-400" value="Sell">Sell</option></select></div>
                </div>
                {/* The price input is disabled for Market orders, as it's not applicable. */}
                <div><label className="block text-sm font-medium text-gray-400">Price</label><input type="number" name="price" value={formState.price} onChange={handleChange} disabled={formState.orderType === 'Market'} placeholder={formState.orderType === 'Market' ? 'N/A' : 'Enter price'} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white disabled:cursor-not-allowed disabled:opacity-50" /></div>
                {/* CORRECTED THIS LINE */}
                <div><label className="block text-sm font-medium text-gray-400">Quantity</label><input type="number" name="quantity" value={formState.quantity} onChange={handleChange} placeholder="Enter quantity" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" /></div>
                
                {/* Execution Delay allows simulating orders that are not placed instantly. */}
                <div>
                    <label className="block text-sm font-medium text-gray-400">Execution Delay</label>
                    <select name="timing" value={formState.timing} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
                        <option value="0">Immediate</option>
                        <option value="5000">5s Delay</option>
                        <option value="10000">10s Delay</option>
                        <option value="30000">30s Delay</option>
                    </select>
                </div>
                
                {/* --- Action Buttons --- */}
                <div className="flex gap-2 pt-2">
                    {/* The `type="submit"` button triggers the form's `onSubmit` handler. */}
                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg">Place Order</button>
                    {/* The `type="button"` prevents this button from submitting the form. */}
                    <button type="button" onClick={handleCompare} className="w-full bg-grey-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg">Compare</button>
                </div>
            </form>
        </div>
    );
}