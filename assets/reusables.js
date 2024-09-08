const getGoogleSheetData = (spreadsheetId, spreadsheetPage, startEndCells) => {
  return new Promise((resolve, reject) => {
    var apiKey = 'AIzaSyC8GoxfXDxwEO_bxMHfpJs1_f8qfmYFSu4';
    var chartUrl =
      'https://sheets.googleapis.com/v4/spreadsheets/' +
      spreadsheetId +
      `/values/${spreadsheetPage}!${startEndCells}?key=` +
      apiKey;

    fetch(chartUrl)
      .then((response) => response.json())
      .then((data) => {
        resolve(data.values);
      })
      .catch((error) => {
        reject(error);
        console.error('Error fetching data:', error);
      });
  });
};

const renderTableRows = (rowData, targetElement, templateFunction) => {
  rowData.forEach((row) => {
    const rowHtml = templateFunction(row);
    targetElement.innerHTML += rowHtml;
  });
};

// Example template function
const defaultTemplateFunction = (row) => {
  return `<tr class='generated-table'>
      <td class="column1">${row[0]}</td>
    </tr>`;
};

/* Example usage
getGoogleSheetData(
  spreadsheetId,
  spreadsheetPage,
  startEndLines,
  defaultTemplateFunction
)
  .then((rowData) => {
    renderTableRows(
      rowData,
      document.getElementById('targetElement'),
      defaultTemplateFunction
    );
  })
  .catch((error) => {
    console.error('Error fetching data:', error);
  });
*/

// Modified utility function to extract values at the selectedIndex from each row
const extractArrayFromRows = (rowData, selectedIndex) => {
  return rowData.map((row) => row[selectedIndex]);
};

// Here's a JavaScript function that converts a chosen column from a Google Sheet (or Excel) format (e.g., "A", "B", ..., "Z", "AA", etc.) to its corresponding index number (0-based):
/* 
  Example usage:
    console.log(columnToIndex("A"));  // Output: 0
    console.log(columnToIndex("Z"));  // Output: 25
    console.log(columnToIndex("AA")); // Output: 26
    console.log(columnToIndex("AB")); // Output: 27
    console.log(columnToIndex("AZ")); // Output: 51
    console.log(columnToIndex("BA")); // Output: 52
*/
const columnToIndex = (column) => {
  let index = 0;
  for (let i = 0; i < column.length; i++) {
    index *= 26;
    index += column.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }
  return index - 1; // Subtract 1 for 0-based indexing
};
