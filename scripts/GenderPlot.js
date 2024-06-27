// GenderPlot.js
// This script visualizes the gender distribution of the students

// Global variables
let originalGenderData = [];
let excludedCountriesForGender = [];
let lastClickedTime = 0;
const doubleClickThreshold = 300; // milliseconds

// Processes gender data, filtering based on excluded countries
function processGenderDataForChart(excludedCountries) {
    const genderCounts = { 'Male': 0, 'Female': 0 };
    originalGenderData.forEach(d => {
        if (!excludedCountries.includes(d.Nationality)) {
            if (d.Gender === "1") genderCounts['Male'] += 1;
            else if (d.Gender === "0") genderCounts['Female'] += 1;
        }
    });
    return Object.entries(genderCounts).map(([gender, count]) => ({ gender, count }));
}


function updateGenderChart() {
    // Ensure this function only draws the chart if the current selection matches
    if (window.currentChartSelection !== 'gender') {
        return; // Exit without drawing
    }
    const processedData = processGenderDataForChart(excludedCountriesForGender);
    drawGenderChart(processedData);
}

// Handles gender chart updates based on country selection
export function handleGenderSelection(clickedCountryName) {
    const currentTime = Date.now();
    if (currentTime - lastClickedTime < doubleClickThreshold) {
        // For double-click: focus on a single country
        excludedCountriesForGender = originalGenderData.map(d => d.Nationality).filter(n => n !== clickedCountryName);
    } else {
        // For single-click: toggle country exclusion
        const index = excludedCountriesForGender.indexOf(clickedCountryName);
        if (index === -1) excludedCountriesForGender.push(clickedCountryName);
        else excludedCountriesForGender.splice(index, 1);
    }
    updateGenderChart();
    // Update lastClickedTime for next click detection
    lastClickedTime = currentTime;
}

// Initial data load and setup
function loadAndProcessGenderData() {
    d3.csv('../data/StudentOutcomesUpdated.csv').then(function (data) {
        originalGenderData = data;
        // Initial chart update
        updateGenderChart();
    });
}

export { loadAndProcessGenderData };

// Function to Reset the chart
function resetGenderData() {
    excludedCountriesForGender = []; //Reset the excluded countries array
    loadAndProcessGenderData();
}

export { resetGenderData }

window.resetGenderData = resetGenderData

// If reset button is clicked, calls the reset function
document.getElementById('resetChart').addEventListener('click', function () {
    resetGenderData();
});

