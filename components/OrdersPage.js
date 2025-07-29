/**
 * @fileoverview This file defines the components for the "Orders & Positions" page.
 * @description It includes the main page layout with tabbed navigation, and individual card components
 * for displaying open positions, pending orders, historical trades, and a special comparison view.
 */

import { useMemo, useState } from 'react';

// --- Helper Functions ---

/**
 * A utility function to get the appropriate Tailwind CSS classes for an order status.
 * @param {string} status - The status of the order (e.g., 'Filled', 'Pending').
 * @returns {string} A string of CSS classes for styling.
 */
const getStatusClass = (status) => {
    switch (status) {
        case 'Filled': return 'bg-green-500/20 text-green-400';
        case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
        case 'Untriggered': return 'bg-blue-500/20 text-blue-400';
        case 'Cancelled': return 'bg-gray-500/20 text-gray-400';
        case 'Failed': return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-700 text-gray-300';
    }
};

// --- Child Components ---

/**
 * A card component specifically for displaying an ACTIVE, OPEN position.
 * @param {object} props - The component props.
 * @param {object} props.order - The position data object.
 * @param {object} props.handlers - An object containing callback functions for position management.
 * @returns {JSX.Element} The rendered position card.
 */
const PositionCard = ({ order, handlers }) => {
    const { handleClosePosition, handleAddStopLoss, handleAddQuantity } = handlers;
    
    // Determine the live Profit/Loss and its corresponding color class.
    // Uses nullish coalescing to safely access either a final or live P/L value.
    const pnl = order.pnl ?? order.livePnl ?? 0;
    const pnlClass = pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-gray-400';
    
    // Provide a fallback for filled percentage if the data is not available.
    const filledPercentage = order.result.filledPercentage ?? 100;

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 w-full animate-fade-in">
            {/* --- Card Header --- */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className={`font-bold text-xl ${order.params.side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                            {order.params.side.toUpperCase()} {order.params.quantity} {order.params.symbol}
                        </h3>
                        <span className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md">
                            {order.params.venue}
                        </span>
                    </div>
                    <p className="text-sm text-gray-400">
                        {order.params.orderType} entry at avg. price of ${order.result.avgFillPrice.toFixed(2)}
                    </p>
                </div>
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">Position</span>
            </div>

            {/* --- Metrics Grid --- */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-400">Slippage</span><span className="font-mono">{order.result.slippage.toFixed(4)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Market Impact</span><span className="font-mono">${order.result.priceImpact.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Time to Fill</span><span className="font-mono">{order.timeToFill?.toFixed(2)}s</span></div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Filled %</span>
                    <span className="font-mono">{filledPercentage.toFixed(2)}%</span>
                </div>
                {/* Live P/L Display */}
                <div className="flex justify-between items-center col-span-2 pt-2 border-t border-gray-700">
                    <span className="text-gray-400 text-base font-bold">Live P/L</span>
                    <span className={`font-mono font-bold text-lg ${pnlClass}`}>
                        {pnl.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="grid grid-cols-3 gap-4">
                <button onClick={() => handleAddQuantity(order.id)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md">Add Qty</button>
                <button onClick={() => handleAddStopLoss(order.id)} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md">Add SL</button>
                <button onClick={() => handleClosePosition(order.id)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md">Exit Position</button>
            </div>
        </div>
    );
};

/**
 * A multi-purpose card for displaying historical orders. It has a special, detailed view
 * for CLOSED positions and a more compact view for all other order types (Pending, Cancelled, etc.).
 * @param {object} props - The component props.
 * @param {object} props.order - The order data object.
 * @param {object} props.handlers - An object containing callback functions.
 * @returns {JSX.Element} The rendered history card.
 */
const OrderHistoryCard = ({ order, handlers }) => {
    const { handleCancelOrder } = handlers;
    const isCancellable = order.status === 'Pending' || order.status === 'Untriggered';

    // --- Special View for CLOSED Positions ---
    // This block renders a detailed summary for a trade that has been both entered and exited.
    // The presence of a non-undefined `pnl` property on a 'Filled' order signifies a closed trade.
    if (order.status === 'Filled' && order.pnl !== undefined) {
        const pnlClass = order.pnl > 0 ? 'text-green-400' : order.pnl < 0 ? 'text-red-400' : 'text-gray-400';
        const filledPercentage = order.result.filledPercentage ?? 100;
        
        return (
            <div className="bg-gray-800/70 rounded-lg p-6 shadow-lg border border-gray-700 w-full animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className={`font-bold text-lg ${order.params.side === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>
                                {order.params.side.toUpperCase()} {order.params.quantity} {order.params.symbol}
                            </h3>
                            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-md">
                                {order.params.venue}
                            </span>
                        </div>
                         <p className="text-xs text-gray-500 mt-1">
                            Closed on {order.exitResult?.executedAt ? new Date(order.exitResult.executedAt).toLocaleString() : 'N/A'}
                         </p>
                    </div>
                    <span className="bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full">Closed</span>
                </div>
                 <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Avg. Entry</span><span className="font-mono">${order.result.avgFillPrice.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Avg. Exit</span><span className="font-mono">${order.exitResult?.avgFillPrice.toFixed(2)}</span></div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Filled %</span>
                        <span className="font-mono">{filledPercentage.toFixed(2)}%</span>
                    </div>
                    {/* Realized P/L */}
                    <div className="flex justify-between col-span-3 pt-3 mt-3 border-t border-gray-700">
                        <span className="text-gray-400 font-bold">Realized P/L</span>
                        <span className={`font-mono font-bold text-lg ${pnlClass}`}>
                            ${order.pnl.toFixed(2)}
                        </span>
                    </div>
                 </div>
            </div>
        );
    }

    // --- Generic View for All Other Orders (Pending, Cancelled, Failed) ---
    // Dynamically create the price information string based on order type.
    let priceInfo = '';
    if (order.status === 'Untriggered') {
        priceInfo = `Stop @ ${order.stopLoss.stopPrice}`;
    } else {
        priceInfo = `${order.params.orderType} @ ${order.params.price || 'Market'}`;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 w-full animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-white">{order.params.side} {order.params.quantity} {order.params.symbol}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusClass(order.status)}`}>{order.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                        {priceInfo} on <span className="font-semibold text-gray-300">{order.params.venue}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'No date'}
                    </p>
                </div>
                {/* Conditionally render the Cancel button if the order is still active. */}
                {isCancellable && (
                    <button onClick={() => handleCancelOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * A view component for displaying a comparison table of simulation results.
 * @param {object} props - The component props.
 * @param {Array<object>} props.result - An array of simulation scenario results.
 * @param {Function} props.onBack - Callback function to close this view and return to the main page.
 * @returns {JSX.Element} The rendered comparison table view.
 */
const ComparisonView = ({ result, onBack }) => {
    // Extract common order parameters from the first result for the summary header.
    const { orderParams } = result[0];
    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="mb-6 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">&larr; Back to Dashboard</button>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-2">Execution Comparison</h2>
                <p className="text-gray-400 mb-6">
                    Simulating a {orderParams.side} {orderParams.orderType} order for {orderParams.quantity} {orderParams.symbol} on {orderParams.venue}.
                </p>
                <div className="overflow-x-auto">
                    {/* Renders a table to compare different execution scenarios. */}
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 rounded-l-lg">Scenario</th>
                                <th scope="col" className="px-6 py-3">Est. Fill Price</th>
                                <th scope="col" className="px-6 py-3">Est. Slippage</th>
                                <th scope="col" className="px-6 py-3">Est. Price Impact</th>
                                <th scope="col" className="px-6 py-3 rounded-r-lg">Filled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.map((scenario, index) => (
                                <tr key={index} className="bg-gray-800 border-b border-gray-700 last:border-b-0">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        {scenario.label}
                                    </th>
                                    <td className="px-6 py-4 font-mono">${scenario.avgFillPrice.toFixed(4)}</td>
                                    <td className="px-6 py-4 font-mono">{scenario.slippage.toFixed(4)}%</td>
                                    <td className="px-6 py-4 font-mono">${scenario.priceImpact.toFixed(4)}</td>
                                    <td className="px-6 py-4 font-mono">{scenario.filledPercentage.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---

/**
 * The main container component for the Orders & Positions page.
 * It manages the page's state, including tab navigation and switching to the comparison view.
 * @param {object} props - The component props.
 * @param {Array<object>} props.orders - The master list of all orders and positions.
 * @param {object} props.handlers - An object of callback functions to be passed down to children.
 * @param {object} props.comparisonResult - Data for the comparison view. If this is not null, the comparison view is shown.
 * @param {Function} props.setComparisonResult - Function to set or clear the comparison result data.
 * @returns {JSX.Element} The rendered Orders page.
 */
export default function OrdersPage({ orders, handlers, midPrice, comparisonResult, setComparisonResult }) {
    const [activeTab, setActiveTab] = useState('positions');

    // --- Data Filtering with Memoization ---
    // useMemo is used to prevent re-filtering the `orders` array on every render.
    // The lists are recalculated only if the `orders` array itself changes.

    // Open Orders: Orders that are awaiting execution.
    const openOrders = useMemo(() => orders.filter(o => ['Pending', 'Untriggered'].includes(o.status)), [orders]);
    
    // Positions: Orders that are filled but not yet closed (indicated by the absence of a final `pnl`).
    const positions = useMemo(() => orders.filter(o => o.status === 'Filled' && o.pnl === undefined), [orders]);
    
    // History: Orders that are completed (Cancelled, Failed, or Filled and Closed - indicated by the presence of a `pnl`).
    const history = useMemo(() => orders.filter(o => o.status === 'Cancelled' || o.status === 'Failed' || (o.status === 'Filled' && o.pnl !== undefined)), [orders]);

    // --- View Switching Logic ---
    // If comparison data exists, render the ComparisonView instead of the main dashboard.
    if (comparisonResult) {
        return <ComparisonView result={comparisonResult} onBack={() => setComparisonResult(null)} />;
    }

    // --- Main Dashboard Render ---
    return (
        <div className="w-full max-w-screen-xl mx-auto">
            <button onClick={() => handlers.setPage('home')} className="mb-6 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">&larr; Back to Dashboard</button>
            
            {/* Tab Navigation */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2 mb-8 flex gap-2">
                <button onClick={() => setActiveTab('positions')} className={`w-full py-3 font-semibold rounded-md transition-all ${activeTab === 'positions' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700'}`}>Positions ({positions.length})</button>
                <button onClick={() => setActiveTab('openOrders')} className={`w-full py-3 font-semibold rounded-md transition-all ${activeTab === 'openOrders' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700'}`}>Open Orders ({openOrders.length})</button>
                <button onClick={() => setActiveTab('history')} className={`w-full py-3 font-semibold rounded-md transition-all ${activeTab === 'history' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700'}`}>History ({history.length})</button>
            </div>

            {/* Tab Content Display */}
            <div className="space-y-6">
                {activeTab === 'positions' && (positions.length > 0 ? positions.map(order => <PositionCard key={order.id} order={order} handlers={handlers} />) : <p className="text-center text-gray-500 py-8">No active positions.</p>)}
                {activeTab === 'openOrders' && (openOrders.length > 0 ? openOrders.map(order => <OrderHistoryCard key={order.id} order={order} handlers={handlers} />) : <p className="text-center text-gray-500 py-8">No open orders.</p>)}
                {activeTab === 'history' && (history.length > 0 ? history.map(order => <OrderHistoryCard key={order.id} order={order} handlers={handlers} />) : <p className="text-center text-gray-500 py-8">No order history.</p>)}
            </div>
        </div>
    );
}