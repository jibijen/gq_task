/**
 * @fileoverview Defines the PriceChart component for visualizing price history.
 * @description This component uses Chart.js to render a time-series line chart,
 * ideal for showing price trends over a period.
 */

// This directive is crucial for Next.js, marking the component as a Client Component,
// which is necessary for using React hooks and rendering interactive charts.
"use client";

import React from 'react';
// Imports the Line chart component from the react-chartjs-2 wrapper.
import { Line } from 'react-chartjs-2';
// Imports necessary components from the core Chart.js library, including the TimeScale for the x-axis.
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
// Imports the date adapter for Chart.js. This is ESSENTIAL for the time scale to correctly parse and format dates.
import 'chartjs-adapter-date-fns';

// In Chart.js v3+, components like scales and plugins are tree-shakable and must be explicitly registered.
// We are registering all the parts we need, most importantly the `TimeScale`.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

/**
 * Renders a time-series line chart for price data.
 *
 * @param {object} props - The component props.
 * @param {Array<object>} props.data - An array of data points. Each point should be an object
 * with `x` (a timestamp or Date object) and `y` (the price). E.g., `[{ x: new Date(), y: 50000 }]`.
 * @returns {JSX.Element} The rendered chart component.
 */
export default function PriceChart({ data }) {
    // Configuration options for the Chart.js Line chart.
    const options = {
        responsive: true, // Makes the chart adapt to the size of its container.
        maintainAspectRatio: false, // Allows the chart to fill the container's height and width.
        plugins: {
            legend: { display: false }, // Hides the default chart legend.
            tooltip: {
                mode: 'index', // Shows tooltips for all datasets at a given time point.
                intersect: false, // Tooltip will appear on hover near a point, not just directly over it.
            },
        },
        // Configuration for the chart's axes.
        scales: {
            // X-axis (Time)
            x: {
                type: 'time', // This is the key setting that enables time-series functionality.
                time: {
                    unit: 'second', // The unit of time for the axis labels.
                    tooltipFormat: 'HH:mm:ss', // How the time should be formatted in the tooltip.
                    displayFormats: {
                        second: 'HH:mm:ss', // How the time should be formatted on the axis itself.
                    },
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }, // Light grid lines for dark mode.
                ticks: { color: '#9ca3af' }, // Gray color for the axis labels.
            },
            // Y-axis (Price)
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' },
            },
        },
    };

    // This object wraps the `data` prop in the structure that Chart.js expects for its datasets.
    const chartData = {
        datasets: [{
            label: 'Mid Price',
            data: data, // The array of {x, y} points passed as a prop.
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderWidth: 2,
            pointRadius: 0, // Hides the individual points on the line for a cleaner look.
            tension: 0.1, // Adds a slight curve to the line.
            showLine: true,
        }],
    };

    return (
        // A container div that defines the size and background of the chart area.
        // The height is responsive: 400px on small screens, 500px on medium screens and up.
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full h-[400px] md:h-[500px]">
            <Line options={options} data={chartData} />
        </div>
    );
}