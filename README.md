# Students' Dropout & Academic Success Dashboard Using D3.js

# Group Members
1. Abhinav Kottayil
2. Ismail N/A
3. Kevin Joseph
4. Malik Asad

# Dataset Details

Dataset Name: Students' Dropout & Academic Success

Dataset Public Link: https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success

Description: A dataset created from a higher education institution (acquired from several disjoint databases) related to students enrolled in different undergraduate degrees, such as agronomy, design, education, nursing, journalism, management, social service, and technologies. The dataset includes information known at the time of student enrollment (academic path, demographics, and social-economic factors) and the students' academic performance at the end of the first and second semesters. The data is used to build classification models to predict students' dropout and academic sucess. The problem is formulated as a three category classification task, in which there is a strong imbalance towards one of the classes.

License: This dataset is licensed under a Creative Commons Attribution 4.0 International (CC BY 4.0) license.

Additional Modifications: Feature selection and feature extraction from 36 features.

# Project Structure

Dataset stored in data folder along with WorldMap json file.

D3 minified js file stored under lib.

- Scripts for different charts under scripts folder.
- BubbleChart.js: For bubble charts
- DebtorPlot.js: Visualization for debtor data
- DropoutRate.js: Charts representing dropout rates
- GenderPlot.js: Gender distribution visualization
- OutcomesChart.js: Visualization of various student outcomes
- ScholarshipPlot.js: Scholarship distribution charts
- ViolinChart.js: For violin plots
- WorldMap.js: World map visualization

CSS styles for charts as seperate files under styles folder.

index.html main html document containing all the  different divs and sections for vizualisation charts as well as the main dashboard elements.

# Code Style
D3 elements are targeted using id of sections and div tags and svg is appended to it to create the charts. CSS styles were added using external files linked in index.html.

# Graphs Included In Dashboard
1. Geographical Heatmap
2. Bubble Chart
3. Donut Chart
4. Area under Line Chart
5. Violin Chart

# Interactions
1. Zoom in/out for World Map
2. World Map Data filtering
3. World Map tooltip on hovering countries
4. Double click country to update other stats and chart
5. Toggle to switch to Bubble Chart
6. Double click bubble to remove country from data
7. Donut Chart Data filtering
8. Area under line chart tooltip
9. Violin Chart data filtering
10. User resizable sections