// Referenced Lab 3 Soultions for this function of drawing donut charts
function drawGenderChart(data) {
    // Setup dimensions and SVG
    const width = 200, height = 200;
    const radius = Math.min(width, height) / 2 - 40;
    let svg = d3.select("#gender-plot").select("svg");

    // If the SVG doesn't exist, creates it
    if (svg.empty()) {
        svg = d3.select("#gender-plot").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);
    } else {
        // If it exists, just select the group inside
        svg = svg.select("g");
    }

    // Color scale
    const color = d3.scaleOrdinal().domain(["Male", "Female"])
        .range(["#f99059", "#7434ca"]);

    // Pie generator
    const pie = d3.pie().value(d => d.count)(data);

    // Arc generator for paths
    const arc = d3.arc().innerRadius(50).outerRadius(radius);

    // Arc generator for labels
    const labelArc = d3.arc().outerRadius(radius - 10).innerRadius(radius - 10);

    // Data binding for arcs
    const arcs = svg.selectAll("path")
        .data(pie, d => d.data.gender);

    // Enter selection for arcs
    arcs.enter().append("path")
        .attr("fill", d => color(d.data.gender))
        .attr("d", arc)
        .each(function (d) { this._current = d; }); // Store the initial angles

    // Update selection for arcs
    arcs.transition().duration(750)
        .attrTween("d", function (a) {
            const i = d3.interpolate(this._current, a);
            this._current = i(0);
            return (t) => arc(i(t));
        });

    // Exit selection for arcs
    arcs.exit().transition().duration(750)
        .attrTween("d", function (a) {
            const i = d3.interpolate(this._current, { startAngle: Math.PI * 2, endAngle: Math.PI * 2 });
            return (t) => arc(i(t));
        })
        .remove();


    // Place the percentage on the arc
    svg.selectAll('.percent-label').remove(); // Clear any previous percentage labels
    const percentLabel = svg.append("text")
        .datum(data.find(d => d.gender === "Male"))
        .attr("class", "percent-label")
        .attr("text-anchor", "middle")
        .attr("dy", "-1.2em")
        .style("font-size", "0px")
        .style("fill", "#555");

    // animated the number for a smooth transition
    percentLabel.transition().duration(750)
        .tween("text", function (d) {
            const i = d3.interpolate(0, d.count / totalGenderCount * 100);
            return function (t) {
                this.textContent = i(t).toFixed(1) + "%";
            };
        });

    // Position the percentage text in the middle of the Male arc
    percentLabel.attr("transform", function (d) {
        return "translate(" + labelArc.centroid(d) + ")";
    });

    // Adding a filter for the drop shadow effect
    svg.append("defs")
        .append("filter")
        .attr("id", "drop-shadow")
        .attr("height", "130%")
        .append("feDropShadow")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("stdDeviation", 2)
        .attr("flood-color", "#6c757d");

    // applying the filter to the center circle for the gender icon
    svg.selectAll(".gender-icon")
        .data([data])
        .enter()
        .append("circle")
        .attr("class", "gender-icon")
        .attr("r", radius * 0.45) // Radius of the inner circle
        .attr("fill", "white")
        .style("filter", "url(#drop-shadow)");

    // gender icon
    svg.selectAll(".fa-venus-mars")
        .data([data])
        .enter()
        .append("text")
        .attr("class", "fa-venus-mars")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "FontAwesome")
        .attr("font-size", radius * 0.3)
        .attr("fill", "#78798d")
        .text(d => "\uf228");
    // Data binding for labels
    const labels = svg.selectAll("text.label")
        .data(pie, d => d.data.gender);


    // Legend dimensions and spacing
    const legendRectSize = 12;
    const legendSpacing = 4;

    // Data for legend
    const legendData = [
        { label: "Male", color: "#f99059" },
        { label: "Female", color: "#7434ca" }
    ];

    // Calculate the total width needed for the legend
    const legendWidth = legendData.length * (legendRectSize + legendSpacing);

    // Check if the legend already exists
    let legendGroup = svg.select('.legend-group');

    if (legendGroup.empty()) {
        // Append a g element to hold the legend items
        const legendGroup = svg.append('g')
            .attr('class', 'legend-group')
            .attr('transform', `translate(${(-legendWidth / 2) - (legendSpacing * 10)},${radius + 25})`); // Y offset to move below the donut chart

        // Append g elements for each legend item
        const legend = legendGroup.selectAll('.legend')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', function (d, i) {
                const horz = i * (legendRectSize + legendSpacing * 15);
                return `translate(${horz},0)`;
            });

        // Legend Icons
        legend.append('circle')
            .attr('cx', legendRectSize / 2)
            .attr('cy', legendRectSize / 2)
            .attr('r', legendRectSize / 2)
            .style('fill', d => d.color)
            .style('stroke', d => d.color);

        // Append text to each legend item
        legend.append('text')
            .attr('x', legendRectSize + legendSpacing * 2)
            .attr('y', legendRectSize / 2)
            .text(d => d.label)
            .attr('class', 'legend-text')
            .style('text-anchor', 'start')
            .attr('alignment-baseline', 'central');
    }

    // Calculate the total count for percentage calculations
    const totalGenderCount = data.reduce((acc, cur) => acc + cur.count, 0);

    // Binding the data to groups, which will contain both the rectangles and text for labels
    const labelGroups = svg.selectAll(".label-group")
        .data(pie, d => d.data.gender);

    // Enter selection for the groups, appending a new group for each piece of data
    const labelGroupEnter = labelGroups.enter().append("g")
        .attr("class", "label-group")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`); // Position the group at the centroid of each arc

    // Append rectangles for label backgrounds within the groups
    labelGroupEnter.append("rect")
        .attr("class", "label-box")
        .attr('x', -20)
        .attr('y', -10)
        .attr('width', 40)
        .attr('height', 20)
        .attr('rx', 5)
        .style('fill', '#24292d');

    // Append text for labels within the groups
    labelGroupEnter.append("text")
        .attr("class", "label")
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .style("fill", "#fff")
        .text(d => `${d3.format(".0f")(d.data.count / totalGenderCount * 100)}%`);

    // Update selection to handle updates smoothly
    labelGroups.select(".label-box")
        .transition().duration(750)
        .style("opacity", 1);

    labelGroups.select(".label")
        .transition().duration(750)
        .text(d => `${d3.format(".0f")(d.data.count / totalGenderCount * 100)}%`)
        .style("opacity", 1);

    // Handle the exit selection - for data pieces that are no longer present
    labelGroups.exit().remove();
}

