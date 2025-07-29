/**
 * @fileoverview Defines the DepthChart component for visualizing market depth.
 * @description This component uses Chart.js and react-chartjs-2 to render a financial depth chart,
 * showing cumulative bid and ask orders. It includes an optional annotation for a simulated order price.
 */

"use client";

import React from 'react';
// Imports the Line chart component from the react-chartjs-2 wrapper.
import { Line } from 'react-chartjs-2';
// Imports necessary components from the core Chart.js library.
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
// Imports the annotation plugin to draw extra elements (like lines) on the chart canvas.
import annotationPlugin from 'chartjs-plugin-annotation';

// In Chart.js v3+, components like scales, elements, and plugins are "tree-shakable" and must be explicitly registered.
// This line registers all the parts of Chart.js that we will use in this component.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // The 'Filler' plugin is used to create the filled area under the lines (for the bid/ask spread).
  annotationPlugin
);

/**
 * Renders a market depth chart.
 *
 * @param {object} props - The component props.
 * @param {object} props.data - The data object for Chart.js. This should contain labels and datasets for bids and asks.
 * @param {number} [props.simulatedPrice] - An optional price point to display as a vertical line annotation, representing a user's potential order.
 * @returns {JSX.Element} The rendered chart component.
 */
export default function DepthChart({ data, simulatedPrice }) {
  // Configuration options for the Chart.js Line chart.
  const options = {
    responsive: true, // Makes the chart adapt to the size of its container.
    maintainAspectRatio: false, // Allows the chart to have a custom height/width ratio.

    plugins: {
      legend: { display: false }, // Hides the default chart legend.
      tooltip: {
        mode: 'index', // Shows tooltips for all datasets at a given x-value.
        intersect: false, // Tooltip will appear even if the mouse is not directly over a point.
      },
      // Configuration for the annotation plugin.
      annotation: {
        annotations: {
          // This uses a conditional spread operator. The 'line1' annotation object is only added
          // to the configuration if `simulatedPrice` has a truthy value.
          ...(simulatedPrice && {
            line1: {
              type: 'line',
              xMin: simulatedPrice, // The x-value where the line will be drawn.
              xMax: simulatedPrice,
              borderColor: 'rgb(255, 204, 0)', // A distinct yellow color for the line.
              borderWidth: 2,
              borderDash: [6, 6], // Creates a dashed line effect.
              label: {
                content: 'Your Order', // Text displayed on the label.
                enabled: true,
                position: 'start', // Position of the label on the line.
                backgroundColor: 'rgba(255, 204, 0, 0.7)',
                color: 'black',
                font: { weight: 'bold' }
              }
            }
          })
        }
      }
    },

    // Configuration for the chart's axes.
    scales: {
      // X-axis (Price)
      x: {
        type: 'linear', // The x-axis represents a continuous numerical scale (price).
        grid: { color: 'rgba(255, 255, 255, 0.1)' }, // Light grid lines for dark mode.
        ticks: {
          color: '#9ca3af', // Gray color for the axis labels (ticks).
          maxTicksLimit: 10, // Prevents the axis from becoming too crowded.
        }
      },
      // Y-axis (Cumulative Quantity)
      y: {
        beginAtZero: true, // Ensures the y-axis starts at 0.
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#9ca3af' },
      },
    },

    // Configuration for chart elements.
    elements: {
      point:{
        radius: 0 // Hides the dots for each data point on the line for a cleaner look.
      }
    }
  };

  return (
    // A container div that defines the size and background of the chart area.
    // The height is responsive: 400px on small screens, 500px on medium screens and up.
    <div className="bg-gray-800 p-4 rounded-lg shadow-xl w-full h-[400px] md:h-[500px]">
      <Line options={options} data={data} />
    </div>
  );
}