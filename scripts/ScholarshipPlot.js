// ScholarshipPlot.js
// Visualizes the distribution of scholarship holders among the students

// Global variables
let originalScholarshipData = [];
let excludedCountriesForScholarship = [];
let lastClickedTimeScholarship = 0;
const doubleClickThresholdScholarship = 300; // milliseconds


// Processes debtor data, filtering based on excluded countries
function processScholarshipDataForChart(excludedCountries) {
    const scholarshipCounts = { 'Yes': 0, 'No': 0 };
    originalScholarshipData.forEach(d => {
        if (!excludedCountries.includes(d.Nationality)) {
            if (d.Scholarship === "1") scholarshipCounts['Yes'] += 1;
            else if (d.Scholarship === "0") scholarshipCounts['No'] += 1;
        }
    });
    return Object.entries(scholarshipCounts).map(([status, count]) => ({ status, count }));
}

// Updates and redraws the scholarship chart with current data and filters
function updateScholarshipChart() {
    if (window.currentChartSelection !== 'scholarship') {
        return; // Exit without drawing
    }
    const processedData = processScholarshipDataForChart(excludedCountriesForScholarship);
    drawScholarshipChart(processedData);
}

// Initial data load and setup
export function loadAndProcessScholarshipData() {
    d3.csv('../data/StudentOutcomesUpdated.csv').then(function (data) {
        originalScholarshipData = data;
        updateScholarshipChart();
    });
}

// Handles scholarship chart updates based on country selection
export function handleScholarshipSelection(clickedCountryName) {
    const currentTime = Date.now();
    if (currentTime - lastClickedTimeScholarship < doubleClickThresholdScholarship) {
        // For double-click: focus on a single country
        excludedCountriesForScholarship = originalScholarshipData.map(d => d.Nationality).filter(n => n !== clickedCountryName);
    } else {
        // For single-click: toggle country exclusion
        const index = excludedCountriesForScholarship.indexOf(clickedCountryName);
        if (index === -1) excludedCountriesForScholarship.push(clickedCountryName);
        else excludedCountriesForScholarship.splice(index, 1);
    }
    updateScholarshipChart(); // Update the chart
    lastClickedTimeScholarship = currentTime; // Update lastClickedTime for next click detection
}

// Function to Reset the chart
function resetScholarshipData() {
    excludedCountriesForScholarship = []; //Reset the excluded countries array
    loadAndProcessScholarshipData();
}

export { resetScholarshipData }
window.resetScholarshipData = resetScholarshipData

// If reset button is clicked, calls the reset function
document.getElementById('resetChart').addEventListener('click', function () {
    resetScholarshipData();
});

// Referenced Lab 3 Solutions for this function of drawing donut charts
function drawScholarshipChart(data) {
    console.log(data);

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
    const color = d3.scaleOrdinal().domain(["Yes", "No"])
        .range(["#f99059", "#7434ca"]); // Adjust the range if needed   

    // Pie generator
    const pie = d3.pie().value(d => d.count)(data);

    // Arc generator for paths
    const arc = d3.arc().innerRadius(50).outerRadius(radius);

    // Arc generator for labels
    const labelArc = d3.arc().outerRadius(radius - 10).innerRadius(radius - 10);

    // Data binding for arcs
    const arcs = svg.selectAll("path")
        .data(pie, d => d.data.status);

    // Enter selection for arcs
    arcs.enter().append("path")
        .attr("fill", d => color(d.data.status))
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

    // applying the filter to the center circle for the money icon
    svg.selectAll(".holding-dollar")
        .data([data])
        .enter()
        .append("circle")
        .attr("class", "holding-dollar")
        .attr("r", radius * 0.45) // Radius of the inner circle
        .attr("fill", "white")
        .style("filter", "url(#drop-shadow)");

    // Scholarship icon
    svg.selectAll(".fa-hand-holding-dollar")
        .data([data])
        .enter()
        .append("text")
        .attr("class", "fa-hand-holding-dollar")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "FontAwesome")
        .attr("font-size", radius * 0.3)
        .attr("fill", "#78798d")
        .text("\uf4c0"); // Unicode reference for the "hand-holding-dollar" icon

    // Legend dimensions and spacing
    const legendRectSize = 12;
    const legendSpacing = 4;

    // Data for legend
    const legendData = [
        { label: "Holder", color: "#f99059" },
        { label: "Non-Holder", color: "#7434ca" }
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
    const totalScholarCount = data.reduce((acc, cur) => acc + cur.count, 0);

    // Binding the data to groups, which will contain both the rectangles and text for labels
    const labelGroups = svg.selectAll(".label-group")
        .data(pie, d => d.data.status);

    // Enter selection for the groups, appending a new group for each piece of data
    const labelGroupEnter = labelGroups.enter().append("g")
        .attr("class", "label-group")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`); // Position the group at the centroid of each arc

    // Append rectangles for label backgrounds within the groups
    labelGroupEnter.append("rect")
        .attr("class", "label-box")
        .attr('x', -20) // Centered on the group's centroid
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
        .text(d => `${d3.format(".0f")(d.data.count / totalScholarCount * 100)}%`);

    // Update selection to handle updates smoothly
    labelGroups.select(".label-box")
        .transition().duration(750)
        .style("opacity", 1);

    labelGroups.select(".label")
        .transition().duration(750)
        .text(d => `${d3.format(".0f")(d.data.count / totalScholarCount * 100)}%`)
        .style("opacity", 1);

    // Handle the exit selection - for data pieces that are no longer present
    labelGroups.exit().remove();
}