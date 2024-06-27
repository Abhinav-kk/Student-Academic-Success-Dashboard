// ViolinChart.js
// Visualizes the distribution of student outcomes

var margin = { top: 10, right: 5, bottom: 40, left: 50 },
    width = 450 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#grade1")
    .append("svg")
    .attr("width", width * 1.2 + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom * 1.5)
    .append("g")
    .attr("transform", "translate(" + margin.left * 1.2 + "," + margin.top + ")");

var gradeGroups, ageGroups, x, y, agey;

d3.csv("../data/StudentOutcomesUpdated.csv").then(function (data) {
    // Build and Show the X scale. It is a band scale like for a boxplot.
    x = d3.scaleBand()
        .range([0, width])
        .domain(["Enrolled", "Dropout", "Graduate"])
        .padding(0.05);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Build and Show the Y scale
    y = d3.scaleLinear()
        .domain([95, 190])
        .range([height, 0]);
    svg.append("g")
        .attr("class", "y-axis-values")
        .call(d3.axisLeft(y));

    agey = d3.scaleLinear()
        .domain([17, 70])
        .range([height, 0]);

    gradeGroups = Array.from(d3.group(data, d => d.Target), ([key, value]) => {
        let densities = kernelDensityEstimator(kernelEpanechnikov(.2), y.ticks(50))(value.map(d => +d['Admission grade']));
        return { key, densities };
    });

    ageGroups = Array.from(d3.group(data, d => d.Target), ([key, value]) => {
        let densities = kernelDensityEstimator(kernelEpanechnikov(.2), agey.ticks(50))(value.map(d => +d['Age at enrollment']));
        return { key, densities };
    });

    // Find the maximum density value to scale the violin width
    let maxDensity = d3.max(gradeGroups, d => d3.max(d.densities, dd => dd[1]));

    // The maximum width of a violin must be x.bandwidth
    var xNum = d3.scaleLinear()
        .range([0, x.bandwidth()])
        .domain([-maxDensity, maxDensity]);

    // Add the violin shapes to the SVG
    svg.selectAll("myViolin")
        .data(gradeGroups)
        .join("g")
        .attr("class", "myViolin")
        .attr("transform", d => "translate(" + x(d.key) + ",0)")
        .append("path")
        .datum(d => d.densities)
        .style("stroke", "none")
        .style("fill", "#69b3a2")
        .attr("d", d3.area()
            .x0(d => xNum(-d[1]))
            .x1(d => xNum(d[1]))
            .y(d => y(d[0]))
            .curve(d3.curveCatmullRom)
        );

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Target");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -55)
        .attr("x", -60)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Admission Grade");

    updateMapColor('grade');
});

// Kernel density estimator function is unchanged
function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map(function (x) {
            return [x, d3.mean(V, v => kernel(x - v))];
        });
    };
}
function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

// Changing plotted data to inflation rate button
d3.select("#grade1").append("div")
    .attr("class", "select-to-view-text")
    .text("Select a View")

// Changing plotted data to inflation rate button
d3.select("#grade1").append("button")
    .attr("class", "inflation-rate age")
    .text("Age")
    .on("click", function () { updateMapColor('age'); });

// Changing plotted data to unemploymenet rate button
d3.select("#grade1").append("button")
    .attr("class", "unemployment-rate grade")
    .text("Grade")
    .on("click", function () { updateMapColor('grade'); });

function updateMapColor(metric) {
    var selectedMetric = "";
    switch (metric) {
        case 'age':
            selectedMetric = 'age';
            renderAge();
            break;
        case 'grade':
            selectedMetric = 'grade';
            renderGrade();
            break;
        default:
            // Default to number of students if metric is unrecognized
            value = ageMap.get(d.properties.name) || 0;
            break;
    }
    // Event handlers for buttons
    d3.select(".age").style("background-color", selectedMetric == "age" ? "#266ae6" : "rgba(255, 255, 255, 0.25)").style("color", selectedMetric == "age" ? "white" : "black")
    d3.select(".grade").style("background-color", selectedMetric == "grade" ? "#0332b5" : "rgba(255, 255, 255, 0.25)").style("color", selectedMetric == "grade" ? "white" : "black")
}

function renderAge() {
    // Find the maximum density value to scale the violin width
    let maxDensity = d3.max(ageGroups, d => d3.max(d.densities, dd => dd[1]));

    // The maximum width of a violin must be x.bandwidth
    var xNum = d3.scaleLinear()
        .range([0, x.bandwidth()])
        .domain([-maxDensity, maxDensity]);

    svg.selectAll("g.myViolin").remove();
    svg.select(".x.label").remove();
    svg.select(".y.label").remove();
    svg.select(".y-axis-values").call(d3.axisLeft(agey));

    // Add the violin shapes to the SVG
    svg.selectAll("myViolin")
        .data(ageGroups)
        .join("g")
        .attr("class", "myViolin")
        .attr("transform", d => "translate(" + x(d.key) + ",0)")
        .append("path")
        .datum(d => d.densities)
        .style("stroke", "none")
        .style("fill", "#69b3a2")
        .attr("d", d3.area()
            .x0(d => xNum(-d[1]))
            .x1(d => xNum(d[1]))
            .y(d => agey(d[0]))
            .curve(d3.curveCatmullRom)
        );

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Target");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -55)
        .attr("x", -60)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Age At Enrollment");
}

function renderGrade() {
    // Find the maximum density value to scale the violin width
    let maxDensity = d3.max(gradeGroups, d => d3.max(d.densities, dd => dd[1]));

    // The maximum width of a violin must be x.bandwidth
    var xNum = d3.scaleLinear()
        .range([0, x.bandwidth()])
        .domain([-maxDensity, maxDensity]);

    svg.selectAll("g.myViolin").remove();
    svg.select(".x.label").remove();
    svg.select(".y.label").remove();
    svg.select(".y-axis-values").call(d3.axisLeft(y));
    // Add the violin shapes to the SVG
    svg.selectAll("myViolin")
        .data(gradeGroups)
        .join("g")
        .attr("class", "myViolin")
        .attr("transform", d => "translate(" + x(d.key) + ",0)")
        .append("path")
        .datum(d => d.densities)
        .style("stroke", "none")
        .style("fill", "#69b3a2")
        .attr("d", d3.area()
            .x0(d => xNum(-d[1]))
            .x1(d => xNum(d[1]))
            .y(d => y(d[0]))
            .curve(d3.curveCatmullRom)
        );

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Target");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", -55)
        .attr("x", -60)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Admission Grade");
}