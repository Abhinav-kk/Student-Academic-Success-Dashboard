// OutcomesChar.js
// This script visualizes the student outcomes

let originalData = [];

// Global variables to hold percentages for the labels
let dropoutRate = 0;
let graduateRate = 0;
let enrolledRate = 0;

// Function to load and process the original data
function loadAndProcessData() {
  d3.csv('../data/StudentOutcomesUpdated.csv').then(function (data) {

    // Extract and compute the necessary statistics
    let totalStudents = data.length;
    let totalCountries = d3.rollup(data, v => v.length, d => d.Nationality).size;

    calculateDropoutToGraduateRatio(data)
    calculateMeanAgeEnrollment(data)

    // Update the HTML elements with the stats
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalCountries').textContent = totalCountries;
    // Process and store the original data
    originalData = processDataForChart(data);
    // Draw the chart with the original data
    drawDonutChart(originalData);
  });
}

/* Start of At a glance tiles data processing */

// Function to calculate the dropout to graduate ratio
function calculateDropoutToGraduateRatio(data) {
  // Count the number of dropouts and graduates
  let dropoutCount = 0;
  let graduateCount = 0;
  data.forEach(d => {
    if (d.Target === "Dropout") {
      dropoutCount++;
    } else if (d.Target === "Graduate") {
      graduateCount++;
    }
  });

  // Calculate the ratio
  let ratio = (dropoutCount / graduateCount) * 100; // Multiply by 100 to convert to percentage

  // Update the HTML element with the ratio
  document.getElementById('dropoutGraduateRatio').textContent = ratio.toFixed(2) + "%";
}

// Function to calculate the mean age at enrollment
function calculateMeanAgeEnrollment(data) {
  let totalAge = data.reduce((acc, d) => acc + parseInt(d['Age at enrollment']), 0);
  let meanAge = totalAge / data.length;

  // Update the HTML element with the mean age
  document.getElementById('meanAgeEnrollment').textContent = meanAge.toFixed(2);
}

/* End of At a glance tiles data processing */

// initiate data loading and chart drawing
loadAndProcessData();

// Global list to keep track of excluded countries
let excludedCountries = [];


// Function to Reset the chart
function resetOutcome() {
  excludedCountries = []; //Reset the excluded countries array
  loadAndProcessData();
  updateChartTitle(); //Reset the title
}

// Attach to global variables
window.resetOutcome = resetOutcome

document.getElementById('resetChart').addEventListener('click', function () {
  excludedCountries = [];
  loadAndProcessData();
  updateChartTitle();
});

let lastClickedTime = 0;
const doubleClickThreshold = 300; // milliseconds

// Function to update the student outcomes chart based on the clicked country
export function updateStudentOutcomesChart(clickedCountryName) {
  const currentTime = Date.now();

  // Check if it's a double-click
  if (currentTime - lastClickedTime < doubleClickThreshold) {
    // Double-click detected: Show only this country's data
    d3.csv('../data/StudentOutcomesUpdated.csv').then(function (data) {

      const specificCountryData = data.filter(d => d.Nationality === clickedCountryName);
      const processedData = processDataForChart(specificCountryData);

      calculateDropoutToGraduateRatio(specificCountryData)
      calculateMeanAgeEnrollment(specificCountryData)

      // Extract and compute the necessary statistics
      let totalStudents = specificCountryData.length;
      let totalCountries = 1

      // Update the HTML elements with the stats
      document.getElementById('totalStudents').textContent = totalStudents;
      document.getElementById('totalCountries').textContent = totalCountries;
      drawDonutChart(processedData);
      // Update to show this is focused on one country
      updateChartTitle(clickedCountryName, true);
    });
  } else {
    // Single-click logic: Toggle country exclusion
    const index = excludedCountries.indexOf(clickedCountryName);
    if (index === -1) {
      // Not currently excluded, so add to the list
      excludedCountries.push(clickedCountryName);
    } else {
      // Currently excluded, so remove from the list
      excludedCountries.splice(index, 1);
    }

    // Update the chart with the new data excluding the selected countries
    d3.csv('../data/StudentOutcomesUpdated.csv').then(function (data) {
      const filteredData = data.filter(d => !excludedCountries.includes(d.Nationality));
      const processedData = processDataForChart(filteredData);

      calculateDropoutToGraduateRatio(filteredData)
      calculateMeanAgeEnrollment(filteredData)

      // Extract and compute the necessary statistics
      let totalStudents = filteredData.length;
      let totalCountries = d3.rollup(filteredData, v => v.length, d => d.Nationality).size;

      // Update the HTML elements with the stats
      document.getElementById('totalStudents').textContent = totalStudents;
      document.getElementById('totalCountries').textContent = totalCountries;
      drawDonutChart(processedData);
      updateChartTitle(); // Update the title based on current exclusions
    });
  }

  // Update the last clicked time
  lastClickedTime = currentTime;
}

