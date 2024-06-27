// BubbleChart.js
// This script visualizes the number of students based on nationality
// Based on https://d3-graph-gallery.com/circularpacking.html


import { updateStudentOutcomesChart } from './OutcomesChart.js';
import { handleGenderSelection } from './GenderPlot.js';
import { handleDebtorSelection } from './DebtorPlot.js';
import { handleScholarshipSelection } from './ScholarshipPlot.js';

// Global variable for formatted data
let formattedData;

// This array will hold the names of the countries we've excluded
let excludedCountries = [];

// Set the dimensions and margins of the graph
const width = 760;
const height = 260;

function initializeBubble() {
    // Append the SVG object to the #world-map-visualization div
    const svg = d3.select("#world-map-visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var g = svg.append("g");
    let maxScale = 10;


    // Set the scale extent for zooming
    // Define zoomed function to handle zoom
    var zoomListener = d3.zoom()
        .scaleExtent([0.1, maxScale])
        .on("zoom", zoomed);

    // Apply the zoom listener to the SVG
    svg.call(zoomListener)
        .on('dblclick.zoom', null);

    // Zoom function that applies the transformation to the 'g' element
    function zoomed(event) {
        g.attr("transform", event.transform);
    }

    // Reset Button
    d3.select("#world-map-visualization").append("button")
        .attr("class", "reset-bubble")
        .attr("id", "resetBubble")
        .html('<i class="fa-regular fa-circle-xmark""></i> Reset')
        .on("click", function () {
            // Clear the excluded countries list
            excludedCountries = [];
            // Reset and reprocess the full initial dataset
            d3.csv("../data/StudentOutcomesUpdated.csv").then(processBubbleData);
            svg.transition()
                .duration(750)

            // Reset other linked charts
            if (window.resetDebtorData) {
                window.resetDebtorData();
            }
            if (window.resetScholarshipData) {
                window.resetScholarshipData();
            }
            if (window.resetGenderData) {
                window.resetGenderData();
            }
            if (window.resetOutcome) {
                window.resetOutcome();
            }
        });

    document.getElementById('resetChart').addEventListener('click', function () {
        // Clear the excluded countries list
        excludedCountries = [];
        // Reset and reprocess the full initial dataset
        d3.csv("../data/StudentOutcomesUpdated.csv").then(processBubbleData);
    });


    // Create a tooltip
    const Tooltip = d3.select("#world-map-visualization")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")
        .style("pointer-events", "none");


    // Load the initial dataset
    d3.csv("../data/StudentOutcomesUpdated.csv").then(function (data) {
        // Set formattedData to the loaded data
        formattedData = data;
        // Call the main function to process the full dataset
        processBubbleData();
    });

    // Process the data
    function processBubbleData(inputData) {
        // If inputData is not provided, default to the global formattedData
        const data = inputData || formattedData;

        // Compute the occurrence of each nationality
        const outcomesMap = new Map();
        data.forEach(function (d) {
            outcomesMap.set(d.Nationality, (outcomesMap.get(d.Nationality) || 0) + 1);
        });

        // Convert the outcomesMap into an array of objects
        formattedData = Array.from(outcomesMap, ([name, value]) => ({ name, value }));

        // Size scale for bubbles
        const size = d3.scaleSqrt()
            .domain([0, d3.max(formattedData, d => d.value)])
            .range([3, 60]);


        // Create an ordinal color scale with a random color for each nationality
        const color = d3.scaleOrdinal()
            .domain(formattedData.map(d => d.name))
            .range(formattedData.map(d => d3.interpolateSpectral(Math.random())));

        // Convert the flat data to a hierarchy
        const root = d3.hierarchy({ children: formattedData })
            .sum(d => d.value);

        // Initialize the circle pack layout
        d3.pack()
            .size([width, height])
            .padding(3)
            .radius(d => size(d.value))
            (root);


        // Three function that change the tooltip when user hover / move / leave a cell
        const mouseover = function (event, d) {
            Tooltip
                .style("opacity", 1)
                .html('<u>' + d.data.name + '</u>' + "<br>" + d.value + " students");
        }
        const mousemove = function (event, d) {
            Tooltip
                .html('<u>' + d.data.name + '</u>' + "<br>" + d.value + " students")
                .style("left", (d.x + 20) + "px")
                .style("top", (d.y - 10) + "px");
        }
        const mouseleave = function (event, d) {
            Tooltip
                .style("opacity", 0)
        }

        // Bind the data to circles
        const node = g.selectAll("circle")
            .data(root.leaves())
            .join("circle")
            .attr("class", "node")
            .attr("r", d => size(d.value))
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .style("fill", d => color(d.data.name))
            .style("fill-opacity", 0.8)
            .attr("stroke", "black")
            .style("stroke-width", 1)
            .on("dblclick", doubleClicked)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Features of the forces applied to the nodes:
        const simulation = d3.forceSimulation()
            .force("center", d3.forceCenter().x(width / 2).y(height / 2)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(0.1)) // Nodes are attracted one each other of value is > 0
            .force("collide", d3.forceCollide().strength(0.2).radius(function (d) { return (d.r + 3) }).iterations(1)); // Force that avoids circle overlapping

        // Apply these forces to the nodes and update their positions.
        simulation
            .nodes(root.leaves())
            .on("tick", function (d) {
                node
                    .attr("cx", function (d) { return d.x = Math.max(d.r, Math.min(width - d.r, d.x)); })
                    .attr("cy", function (d) { return d.y = Math.max(d.r, Math.min(height - d.r, d.y)); });
            });

        // Bubble Interactions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.03).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(event, d) {
            // Limit the position of the node so it doesn't go outside the bounding box
            d.fx = Math.max(d.r, Math.min(width - d.r, event.x));
            d.fy = Math.max(d.r, Math.min(height - d.r, event.y));
        }
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0.03);
            d.fx = null;
            d.fy = null;
        }
    };

    // Function to handle double-click event
    function doubleClicked(event, d) {
        // Add the double-clicked country to the excluded list and pass it to relating charts
        const countryName = d.data.name
        excludedCountries.push(countryName);
        updateStudentOutcomesChart(countryName);
        handleGenderSelection(countryName);
        handleDebtorSelection(countryName);
        handleScholarshipSelection(countryName);

        // Reload and process the data excluding the selected countries
        d3.csv('../data/StudentOutcomesUpdated.csv').then(function (loadedData) {
            // Filter out the data for excluded countries
            const filteredData = loadedData.filter(d => !excludedCountries.includes(d.Nationality));
            // Process the filtered data
            processBubbleData(filteredData);
        });
    }

    // Tick function for the simulation
    function ticked() {
        node
            .attr("cx", d => d.x = Math.max(d.r, Math.min(width - d.r, d.x)))
            .attr("cy", d => d.y = Math.max(d.r, Math.min(height - d.r, d.y)));
    }
}

export { initializeBubble }
