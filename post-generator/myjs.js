var myTags = [
"ue4",
"steam",
"unity3d",

"drone",
"fpvaddict",

"ai",
"pc",
"tech",
"scifi",
"alien",
"invasion",
"futuristic",

"shooter",
"firstpersonshooter",

"guns",
"weapons",
"airsoft",

"pubg",
"matrix",
"zombies",
"destiny",
"starwars",
"apexlegends",

"game",
"gamer",
"games",
"gaming",
"gamers",
"gameday",
"gamedev",
"gameart",
"gameplay",
"videogame",
"videogames",
"gamedevelopment",
"gamersofinstagram",
"gamedesign",
"gamer4life",

"teamfollowback",
"follow",
"followback",
"follow4followback",
"followtofollow",
"followtofollowback",
"followtofollowforfollowingback",

"indie",
"nextgame",
"indiedev",
"indiegame",
"indiegames",
"instagame",
"instagaming",
"indiegamedev",

"art",
"code",
"pixelart",
"digitalart",

"fun",
"dark",
"retro",
"night",
"fantasy",
"beautiful",
"photooftheday",
"graphicdesign",

"fun",
"gamedevelopment",
"instagame",
"drawing",
"madewithunity",
"digitalart",
"photooftheday",
"pixelart",
"happy",
"instagaming",
"nextgame",
"graphicdesign",
"indiedev",
"gamedev",
"art",
"gaming",
"game",
"indie",
"indiegamedev",
"unity3d",
"games",
"gameart",
"startup",
"entrepreneur",
"indiegames",
"gamedesign",
"videogame",
"videogames",
"gamer"
];

var optimizedHastags = ["drone",
"futuristic",
"scifi",
"fpvaddict",
"shooter",
"gamedev",
"videogames",
"indiedev",
"retro",
"indiegames",
"airsoft",
"guns",
"weapons",
"invasion",
"games",
"starwars",
"matrix"];

// Randomizer :
Array.prototype.random = function (length) {
	return this[Math.floor((Math.random()*length))];
}

function getRandom(arr, n) {
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

// On document ready :
$(document).ready(function() {

	new ClipboardJS('.copybutton');

	$(".copybutton").on("click", function(){
		$.notify("Copied", "info");
	})
	
	var $selectizeSelector = $(".js-my-selectize");
	$selectizeSelector.selectize({
		onChange: function(value) {
			var $targetInput = $("#" + this.$input.attr("targetInputId"));
			var stringified = value.toString().replaceAll(","," ");
			$targetInput.val(stringified);
		}
	});

	// Hastags :
	var randomizedTwitterTags = getRandom ( myTags , 20 ),
		randomizedInstaTags = getRandom ( optimizedHastags , 5 ),
		randomizedFacebookTags = getRandom ( myTags , 7 );

	// Elements :
	var $input = $('#myInputTitle'),
		$dynamicTitle = $(".dynamicTitle"),
		$facebookTags = $(".facebookRandomTags"),
		$instagramTags = $(".instaRandomTags"),
		$twitterTags = $(".twitterTags"),
		title = $input.val();


	$input
		.val("Play for free the Emitters demo 🛸🔫 the new drone invasion game.");
	
	$dynamicTitle
		.text("Play for free the Emitters demo 🛸🔫 the new drone invasion game.");

	$input
		.keydown((e) => { $dynamicTitle.text(e.currentTarget.value) });

	$.each(randomizedFacebookTags, function(index, value) {
		$facebookTags.append("#" + value + " ")
	});

	$.each(randomizedFacebookTags, function(index, value) {
		$instagramTags.append("#" + value + " ")
	});

	$.each(optimizedHastags, function(index, value) {
		$twitterTags.append("#" + value + " ")
	});
});