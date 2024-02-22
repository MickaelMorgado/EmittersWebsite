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
});
