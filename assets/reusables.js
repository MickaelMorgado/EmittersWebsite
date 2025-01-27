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

const chatGPTRequest = async (message) => {
  const appendMessage = (message) => {
    const chatContainer = document.querySelector("[data='chatGPT-container']");
    if (!chatContainer) {
      throw new Error('Chat container not found. [data-chatGPT-container]');
    }
    chatContainer.innerHTML += `${message}`;
  };

  const apiKey = '';
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) throw new Error('Error with the API request.');

    const data = await response.json();
    const reply = data.choices[0].message.content;
    appendMessage(reply, 'bot');
  } catch (error) {
    appendMessage('Error: Unable to fetch response.', 'bot');
    console.error(error);
  }
};
