$(document).ready(function(){

  var observer = lozad('.lozad', {
    rootMargin: '500px 500px' // ratio of element convergence
  });
  observer.observe();

  $('#preloader').addClass('preloader-hide');

  var triggerOffset = "40%";
  
  // Sliders: 
  if ($(window).width() >= 768) {
    $(".Modern-Slider").slick({
      autoplay:false,
      dots:true,
      prevArrow:'<button class="myPrevArrow"></button>',
      nextArrow:'<button class="myNextArrow"></button>',
      loop: false
    });
  }

  $('.Modern-Slider-2').slick({
    autoplay:false,
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: 2,
    slidesToScroll: 2,
    prevArrow:'<button class="myPrevArrow"></button>',
    nextArrow:'<button class="myNextArrow"></button>', 
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      }
    ]
  });

  $(".Modern-Slider-3").slick({
    autoplay:false,
    dots:false,
    arrows:false,
  }); 

  $("#slickMapPrev").click(function(e) { // Added a '.'
    $(".Modern-Slider-3").slick('slickPrev');
  });

  $("#slickMapNext").click(function(e) { // Added a '.'
    $(".Modern-Slider-3").slick('slickNext');
  });


  /* Get mouse position or offsets in a section:

    Example of use:

      $("#weapons").mousemove(function(e) {
        var position = mouseMoveInSection(e, 0.1);
        $(".weapons-glass").css({
          top: `${position.offset.y}%`,
          left: `${position.offset.x}%`,
        });
      });
  */
  function mouseMoveInSection(event, factor) {
    var maxX = $(event.currentTarget).width(),
    maxY = $(event.currentTarget).height(),
    x = (event.clientX / maxX) * 100,
    y = (event.clientY / maxY) * 100;
    
    var coordinates = {
      offset: {x, y},
      centeredOffset: {
        x: x - 50, 
        y: y - 50
      },
      centeredOffsetWithFactor: {
        x: (x - 50) * factor + 50,
        y: (y - 50) * factor + 50 
      },
      position: {
        x: event.clientX,
        y: event.clientY
      }
    }

    return coordinates;
  }

  // Counter up:

  let counter = $('#count-up'),
      i = 20171200;

  function counterUp() {
    if(i <= 20171337) {
      counter[0].innerHTML = i
      i += 1
      counter.addClass('jump');
      
      setTimeout(function(){
        counter.removeClass('jump');
        setTimeout(function(){
          counterUp();
        }, 100)
      }, Math.floor(Math.random() * 6) * 1000 /2 )
    }
  }
  counterUp();

  function showVideo() {
    $('#trailerVideo').prop('muted', false);
    $('#trailerVideo').addClass('full-size');
    $('#close').addClass('show');
    $('.side-caption').addClass('hide');
  }

  function closeVideo() {
    $('#trailerVideo').prop('muted', true);
    $('#trailerVideo').removeClass('full-size');
    $('#close').removeClass('show');
    $('.side-caption').removeClass('hide');
  }

  $('#watchTrailer').click(function(event) {
    event.preventDefault()
    showVideo()
    $('#watchTrailer').fadeOut();
  });
  
  $('#close').click(function(event) {
    event.preventDefault()
    closeVideo();
    $('#watchTrailer').fadeIn();
  });
  
  function easyScroll(a) {
    $('html, body').animate({scrollTop: $(a).offset().top }, 'slow')
  }

  function closeHeader() {
    $('header').removeClass('open');
    $('.hamburger').removeClass('minus');
  }

  function openHeader() {
    $('header').addClass('open');
    $('.hamburger').addClass('minus');
  }

  // Hamburger:

  $('.hamburger').click(function(event) {
    var $header = $('header');
    if ($header.hasClass('open')) {
      closeHeader();
    } else {
      openHeader();
    }
  });

  // HEADER LOGO LINKS :
  
  $("#header-logo-link, #scrollUp").click(function(event) {
    easyScroll(this.attributes.href.value);
  });

  // HEADER LINKS :

  $(".header-link").click(function(event) {
    event.preventDefault();
    $(".header-link").removeClass('active');
    $(this).addClass('active');
    closeHeader();
    easyScroll(this.attributes.href.value);
  });

  // HIGHLIGHT HEADER LINKS BASED ON SCROLL :

  function highlightOnScroll(a){
    $(".header-link").removeClass('active');
    $(".header-link[href*='"+a+"']").addClass('active');
  }

  // SCROLLIFY :

  if ($(window).width() >= 1366) {
    $('.logo-header, #scrollUp').addClass('hide');
    $.scrollify({
      section: "section",
      setHeights: false,
      scrollSpeed: 800,
      updateHash: false,
      sectionName: false,
      after : function () {
        var currentSectionId = $.scrollify.current()[0].id;
        highlightOnScroll(currentSectionId);
        if (currentSectionId == "home") {
          $('.logo-header, #scrollUp').addClass('hide');
        } else {
          $('.logo-header, #scrollUp').removeClass('hide');
        }
      }
    });
  }

  // HOME :
  function displayPlatformName () {
    var container = $("#js-platform-name")
    var nameElement = container.find(".platform-name")[0]
    var platformsButton = container.find(".platforms-button")
    
    platformsButton.hover(function() {
      var platformRetrievedName = $(this).attr("platform-name")
      nameElement.innerHTML = platformRetrievedName
    },
    function() {
      nameElement.innerHTML = ""
    })
  }

  displayPlatformName();
  

  // CREATOR :

  $("#creator").mousemove(function creatorMouseMove(e) {

    var maxShadowOffset = 30,
        maxX = $("#creator").width(),
        maxY = $("#creator").height(),
        x = (((e.clientX / maxX) * 2) - 1) * maxShadowOffset,
        y = (((e.clientY / maxY) * 2) - 1) * maxShadowOffset;

    $('.js-dynamic-text').css({
      textShadow: '' + -x/2 + 'px ' + -y/2 + 'px 5px rgba(0,0,0,1)',
      transform: `translate(${x}px,${y}px)`,
    });

    $('.js-dynamic-signature').css({
      transform: `translate(${x/3}px,${y/3}px)`,
    });
  });

  // SOCIAL :

  $("#social").mousemove(function creatorMouseMove(e) {
    var p = mouseMoveInSection(e, 0.1);
    $('.js-dynamic-background').css({
      backgroundPosition: `${p.offset.x}% ${p.offset.y}%`,
    });
  });

  // MATRIX :
  const rows = 5;
  const cols = 13;

  function randomBool() {
    return !Math.round(Math.random());
  }
  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }
  function digitalAnimate() {
    return "digital-animate-" + Math.round(getRandomArbitrary(0,4));
  }

  function line() {
    var lining = "";
    for (let i = 0; i < cols; i++) {
      lining = lining + `<div class='cell ${randomBool()} ${digitalAnimate()}'></div>`;
    }
    return lining;
  }

  for (let i = 0; i < rows; i++) {
    $('#matrix').append(`<div class='line'>${line()}</div>`);
  }

  // MASK OVERLAY :
  $("#reviewers").mousemove(function creatorMouseMove(e) {

    var maxShadowOffset = 30,
        maskSize = 600 / 2;
        maxX = $("#reviewers").width(),
        maxY = $("#reviewers").height(),
        x = (e.clientX / maxX) * 100,
        y = (e.clientY / maxY) * 100;

    $('#mask-overlay').css({
      left: `${x}%`,
      top: `${y}%`,
    });

  });

  // GLASS :
  $("#weapons").mousemove(function(e) {
    var MMIS1 = mouseMoveInSection(e, 0.02);
    var MMIS2 = mouseMoveInSection(e, -0.08);
    $(".weapons-glass--1").css({
      top: `${MMIS1.centeredOffsetWithFactor.y}%`,
      left: `${MMIS1.centeredOffsetWithFactor.x}%`,
    });
    $(".weapons-glass--2").css({
      top: `${MMIS2.centeredOffsetWithFactor.y}%`,
      left: `${MMIS2.centeredOffsetWithFactor.x}%`,
    });
  });

  // GALLERY :
  var $popup = $("#zoom");

  $(".gallery-item").click(function(event) {
    var image = $(this).data("zoom");

    $popup.addClass('show');
    $popup.find("img")[0].src = ""+image;
  });

  $("#zoom").click(function(event) {
    $popup.removeClass('show');
  });

})