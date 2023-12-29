const elements = {
  buttons: {
    appendToInput: '.appendToInput',
    copyButtons: '.copybutton',
    refreshButton: '#refreshButton',
    mainButton: '#mainButton',
  },
  filters: {
    mentions: '#mentionsCheckbox',
  },
  textFields: {
    main: '#myInputTitle',
    instagram: '#tags1',
    linkedin: '#tags3',
    twitter: '#tags2',
    tiktok: '#tags4',
  },
  socialPreviews: {
    instagram: '.js-social-preview-instagram',
    facebook: '.js-social-preview-facebook',
    linkedin: '.js-social-preview-linkedin',
    twitter: '.js-social-preview-twitter',
    tiktok: '.js-social-preview-tiktok',
  },
};

const hastags = {
  instagram: [
    'InstaHastag1',
    'InstaHastag2',
    'InstaHastag3',
    'InstaHastag4',
    'InstaHastag5',
    'InstaHastag6',
    'InstaHastag7',
    'InstaHastag8',
  ],
  linkedin: ['LinkedinHastag1', 'LinkedinHastag2', 'LinkedinHastag3'],
  reusables: [
    'indiedev',
    'indiegame',
    'gamedev',
    'games',
    'indiegames',
    'unity',
    'gamedevelopment',
    'gaming',
    'indiegamedev',
    'graphicdesign',
    'drones',
    'indiefps',
    'weapon',
    'invasion',
    'fps',
    'UE4',
    'UE5',
    'repost',
  ],
  // selectize hashtags have to be different from reusables (to prevent possible duplicated hashtags):
  selectize: [
    '#ue4',
    '#steam',
    '#unity3d',
    '#drones',
    '#fpvaddict',
    '#ai',
    '#pc',
    '#tech',
    '#scifi',
    '#alien',
    '#invasion',
    '#futuristic',
    '#shooter',
    '#firstpersonshooter',
    '#guns',
    '#weapons',
    '#airsoft',
    '#pubg',
    '#matrix',
    '#zombies',
    '#destiny',
    '#starwars',
    '#apexlegends',
    '#game',
    '#gamer',
    '#games',
    '#gaming',
    '#gamers',
    '#gameday',
    '#gamedev',
    '#gameart',
    '#gameplay',
    '#videogame',
    '#videogames',
    '#gamedevelopment',
    '#gamersofinstagram',
    '#gamedesign',
    '#gamer4life',
    '#teamfollowback',
    '#follow',
    '#followback',
    '#follow4followback',
    '#followtofollow',
    '#followtofollowback',
    '#followtofollowforfollowingback',
    '#indie',
    '#nextgame',
    '#indiedev',
    '#indiegame',
    '#indiegames',
    '#instagame',
    '#instagaming',
    '#indiegamedev',
    '#art',
    '#code',
    '#pixelart',
    '#digitalart',
    '#fun',
    '#dark',
    '#retro',
    '#night',
    '#fantasy',
    '#beautiful',
    '#photooftheday',
    '#graphicdesign',
    '#fun',
    '#gamedevelopment',
    '#instagame',
    '#drawing',
    '#madewithunity',
    '#digitalart',
    '#photooftheday',
    '#pixelart',
    '#happy',
    '#instagaming',
    '#nextgame',
    '#graphicdesign',
    '#indiedev',
    '#gamedev',
    '#art',
    '#gaming',
    '#game',
    '#indie',
    '#indiegamedev',
    '#unity3d',
    '#games',
    '#gameart',
    '#startup',
    '#entrepreneur',
    '#indiegames',
    '#gamedesign',
    '#videogame',
    '#videogames',
    '#gamer',
  ],
  tiktok: [
    'ue4',
    'unity',
    'starwars',
    'emitters',
    'gamedev',
    'alien',
    'ufo',
    'drones',
    'indiegame',
    'fps',
    'unreal',
  ],
  twitter: ['TwitterHastag1', 'TwitterHastag2', 'TwitterHastag3'],
};

const mentions = {
  tiktok: ['@devforge', '@gamelancer', '@_triko_official_', '@gaming'],
  twitter: [
    '@E1M1magazine',
    '@FPS_DB',
    '@IndieWorldOrder',
    '@madewithUnreal',
    '@UnrealEngine',
    '@FPSthetics',
  ],
};

// Randomizer :
Array.prototype.random = function (length) {
  return this[Math.floor(Math.random() * length)];
};

const shuffle = (array) => {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

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
};

const getRandom = (arr, n) => {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError('getRandom: more elements taken than available');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};

const getFieldValue = (input) => {
  return $(input).val();
};

const addToField = (input, value) => {
  $(input)[0].value = value;
};

const addToSocialPreview = (input, value) => {
  var title = getFieldValue(elements.textFields.main);
  var customText = `${title}\r\r${value}`;
  $(input).find('.social-preview-content').html(customText);
};

