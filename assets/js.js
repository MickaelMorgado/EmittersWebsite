$(document).ready(function(){

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

  $(".Modern-Slider-3").width($(document).width());
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
  });

  $('#close').click(function(event) {
    event.preventDefault()
    closeVideo();
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