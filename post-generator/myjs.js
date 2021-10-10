const elements = {
	buttons: {
		appendToInput: ".appendToInput",
		copyButtons: ".copybutton",
		refreshButton: "#refreshButton",
	},
	textFields: {
		instagram: "#tags1",
		linkedin: "#tags3",
		twitter: "#tags2",
	},
};

const hastags = {
	instagram: [
		"InstaHastag1",
		"InstaHastag2",
		"InstaHastag3",
		"InstaHastag4",
		"InstaHastag5",
		"InstaHastag6",
		"InstaHastag7",
		"InstaHastag8",
	],
	linkedin: [
		"LinkedinHastag1",
		"LinkedinHastag2",
		"LinkedinHastag3",
	],
	reusables: [
		"indiedev",
		"indiegame",
		"gamedev",
		"games",
		"indiegames",
		"unity",
		"gamedevelopment",
		"gaming",
		"indiegamedev",
		"graphicdesign",
		"drones",
		"indiefps",
		"weapon",
		"invasion",
		"fps",
		"UE4",
		"UE5",
		"repost",
	],
	// selectize hashtags have to be different from reusables (to prevent possible duplicated hashtags):
	selectize: [
		"#ue4",
		"#steam",
		"#unity3d",
		"#drones",
		"#fpvaddict",
		"#ai",
		"#pc",
		"#tech",
		"#scifi",
		"#alien",
		"#invasion",
		"#futuristic",
		"#shooter",
		"#firstpersonshooter",
		"#guns",
		"#weapons",
		"#airsoft",
		"#pubg",
		"#matrix",
		"#zombies",
		"#destiny",
		"#starwars",
		"#apexlegends",
		"#game",
		"#gamer",
		"#games",
		"#gaming",
		"#gamers",
		"#gameday",
		"#gamedev",
		"#gameart",
		"#gameplay",
		"#videogame",
		"#videogames",
		"#gamedevelopment",
		"#gamersofinstagram",
		"#gamedesign",
		"#gamer4life",
		"#teamfollowback",
		"#follow",
		"#followback",
		"#follow4followback",
		"#followtofollow",
		"#followtofollowback",
		"#followtofollowforfollowingback",
		"#indie",
		"#nextgame",
		"#indiedev",
		"#indiegame",
		"#indiegames",
		"#instagame",
		"#instagaming",
		"#indiegamedev",
		"#art",
		"#code",
		"#pixelart",
		"#digitalart",
		"#fun",
		"#dark",
		"#retro",
		"#night",
		"#fantasy",
		"#beautiful",
		"#photooftheday",
		"#graphicdesign",
		"#fun",
		"#gamedevelopment",
		"#instagame",
		"#drawing",
		"#madewithunity",
		"#digitalart",
		"#photooftheday",
		"#pixelart",
		"#happy",
		"#instagaming",
		"#nextgame",
		"#graphicdesign",
		"#indiedev",
		"#gamedev",
		"#art",
		"#gaming",
		"#game",
		"#indie",
		"#indiegamedev",
		"#unity3d",
		"#games",
		"#gameart",
		"#startup",
		"#entrepreneur",
		"#indiegames",
		"#gamedesign",
		"#videogame",
		"#videogames",
		"#gamer",
	],
	twitter: [
		"TwitterHastag1",
		"TwitterHastag2",
		"TwitterHastag3",
	],
};

const mentions = {
	twitter: [
		"@E1M1magazine",
		"@FPS_DB",
		"@IndieWorldOrder",
		"@madewithUnreal",
		"@UnrealEngine",
	],
}

// Randomizer :
Array.prototype.random = function (length) {
	return this[Math.floor((Math.random()*length))];
}

const shuffle = (array) => {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

const getRandom = (arr, n) => {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

const addToField = (input, value) => {
	$(input)[0].value = value;
};

const createStringItemList = (array, prefix = "#") => {
	var result = "";

	$.each(array, function(index, value) {
		result = result + prefix + value + " ";
	});

	return result;
};

// On document ready :
$(document).ready(function() {
	
	const buttons = elements.buttons;

	new ClipboardJS(buttons.copyButtons);

	// Button events:
		$(buttons.copyButtons).on("click", function() {
			$.notify("Copied", "info");
		});
		
		$(buttons.appendToInput).on("click", function() {
			$("#myInputTitle").val($("#myInputTitle").val() + this.dataset.clipboardText);
		});
		
		$(buttons.refreshButton).on("click", function() {
			PopulateInstagram();
			PopulateLinkedin();
			PopulateTwitter();
			$.notify("Refreshed", "info");
		});

	var customHastags = "";
	
	const setCustomHastags = (stringListItem) => {
		customHastags = stringListItem;
		PopulateInstagram();
		PopulateLinkedin();
		PopulateTwitter();
	};  	
	
	// Selectize :
		var $selectizeSelector = $(".js-my-selectize");

		var arrayToSelectizeOptions = (array) => {
			var result = array.map(item => ({text: item, value: item}));
			return result;
		};

		$selectizeSelector.selectize({
			options: arrayToSelectizeOptions(hastags.selectize),
			onChange: function(value) {
				var $targetInput = $("#" + this.$input.attr("targetInputId"));
				var stringified = value.toString().replaceAll(","," ");
				setCustomHastags(stringified);
				$targetInput.val(stringified);
			},
			create: function (input) {
				return {
					value: "#"+input,
					text: "#"+input,
				};
			},
		});

	// Populate Post Field:
		var $input = $('#myInputTitle'),
			$dynamicTitle = $(".dynamicTitle");

		$input
			.val("Play for free the Emitters demo 🛸🔫 the new drone invasion game.");
		
		$dynamicTitle
			.text("Play for free the Emitters demo 🛸🔫 the new drone invasion game.");

		$input
			.keydown((e) => { $dynamicTitle.text(e.currentTarget.value) });
  
	// Populate Hashtag Fields:  
  		// Instagram:
		var PopulateInstagram = () => addToField(elements.textFields.instagram, customHastags + " " +
			createStringItemList(
				shuffle(
					getRandom(hastags.reusables, 15)
				)
			)
		);

		// Linkedin:
		var PopulateLinkedin = () => addToField(elements.textFields.linkedin, customHastags + " " +
			createStringItemList(
				shuffle(
					getRandom(hastags.reusables, 10)
				)
			)
		);

		// Twitter:
		var PopulateTwitter = () => addToField(elements.textFields.twitter,
			createStringItemList(getRandom(mentions.twitter,1), "") + customHastags + " " +
			createStringItemList(
				shuffle(
					getRandom(hastags.reusables, 10)
				)
			)
		);
});