const createStringItemList = (array, prefix = '#') => {
  var result = '';

  $.each(array, function (index, value) {
    result = result + prefix + value + ' ';
  });

  return result;
};

// On document ready :
$(document).ready(function () {
  const buttons = elements.buttons;

  new ClipboardJS(buttons.copyButtons);

  const isCheckboxChecked = () => {
    var checkbox = document.getElementById('mentionsCheckbox');
    return checkbox.checked;
  };

  const popuplateAll = () => {
    PopulateInstagram();
    PopulateLinkedin();
    PopulateTiktok();
    PopulateTwitter();
    PopulateFacebook();
    $.notify('Refreshed', 'info');
  };

  // Button events:
  $(buttons.mainButton).on('click', function () {
    popuplateAll();
  });

  $(buttons.appendToInput).on('click', function () {
    $(elements.textFields.main).val(
      $(elements.textFields.main).val() + this.dataset.clipboardText
    );
  });

  const refresh = () => {
    popuplateAll();
  };

  $(buttons.refreshButton).on('click', function () {
    refresh();
  });

  $(elements.filters.mentions).on('click', () => {
    refresh();
  });

  var customHastags = '';

  const setCustomHastags = (stringListItem) => {
    customHastags = stringListItem;
    popuplateAll();
  };

  // Selectize :
  var $selectizeSelector = $('.js-my-selectize');

  var arrayToSelectizeOptions = (array) => {
    var result = array.map((item) => ({ text: item, value: item }));
    return result;
  };

  $selectizeSelector.selectize({
    options: arrayToSelectizeOptions(hastags.selectize),
    onChange: function (value) {
      var $targetInput = $('#' + this.$input.attr('targetInputId'));
      var stringified = value.toString().replaceAll(',', ' ');
      setCustomHastags(stringified);
      $targetInput.val(stringified);
    },
    create: function (input) {
      return {
        value: '#' + input,
        text: '#' + input,
      };
    },
  });

  // Populate Post Field:
  var $input = $('#myInputTitle'),
    $dynamicTitle = $('.dynamicTitle');

  $input.val(
    'Play for free the Emitters demo 🛸🔫 the new drone invasion game.'
  );

  $dynamicTitle.text(
    'Play for free the Emitters demo 🛸🔫 the new drone invasion game.'
  );

  $input.keydown((e) => {
    $dynamicTitle.text(e.currentTarget.value);
  });

  // Populate Hashtag Fields and SocialPreviews:
  // Facebook:
  var PopulateFacebook = () => {
    var facebookHastagSetter = () => {
      return (
        customHastags +
        ' ' +
        createStringItemList(shuffle(getRandom(hastags.reusables, 6)))
      );
    };
    addToField(elements.textFields.instagram, facebookHastagSetter());
    addToSocialPreview(
      elements.socialPreviews.facebook,
      facebookHastagSetter()
    );
  };

  // Instagram:
  var PopulateInstagram = () => {
    var instagramHastagSetter = () => {
      return (
        customHastags +
        ' ' +
        createStringItemList(shuffle(getRandom(hastags.reusables, 15)))
      );
    };
    addToField(elements.textFields.instagram, instagramHastagSetter());
    addToSocialPreview(
      elements.socialPreviews.instagram,
      instagramHastagSetter()
    );
  };

  // Linkedin:
  var PopulateLinkedin = () => {
    var linkedinHastagSetter = () => {
      return (
        customHastags +
        ' ' +
        createStringItemList(shuffle(getRandom(hastags.reusables, 10)))
      );
    };
    addToField(elements.textFields.linkedin, linkedinHastagSetter());
    addToSocialPreview(
      elements.socialPreviews.linkedin,
      linkedinHastagSetter()
    );
  };

  // Twitter:
  var PopulateTwitter = () => {
    var twitterHastagSetter = () => {
      return (
        `${
          isCheckboxChecked()
            ? createStringItemList(getRandom(mentions.twitter, 1), '')
            : ''
        }` +
        customHastags +
        ' ' +
        createStringItemList(shuffle(getRandom(hastags.reusables, 10)))
      );
    };
    addToField(elements.textFields.twitter, twitterHastagSetter());
    addToSocialPreview(elements.socialPreviews.twitter, twitterHastagSetter());
  };

  // Tiktok:
  var PopulateTiktok = () => {
    var tiktokHastagSetter = () => {
      return (
        `${
          isCheckboxChecked()
            ? createStringItemList(
                [mentions.tiktok[0], mentions.tiktok[1], mentions.tiktok[2]],
                ''
              )
            : ''
        }` +
        customHastags +
        ' ' +
        createStringItemList(shuffle(getRandom(hastags.tiktok, 10)))
      );
    };
    addToField(elements.textFields.tiktok, tiktokHastagSetter());
    addToSocialPreview(elements.socialPreviews.tiktok, tiktokHastagSetter());
  };
});
