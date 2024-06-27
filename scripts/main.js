// Main.js

import { loadAndProcessGenderData } from './GenderPlot.js';
import { loadAndProcessDebtorData } from './DebtorPlot.js';
import { loadAndProcessScholarshipData } from './ScholarshipPlot.js'

import { initializeBubble } from './BubbleChart.js'

'use strict';

console.log(`D3 loaded, version ${d3.version}`);

// Function to adjust the height of div2 to match div1
function adjustHeight() {
    var div1 = document.getElementById('demographics');
    var div2 = document.getElementById('student-outcomes');

    // Reset div2's height to 'auto' to ensure it's not fixed
    div2.style.height = 'auto';

    // Match div2's height to div1's
    var div1Height = div1.offsetHeight;
    div2.style.height = div1Height + 'px';

    console.log(div1Height)

    // Calculate scale factor based on height ratio
    var initialHeight = 330; // Initial height of the div
    var scaleFactor = div1Height / initialHeight;

    if (div1Height < 459) {
        // Apply the calculated scale factor to the SVG's vertical scale
        d3.select("#outcomes1 svg")
            .style("transform", "scale(" + scaleFactor + ")")
            .style("transform-origin", "top");

        // Apply the calculated scale factor to the SVG's vertical scale
        d3.select("#gender-plot svg")
            .style("transform", "scale(" + scaleFactor + ")")
            .style("transform-origin", "top");
    }

}

// Instantiate a MutationObserver to observe changes
// that affect the content or layout of div1
var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        adjustHeight(); // Adjust height on any detected change
    });
});

// Observer configuration: watchs for everything that could affect layout
var config = {
    childList: true,
    subtree: true,
    attributes: true
};

// Start observing div1 for configured mutations
observer.observe(document.getElementById('demographics'), config);

// Ensure the heights are adjusted upon initial page load and on window resize
window.addEventListener('load', adjustHeight);
window.addEventListener('resize', adjustHeight);

// Initial call to ensure correct heights from the start
adjustHeight();

function initializeToggle() {
    const toggleContainer = document.getElementById('toggle-container');
    // Start with the toggle-off icon
    toggleContainer.innerHTML = '<span class="bold"> World Map</span> <i class="fa-solid fa-toggle-off"></i> Bubble Chart';

    // Event listener for toggle
    toggleContainer.addEventListener('click', () => {
        const isToggledOn = toggleContainer.innerHTML.includes('fa-toggle-on');
        // Select the container, find all child elements, and remove them
        d3.select("#world-map-visualization").selectAll("*").remove();
        // Switch between toggle-on and toggle-off
        toggleContainer.innerHTML = isToggledOn
            ? '<span class="bold">World Map</span> <i class="fa-solid fa-toggle-off"></i> Bubble Chart'
            : 'World Map <i class="fa-solid fa-toggle-on"></i> <span class="bold">Bubble Chart</span>';

        // Perform additional actions based on the toggle state
        if (isToggledOn) {
            console.log('Toggle is now OFF');
            // update the user instructions
            document.getElementById('map-instructions').innerHTML = "* Double click to see stats of specific country <br> * Click to filter out a country";
            window.initializeWorldMap();

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
        } else {
            console.log('Toggle is now ON');
            // update the user instructions
            document.getElementById('map-instructions').innerHTML = "* Double click to filter out a country";
            initializeBubble();

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
        }
    });
}

// Attaching the current chart selection to the window object to make it globally accessible
window.currentChartSelection = 'gender'; // Default selection

document.addEventListener('DOMContentLoaded', function () {
    initializeToggle();
    document.getElementById('show-by-dropdown').addEventListener('change', function () {

        window.currentChartSelection = this.value; // Update global selection
        document.getElementById('gender-plot').innerHTML = ''; // Clear plot container

        // Invoke the appropriate function based on the current selection
        if (window.currentChartSelection === 'debt') {
            loadAndProcessDebtorData();
        } else if (window.currentChartSelection === 'gender') {
            loadAndProcessGenderData();
        } else if (window.currentChartSelection === 'scholarship') {
            loadAndProcessScholarshipData();
        }
    });

    // Calling default chart (Gender Plot) drawing function at launch
    loadAndProcessGenderData();
});
