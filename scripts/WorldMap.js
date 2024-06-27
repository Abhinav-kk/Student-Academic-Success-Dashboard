// WorldMap.js
// This script visualizes the student outcomes based on geographical data.

import { updateStudentOutcomesChart } from './OutcomesChart.js';
import { handleGenderSelection } from './GenderPlot.js';
import { handleDebtorSelection } from './DebtorPlot.js';
import { handleScholarshipSelection } from './ScholarshipPlot.js';

// Initialize outcomesMap 
const outcomesMap = new Map();
const inflationMap = new Map();
const unemploymentMap = new Map();
const gdpMap = new Map();

var selectedMetric = 'students';
var tooltipText = "Number of Students: ";

// Define the default translation and scale
const defaultTranslateX = -140;
const defaultTranslateY = 0;
const defaultScale = 1;

// Define color scale for population density
const populationScale = d3.scaleThreshold()
  .domain([1, 5, 10, 20, 30, 50, 100, 200, 500])
  .range(["#e0f3f3", "#c6e2e2", "#a6cfdb", "#7fb8cc", "#4a9dbb", "#2173a6", "#0d5792", "#003366", "#001f4d", "#000033"]);

const rateScale = d3.scaleThreshold()
  .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .range(["#e0f3f3", "#c6e2e2", "#a6cfdb", "#7fb8cc", "#4a9dbb", "#2173a6", "#0d5792", "#003366", "#001f4d", "#000033"]);

const gdpScale = d3.scaleThreshold()
  .domain([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5])
  .range(["#e0f3f3", "#c6e2e2", "#a6cfdb", "#7fb8cc", "#4a9dbb", "#2173a6", "#0d5792", "#003366", "#001f4d", "#000033"]);