function updateChartTitle(clickedCountry = null, isDoubleClick = false) {
  let titleText = "Demographics & Socio-Economic";

  if (isDoubleClick && clickedCountry) {
    // Focus on a specific country
    titleText += `: ${clickedCountry}`;
  } else if (excludedCountries.length === 1 && excludedCountries.includes("Portugal")) {
    // Special case for excluding Portugal, it means showing international students
    titleText += " (International Students)";
  } else if (excludedCountries.length === 1) {
    // One country excluded
    titleText += ` (except ${excludedCountries[0]})`;
  } else if (excludedCountries.length > 1) {
    // Multiple countries excluded, show the first one and second and "+ more" to indicate there are additional exclusions
    titleText += ` (except ${excludedCountries[0]}, ${excludedCountries[1]} + more)`;
  }

  // Directly update the text of the h2 element with ID "worldchart-title"
  document.getElementById('worldchart-title').innerText = titleText;
}

// Referenced Lab 3 Solutions for this function of drawing donut charts
function drawDonutChart(data) {
  // Setup dimensions and SVG
  const width = 300, height = 200;
  const radius = Math.min(width, height) / 2 - 20;
  let svg = d3.select("#outcomes1").select("svg");

  // If the SVG doesn't exist, creates it
  if (svg.empty()) {
    svg = d3.select("#outcomes1").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`)

  } else {
    // If it exists, just select the group inside
    svg = svg.select("g");
  }

  // Color scale
  const color = d3.scaleOrdinal().domain(data.map(d => d.outcome))
    .range(["#ec5482", "#06d79b", "#7033cb"]);

  // Pie generator
  const pie = d3.pie().value(d => d.count)(data);

  // Arc generator for paths
  const arc = d3.arc().innerRadius(100).outerRadius(radius);

  // Arc generator for labels
  const labelArc = d3.arc().outerRadius(radius + 10).innerRadius(radius + 20);

  // Data binding for arcs
  const arcs = svg.selectAll("path")
    .data(pie, d => d.data.outcome);

  // Enter selection for arcs
  arcs.enter().append("path")
    .attr("fill", d => color(d.data.outcome))
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

  // applying the filter to the center circle for the graduation icon
  svg.selectAll(".gender-icon")
    .data([data])
    .enter()
    .append("circle")
    .attr("class", "gender-icon")
    .attr("r", radius * 0.7) // Radius of the inner circle
    .attr("fill", "white")
    .style("filter", "url(#drop-shadow)");

  // graduation icon
  svg.selectAll(".fa-graduation-cap")
    .data([data])
    .enter()
    .append("text")
    .attr("class", "fa-graduation-cap")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-family", "FontAwesome")
    .attr("font-size", radius * 0.5)
    .attr("fill", "#78798d")
    .text(d => "\uf19d");
  // Data binding for labels
  const labels = svg.selectAll("text.label")
    .data(pie, d => d.data.outcome);


  // Legend dimensions and spacing
  const legendRectSize = 12;
  const legendSpacing = 4;
  const bottomEdge = height - legendRectSize;

  // Data for legend
  const legendData = [
    { label: "Dropout", color: "#ec5482" },
    { label: "Enrolled", color: "#7033cb" },
    { label: "Graduate", color: "#06d79b" }
  ];

  // Calculate the total width needed for the legend
  const legendWidth = legendData.length * (legendRectSize + legendSpacing * 15);

  // Check if the legend already exists
  let legendGroup = svg.select('.legend-group');

  if (legendGroup.empty()) {
    // Legend does not exist, so create it
    // Append a g element to hold the legend items
    const legendGroup = svg.append('g')
      .attr('class', 'legend-group')
      .attr('transform', `translate(${(-legendWidth / 2)},${svg.attr("height") + legendRectSize * 9})`) // Position at the bottom of the SVG

    // Append g elements for each legend item
    const legend = legendGroup.selectAll('.legend')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function (d, i) {
        const horz = i * (legendRectSize + legendSpacing * 15); // Space out legends horizontally
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
      .attr('alignment-baseline', 'middle');
  }

  // Calculate the total count for percentage calculations
  const totalCount = data.reduce((acc, cur) => acc + cur.count, 0);

  // Create label groups without transitions for the initial draw
  const labelGroups = svg.selectAll(".label-group")
    .data(pie, d => d.data.outcome);

  // Enter selection for label groups
  const labelGroupEnter = labelGroups.enter().append("g")
    .attr("class", "label-group");


  // Initially create the label boxes and text without any transition.
  labelGroupEnter.append("rect")
    .attr("class", "label-box")
    .attr("x", d => labelArc.centroid(d)[0] - 20)
    .attr("y", d => labelArc.centroid(d)[1] - 10)
    .attr("width", 40)
    .attr("height", 20)
    .attr("rx", 5)
    .style("fill", "#24292d");

  labelGroupEnter.append("text")
    .attr("class", "label")
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("dy", "0.35em")
    .style("text-anchor", "middle")
    .style("fill", "#fff")
    .text(d => `${d3.format(".0f")(d.data.count / totalCount * 100)}%`);

  // Append rectangles for label background based on filter
  labelGroupEnter.append("rect")
    .attr("class", "label-box")
    .style("fill", "#24292d")
    .style("opacity", 0); // Initially set to transparent

  // Append text for label based on filter
  labelGroupEnter.append("text")
    .attr("class", "label")
    .style("fill", "#fff")
    .style("text-anchor", "middle")
    .style("opacity", 0); // Initially set to transparent

  // Update selection for label groups
  labelGroups.select(".label-box")
    .transition().duration(750)
    .attr("x", d => labelArc.centroid(d)[0] - 20)
    .attr("y", d => labelArc.centroid(d)[1] - 10)
    .attr("width", 40)
    .attr("height", 20)
    .attr("rx", 5)
    .style("opacity", 1); // Fade in the box

  labelGroups.select(".label")
    .transition().duration(750)
    .attr("transform", d => `translate(${labelArc.centroid(d)})`)
    .attr("dy", "0.35em") // Vertical alignment
    .text(d => `${d3.format(".0f")(d.data.count / totalCount * 100)}%`)
    .style("opacity", 1); // Fade in the text

  // Remove the exit selection
  labelGroups.exit().remove();
}

function processDataForChart(data) {
  // Reset counts each time data is processed
  const outcomeCounts = {
    'Dropout': 0,
    'Graduate': 0,
    'Enrolled': 0
  };

  // Count occurrences of each outcome
  data.forEach(d => {
    if (outcomeCounts.hasOwnProperty(d.Target)) {
      outcomeCounts[d.Target] += 1;
    }
  });

  // Calculate total students for percentage calculations
  const totalStudents = data.length;
  // Update global percentage variables
  dropoutRate = outcomeCounts['Dropout'] / totalStudents * 100;
  graduateRate = outcomeCounts['Graduate'] / totalStudents * 100;
  enrolledRate = outcomeCounts['Enrolled'] / totalStudents * 100;

  // Transform counts into an array of objects
  return Object.keys(outcomeCounts).map(key => ({
    outcome: key,
    count: outcomeCounts[key]
  }));
}