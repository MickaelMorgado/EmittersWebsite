$(document).ready(() => {
  getGoogleSheetData(
    '19Xef2pU1IGmlTo07YvrCO1cMlB0QgBwkMQ3Xy7xo1Tc',
    'EURUSD - Trading History LDN Scalp',
    'A3:Z260'
  )
    .then((rowData) => {
      const listOfImagesSrcs = extractArrayFromRows(rowData, 3);
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
    });
});