const unemploymenetScale = d3.scaleThreshold()
  .domain([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
  .range(["#e0f3f3", "#c6e2e2", "#a6cfdb", "#7fb8cc", "#4a9dbb", "#2173a6", "#0d5792", "#003366", "#001f4d", "#000033", "00000F"]);

// Define map projection and path generator
const projection = d3.geoNaturalEarth1()
  .scale(153)
  .translate([480, 250]);
const path = d3.geoPath().projection(projection);

function initializeWorldMap() {
  // Select the SVG container
  const svg = d3.select("#world-map-visualization").append("svg")
    .attr("width", "120%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 1060 500")
    .style("background", "none") // Glassmorphism 

  var g = svg.append("g");
  let maxScale = 10;


  var zoomListener = d3.zoom()
    .scaleExtent([0.1, maxScale]) // Set the scale extent for zooming
    .on("zoom", zoomed); // Define zoomed function to handle zoom

  // Apply the zoom listener to the SVG
  svg.call(zoomListener);

  // Zoom function that applies the transformation to the 'g' element
  function zoomed(event) {
    g.attr("transform", event.transform);
  }

  var Tooltip = d3.select("#world-map-visualization")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "transparaent")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("position", "absolute")

  var mouseover = function (d) {
    Tooltip
      .style("opacity", 1)
    d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)
  }
  var mousemove = function (event, d) {
    let populationCount = outcomesMap.get(d.properties.name) || 0;
    let value;
    switch (selectedMetric) {
      case 'inflation':
        // Get inflation rate for the country
        value = inflationMap.get(d.properties.name) + "%" || 0;
        break;
      case 'unemployment':
        // Get unemployment rate for the country
        value = unemploymentMap.get(d.properties.name) + "%";
        break;
      case 'gdp':
        // Get GDP rate for the country
        value = gdpMap.get(d.properties.name) + "%" || 0;
        break;
      case 'students':
        // Get number of students for the country
        value = outcomesMap.get(d.properties.name) || 0;
        break;
      default:
        // Default to number of students if metric is unrecognized
        value = outcomesMap.get(d.properties.name) || 0;
        break;
    }
    if (value == "NaN%" || value == "undefined%")
      value = "Not Available";
    Tooltip
      .html("Country: " + d.properties.name + "<br>" + tooltipText + value)
      .style("left", (event.x - 170) + "px")
      .style("background-color", "rgba(255, 255, 255, 0.25)")
      .style("top", (event.y - 250) + "px")
  }
  var mouseleave = function (d) {
    Tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
  }

  // Reset Zoom Button
  d3.select("#world-map-visualization").append("button")
    .attr("class", "reset-zoom")
    .html('<i class="fas fa-magnifying-glass-minus"></i> Reset Zoom')
    .on("click", function () {
      svg.transition()
        .duration(750)
        .call(zoomListener.transform, d3.zoomIdentity.translate(defaultTranslateX, defaultTranslateY).scale(defaultScale));
    });

  // Changing plotted data to inflation rate button
  d3.select("#world-map-visualization").append("div")
    .attr("class", "select-to-view-text")
    .text("Select a View")

  // Changing plotted data to inflation rate button
  d3.select("#world-map-visualization").append("button")
    .attr("class", "inflation-rate")
    .text("Inflation Rate")
    .on("click", function () { updateMapColor('inflation'); });

  // Changing plotted data to unemploymenet rate button
  d3.select("#world-map-visualization").append("button")
    .attr("class", "unemployment-rate")
    .text("Unemployment Rate")
    .on("click", function () { updateMapColor('unemployment'); });

  // Changing plotted data to gdp rate button
  d3.select("#world-map-visualization").append("button")
    .attr("class", "gdp-rate")
    .text("GDP Growth")
    .on("click", function () { updateMapColor('gdp'); });

  // Changing plotted data to gdp rate button
  d3.select("#world-map-visualization").append("button")
    .attr("class", "no-students-rate")
    .style("background-color", "#0332b5")
    .style("color", "white")
    .text("Number of Students")
    .on("click", function () { updateMapColor('students'); });

  // Loading the geographical data and counting occurrences of each nationality
  Promise.all([
    d3.json("../data/worldmap.geo.json"),
    d3.csv("../data/StudentOutcomesUpdated.csv", function (d) {
      // console.log(+d["Inflation rate"])
      // Count each occurrence of nationality and update the map
      outcomesMap.set(d.Nationality, (outcomesMap.get(d.Nationality) || 0) + 1);
      inflationMap.set(d.Nationality, d["Inflation rate"]);
      gdpMap.set(d.Nationality, Math.abs(d["GDP"]));
      unemploymentMap.set(d.Nationality, d["Unemployment rate"]);
    })
  ])
    .then(function ([world, populationData]) {
      // Apply a modern look to the map paths
      g.selectAll("path")
        .data(world.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", function (d) {
          const populationCount = outcomesMap.get(d.properties.name) || 0;
          return populationCount === 0 ? "#797d8f" : populationScale(populationCount); // Black or distinct color for zero values
        })
        .attr("stroke", "#ffffff80")
        .attr("stroke-width", 0.5)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", function (event, d) {
          // When a country is clicked, pass its name to the updateStudentOutcomesChart function
          const countryName = d.properties.name;
          updateStudentOutcomesChart(countryName);
          handleGenderSelection(countryName);
          handleDebtorSelection(countryName);
          handleScholarshipSelection(countryName);
        });

      // Create a default transform using d3.zoomIdentity
      const defaultTransform = d3.zoomIdentity
        .translate(defaultTranslateX, defaultTranslateY)
        .scale(defaultScale);

      // Apply the default transformation to the SVG group
      g.attr("transform", defaultTransform);

      // white glow effect for the countries
      svg.style("filter", "drop-shadow(0 0 2px white)");
    });

  // Assuming you have a function to map the different metrics to colors
  function updateMapColor(metric) {
    g.selectAll("path")
      .transition() // Smooth transition
      .duration(500)
      .attr("fill", function (d) {
        let value;
        let scale;
        switch (metric) {
          case 'inflation':
            // Get inflation rate for the country
            value = inflationMap.get(d.properties.name) || 0;
            scale = gdpScale;
            selectedMetric = 'inflation';
            tooltipText = "Inflation Rate: ";
            break;
          case 'unemployment':
            // Get unemployment rate for the country
            value = unemploymentMap.get(d.properties.name) || 0;
            scale = unemploymenetScale;
            selectedMetric = 'unemployment';
            tooltipText = "Unemployment Rate: ";
            break;
          case 'gdp':
            // Get GDP rate for the country
            value = Math.abs(gdpMap.get(d.properties.name)) || 0;
            scale = gdpScale;
            selectedMetric = 'gdp';
            tooltipText = "GDP: ";
            break;
          case 'students':
            // Get number of students for the country
            value = outcomesMap.get(d.properties.name) || 0;
            scale = populationScale;
            selectedMetric = 'students';
            tooltipText = "Number of Students: ";
            break;
          default:
            // Default to number of students if metric is unrecognized
            value = outcomesMap.get(d.properties.name) || 0;
            break;
        }
        // Event handlers for buttons
        d3.select(".inflation-rate").style("background-color", selectedMetric == "inflation" ? "#266ae6" : "rgba(255, 255, 255, 0.25)").style("color", selectedMetric == "inflation" ? "white" : "black")
        d3.select(".unemployment-rate").style("background-color", selectedMetric == "unemployment" ? "#0332b5" : "rgba(255, 255, 255, 0.25)").style("color", selectedMetric == "unemployment" ? "white" : "black")
        d3.select(".gdp-rate").style("background-color", selectedMetric == "gdp" ? "#266ae6" : "rgba(255, 255, 255, 0.25)").style("color", selectedMetric == "gdp" ? "white" : "black")
        d3.select(".no-students-rate").style("background-color", selectedMetric == "students" ? "#0332b5" : "rgba(255, 255, 255, 0.25)").style("color", selectedMetric == "students" ? "white" : "black")

        // Use your populationScale or a different scale based on the metric
        return value === 0 ? "#797d8f" : scale(value);
      });
  }
}

initializeWorldMap();
// Make the function globally accessible
window.initializeWorldMap = initializeWorldMap;

console.log(unemploymentMap)
