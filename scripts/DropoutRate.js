// DropoutRate.js
// This script visualizes area under line chart for dropout rate of age groups

// Set the dimensions and margins of the graph
const margin = { top: 10, right: 5, bottom: 40, left: 50 },
    width = 700 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3.select("#dropoutrate")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom * 1.5)
    .append("g")
    .attr("transform", `translate(${margin.left * 1.2},${margin.top})`);

// Read the data
d3.csv("data/ageVsdropoutRate.csv").then(data => {

    // Format the data by splitting the 'Age Group' and averaging the range for the x-axis
    data.forEach(function (d) {
        const range = d['Age Group'].split("-").map(Number);
        d['Age Group'] = (range[0] + range[1]) / 2;
        d['Dropout Rate'] = +d['Dropout Rate'];
    });

    // Add X axis
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d['Age Group']))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Text label for the x axis
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.top + 30})`)
        .style("text-anchor", "middle")
        .text("Age Group");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -50)
        .attr("x", -60)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Dropout Rate (%)");

    // Modify the Y-axis to display as percentage and reduce ticks
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d['Dropout Rate'])])
        .range([height, 0]);

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%"))) // Use format for percentage and limit ticks

    // Style Y-axis and its ticks
    yAxis.selectAll(".domain") // Select the Y axis line
        .attr("stroke", "grey"); // Change axis line color to grey

    // Add a gradient for the area fill below the line
    const defs = svg.append('defs');

    const gradient = defs.append('linearGradient')
        .attr('id', 'area-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0)
        .attr('y1', y(0))
        .attr('x2', 0)
        .attr('y2', y(d3.max(data, d => d['Dropout Rate'])))
        .selectAll('stop')
        .data([
            { offset: '0%', color: 'orange', opacity: 0 },
            { offset: '76%', color: 'gold', opacity: 0.4 }
        ])
        .enter().append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color)
        .attr('stop-opacity', d => d.opacity);

    // Add the line
    const line = d3.line()
        .x(d => x(d['Age Group']))
        .y(d => y(d['Dropout Rate']))
        .curve(d3.curveMonotoneX); // this makes the line smoother

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("background", "fill")
        .attr("stroke", "#f99059")
        .attr("stroke-width", 2)
        .attr("d", line);


    // Add the area fill below the line
    svg.append("path")
        .datum(data)
        .attr("fill", "url(#area-gradient)")
        .attr("d", d3.area()
            .x(d => x(d['Age Group']))
            .y0(height)
            .y1(d => y(d['Dropout Rate']))
            .curve(d3.curveMonotoneX)
        );

    yAxis.selectAll(".tick line")
        .attr("stroke", "grey") // Change tick line color to grey
        .attr("stroke-dasharray", "2,2") // Set stroke-dasharray for dotted lines
        .raise(); // Move the dotted lines to the front


    // Create a rect on top of the svg area: this rectangle recovers mouse position
    const rect = svg.append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    // Create a line for tooltip
    const tooltipLine = svg.append("line")
        .attr("class", "tooltip-line")
        .attr("stroke", "grey")
        .attr("stroke-width", 1)
        .style("opacity", 0);

    // Function to handle mouseover, mousemove, and mouseout events
    function mouseover() {
        focus.style("opacity", 1);
        focusText.style("opacity", 1);
        tooltipRect.style("opacity", 1);
        tooltipText.style("opacity", 1);
    }

    function mousemove(event) {
        // recover coordinate we need
        const x0 = x.invert(d3.pointer(event)[0]);
        const bisect = d3.bisector(d => d['Age Group']).left;
        const i = bisect(data, x0, 1);
        const selectedData = data[i];
        focus
            .attr("cx", x(selectedData['Age Group']))
            .attr("cy", y(selectedData['Dropout Rate']));
        tooltipRect
            .attr("x", x(selectedData['Age Group']) - 15)
            .attr("y", y(selectedData['Dropout Rate']) - 30);
        tooltipText
            .html(d3.format(".0%")(selectedData['Dropout Rate']))
            .attr("x", x(selectedData['Age Group']) - 10)
            .attr("y", y(selectedData['Dropout Rate']) - 15);
        tooltipLine
            .attr("x1", x(selectedData['Age Group']))
            .attr("y1", y(selectedData['Dropout Rate']))
            .attr("x2", x(selectedData['Age Group']))
            .attr("y2", height)
            .style("opacity", 1);
    }

    function mouseout() {
        focus.style("opacity", 0);
        focusText.style("opacity", 0);
        tooltipRect.style("opacity", 0);
        tooltipText.style("opacity", 0);
        tooltipLine.style("opacity", 0);
    }

    // Add rectangle for tooltip
    const tooltipRect = svg.append("rect")
        .attr("class", "tooltip-rect")
        .attr("width", 30)
        .attr("height", 20)
        .attr("fill", "#272d31")
        .attr("rx", 5) // rounded corners
        .style("opacity", 0);

    // Add text for tooltip
    const tooltipText = svg.append("text")
        .attr("class", "tooltip-text")
        .style("font-size", "10px")
        .style("fill", "white")
        .style("opacity", 0);

    // Add focus dot
    const focus = svg.append("circle")
        .attr("class", "focus")
        .attr("r", 5)
        .attr("fill", "#e3ba9d")
        .style("opacity", 0);

    // Add focus text
    const focusText = svg.append("text")
        .attr("class", "focus-text")
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle")
        .style("font-size", "10px")
        .style("opacity", 0);
});
