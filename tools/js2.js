$(document).ready(function () {
  var sumPool1 = 0;
  var sumPool2 = 0;
  var greenProbability = 0.25; // Default value
  var reward = 2;

  var elements = {
    button: $('#run')[0],
    die: $('#die')[0],
    pool1: $('#pool1')[0],
    pool2: $('#pool2')[0],
    probabilityInput: $('#green-probability')[0], // Assuming you have an input field with id 'green-probability'
    rewardInput: $('#reward')[0],
    riskInput: $('#risk')[0],
    result: $('#result')[0],
    chart1: $('#myChart')[0],
    render1: $('#render1')[0],
    iframePreview: $('#iframepreview')[0],
    resume: $('#resume')[0],
  };

  // Call the main function when the button is clicked
  elements.button.onclick = function () {
    // Get the green probability value from the input field and convert it to a number
    greenProbability = parseFloat(elements.probabilityInput.value);
    reward = parseFloat(elements.rewardInput.value);
    risk = parseFloat(elements.riskInput.value);
    mainFunction();
  };

  // Function to generate a random number between +1 and -1 with a given probability
  function randomPositiveOrNegative(probability) {
    var genNumb = Math.random();
    // console.log(`${genNumb} <= ${probability} : ${genNumb <= probability}`);
    return genNumb <= probability ? 1 : -1;
  }

  // Main function to be executed
  const mainFunction = () => {
    setInterval(() => {
      const randomDirection = Math.floor(Math.random() * 2); // Generate a random number: 0 or 1
      const rewardSign = randomPositiveOrNegative(greenProbability); // Determine reward sign based on greenProbability
      // const rewardValue = rewardSign * reward; // Multiply reward by the sign to get the final reward value

      switch (rewardSign) {
        case -1:
          elements.die.style.backgroundColor = 'red';
          elements.die.innerText = '-1';
          sumPool2 += risk;
          break;
        case 1:
          elements.die.style.backgroundColor = 'green';
          elements.die.innerText = '1';
          sumPool1 += reward;
          break;
        default:
          console.error('Invalid die value:', randomDirection);
      }

      elements.pool1.innerHTML = sumPool1;
      elements.pool2.innerHTML = sumPool2;

      elements.result.innerHTML = sumPool1 - sumPool2;
    }, 50);
  };

  winLossClass = (value) => {
    return value > 0 ? 'win' : value < 0 ? 'loss' : '';
  };

  /*
  window.preview = (url) => {
    console.log('Previewing:', url);
    elements.iframePreview.src = url;
  };
  */

  const chart = () => {
    // Use the provided googleSheetId if available, otherwise use the one from URL parameters
    var spreadsheetId = '19Xef2pU1IGmlTo07YvrCO1cMlB0QgBwkMQ3Xy7xo1Tc';
    var apiKey = 'AIzaSyC8GoxfXDxwEO_bxMHfpJs1_f8qfmYFSu4';
    var chartUrl =
      'https://sheets.googleapis.com/v4/spreadsheets/' +
      spreadsheetId +
      '/values/EURUSD - Trading History!A13:Z260?key=' +
      apiKey;

    fetch(chartUrl)
      .then((response) => response.json())
      .then((data) => {
        var values = data.values;
        for (var i = 0; i < values.length; i++) {
          elements.render1.innerHTML += `<tr class='generated-table'>
            <td class="column1">${values[i][0]}</td>
            <td class="column2 ${winLossClass(values[i][1])}">${
            values[i][1]
          }</td>
            <td class="column3 ${values[i][2] > 0 ? 'loss' : ''}">${
            values[i][2]
          }</td>
            <td class="column4 ${
              values[i][5] > 0 ? 'win' : values[i][5] < 0 ? 'loss' : ''
            }">${values[i][5]}</td>
            <td class="column5">${values[i][4]}</td>
            <td class="column6">
              <a
                href="${values[i][11]}"
                class="btn"
                target="_blank"
              >
                entry
              </a>
            </td>
            <td class="column7 ellipsis" title="${values[i][12]}">${
            values[i][12]
          }</td>
            <td class="column8">${values[i][6]}</td>
            <td class="column9">${values[i][10]}</td>
            <td class="column10">${
              values[i][13] !== undefined
                ? `<a href="${values[i][13]}" class="btn" target="_blank">result</a>`
                : `<span></span>`
            }</td>
          </tr>`;
        }
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });

    //elements.render1.innerHTML = `<iframe src="${chartUrl}/pubhtml?widget=true&amp;headers=false"></iframe>`;
  };

  chart();

  // Function to calculate cosine similarity between two vectors
  function cosineSimilarity(vector1, vector2) {
    // Calculate dot product of the two vectors
    let dotProduct = 0;
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
    }

    // Calculate magnitudes of the vectors
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (let i = 0; i < vector1.length; i++) {
      magnitude1 += Math.pow(vector1[i], 2);
      magnitude2 += Math.pow(vector2[i], 2);
    }
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    // Calculate cosine similarity
    const similarity = dotProduct / (magnitude1 * magnitude2);

    return similarity;
  }

  function findMostSimilarSentences(text, numSentences) {
    // Split the text into an array of non-empty sentences
    const sentences = text.toLowerCase().match(/[^.!?]+[.!?]+/g);

    // Create an array to store sentence vectors
    const sentenceVectors = [];

    // Create sentence vectors
    sentences.forEach((sentence) => {
      const words = sentence.match(/\b\w+\b/g);
      if (words) {
        // Compute the vector for the sentence
        const sentenceVector = words.map((word) => word.toLowerCase());
        sentenceVectors.push(sentenceVector);
      }
    });

    // Calculate cosine similarity between each pair of sentences
    const similarities = [];
    for (let i = 0; i < sentenceVectors.length; i++) {
      for (let j = i + 1; j < sentenceVectors.length; j++) {
        const similarity = cosineSimilarity(
          sentenceVectors[i],
          sentenceVectors[j]
        );
        similarities.push({
          sentence1: sentences[i],
          sentence2: sentences[j],
          similarity: similarity,
        });
      }
    }

    // Sort the similarities by similarity in descending order
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Get the top numSentences most similar pairs of sentences
    const mostSimilarPairs = similarities.slice(0, numSentences);

    return mostSimilarPairs;
  }

  function delayedFunction() {
    // Check if any elements are found before trying to iterate over them
    const el = document.querySelectorAll('.column7.ellipsis');
    if (el.length > 0) {
      let text = '';
      el.forEach((i) => (text += i.innerHTML + ', '));
      const mostSimilarPairs = findMostSimilarSentences(text.slice(0, -2), 2); // Removing the trailing comma and space
      let output = '';
      mostSimilarPairs.forEach((pair) => {
        output += `Similarity: ${pair.similarity.toFixed(2)}, Sentences: ${
          pair.sentence1
        } | ${pair.sentence2}<br>`;
      });
      elements.resume.innerHTML = `Most similar sentences:<br>${output}`;
    } else {
      console.error(
        'No elements found matching the selector .column7.ellipsis'
      );
    }
  }

  setTimeout(delayedFunction, 2000); // 2000 milliseconds = 2 seconds
});
