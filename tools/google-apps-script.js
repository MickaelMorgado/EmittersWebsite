// -------------------------------------------------------------------------
// GOOGLE APPS SCRIPT CODE
// -------------------------------------------------------------------------
// Instructions:
// 1. Open your Google Sheet.
// 2. Go to Extensions > Apps Script.
// 3. Paste this code into the editor (replace existing code).
// 4. Click "Deploy" > "New deployment".
// 5. Select type: "Web app".
// 6. Set "Description" to "Backtesting Export v2".
// 7. Set "Execute as" to "Me".
// 8. Set "Who has access" to "Anyone".
// 9. Click "Deploy".
// 10. Copy the "Web App URL" and update it in index6.js if it changed.
// -------------------------------------------------------------------------

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Validate data is an array
    if (!Array.isArray(data)) {
       return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Invalid data format. Expected an array.' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Optional: Add simple length check to ensure it matches expected columns (approx)
    // Adjust this number based on your actual CSV column count if needed
    if (data.length < 5) {
       return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': 'Data row seems too short.' })).setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow(data);
    
    // Return success JSON (though client might not see it in no-cors mode)
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'message': 'Get request received. Use POST to send data.' })).setMimeType(ContentService.MimeType.JSON);
}
