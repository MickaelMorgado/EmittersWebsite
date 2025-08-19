// more docs: https://www.chartjs.org/docs/latest/charts/polar.html
// Google Sheet API key: https://console.cloud.google.com/apis/credentials/key/

// Function to fetch data from Google Sheets
const fetchData = (googleSheetId, chartType, minValue, maxValue) => {
  var params = new URLSearchParams(window.location.search);
  var sheetIdFromURL = params.get('sheetId');

  // Use the provided googleSheetId if available, otherwise use the one from URL parameters
  var spreadsheetId =
    googleSheetId ||
    sheetIdFromURL ||
    '1SfKl5d3OmyOijxfEsgohxv5IyDSmw36XVIq8Jsg37Og';
  var apiKey = 'AIzaSyC8GoxfXDxwEO_bxMHfpJs1_f8qfmYFSu4';
  var url =
    'https://sheets.googleapis.com/v4/spreadsheets/' +
    spreadsheetId +
    '/values/Sheet1!A1:Z100?key=' +
    apiKey;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Extract labels and values from the data
      var labels = data.values[0];
      var values = data.values.slice(1); // Remove the first row (labels)

      // Create datasets for each row of values
      var datasets = [];
      for (var i = 0; i < values.length; i++) {
        datasets.push({
          label: 'Row ' + (i + 1),
          data: values[i],
          backgroundColor: 'rgba(' + getRandomColor() + ', 0.2)',
          borderColor: 'rgba(' + getRandomColor() + ', 1)',
          borderWidth: 1,
          order: 1,
        });

        const pnl = () => {
          let sum = 0;
          return values[0].map((value) => (sum += parseFloat(value)));
        };

        if (chartType === 'PNL') {
          datasets.push({
            type: 'line',
            label: 'AVG',
            data: pnl(),
            backgroundColor: 'rgba(' + getRandomColor() + ', 0.2)',
            borderColor: 'rgba(' + getRandomColor() + ', 1)',
            borderWidth: 1,
            order: 0,
          });
        }
      }

      // Create a bar chart
      var ctx = document.getElementById('myChart').getContext('2d');

      // Check if there is an existing chart instance and destroy it
      if (window.myChart instanceof Chart) {
        window.myChart.destroy();
      }

      // Create a new chart
      var options = {
        animation,
        responsive: false,
        scales: {
          y: {
            beginAtZero: false,
          },
          /*
            scales: {
                myScale: {
                type: 'logarithmic',
                position: 'right',
                },
            },
          */
        },
      };

      // Set maximum and minimum values for y-axis if provided
      if (minValue) {
        options.scales.y.min = minValue;
      }
      if (maxValue) {
        options.scales.y.max = maxValue;
      }

      // Create the chart based on the selected chart type
      switch (chartType) {
        case 'bar':
          window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: datasets,
            },
            options: options,
          });
          break;
        case 'line':
          window.myChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: datasets,
            },
            options: options,
          });
          break;
        case 'PNL':
          window.myChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: datasets,
            },
            options: {
              ...options,
              scales: {
                y: {
                  min: minValue >= 0 ? maxValue * -1 : minValue,
                  max: maxValue,
                },
              },
            },
          });
          break;
        default:
          console.error('Invalid chart type:', chartType);
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
    });
};

const animation = {
  x: {
    type: 'number',
    easing: 'easeOutCubic',
    duration: 1,
    from: 0,
  },
};
// Function to generate a random color in RGB format
const getRandomColor = () => {
  var r = Math.floor(Math.random() * 256);
  var g = Math.floor(Math.random() * 256);
  var b = Math.floor(Math.random() * 256);
  return r + ',' + g + ',' + b;
};

// Function to calculate portfolio growth from given values
const calculatePortfolioGrowth = (values) => {
  // Convert values to numbers
  const numericValues = values.map(parseFloat);

  // Calculate growth percentage relative to the initial value
  const pnlValues = numericValues.map((value) => (sum += values[i]));

  return pnlValues;
};

// Call the fetchData function when the page loads
window.onload = () => {
  // Check if there's a Google Sheet ID in the URL parameters
  var params = new URLSearchParams(window.location.search);
  var googleSheetId = params.get('sheetId');

  // If there's a Google Sheet ID in the URL parameters, fetch data using it
  if (googleSheetId) {
    fetchData(googleSheetId, 'bar', 0, null); // Defaults
  }

  // Listen for changes in the input field
  $('#userInput').on('change', function () {
    fetchData(
      this.value,
      $('#chartTypeSelect').val(),
      $('#minValueInput').val() || null,
      $('#maxValueInput').val() || null
    );
  });

  // Listen for changes in the chart type select input
  $('#chartTypeSelect').on('change', function () {
    fetchData(
      $('#userInput').val(),
      this.value,
      $('#minValueInput').val() || null,
      $('#maxValueInput').val() || null
    );
  });

  // Listen for changes in the min value input field
  $('#minValueInput').on('change', function () {
    fetchData(
      $('#userInput').val(),
      $('#chartTypeSelect').val(),
      this.value || null,
      $('#maxValueInput').val() || null
    );
  });
  // Listen for changes in the max value input field
  $('#maxValueInput').on('change', function () {
    fetchData(
      $('#userInput').val(),
      $('#chartTypeSelect').val(),
      $('#minValueInput').val() || null,
      this.value || null
    );
  });
};
