$(document).ready(function(){

  $('#preloader').addClass('preloader-hide');

  var triggerOffset = "40%";
  
  // Sliders: 
  $(".Modern-Slider").slick({
    autoplay:false,
    dots:true,
    prevArrow:'<button class="myPrevArrow"></button>',
    nextArrow:'<button class="myNextArrow"></button>', 
  });

  $(".Modern-Slider-2").slick({
    autoplay:false,
    dots:true,
    prevArrow:'<button class="myPrevArrow"></button>',
    nextArrow:'<button class="myNextArrow"></button>', 
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
      i = 20171300

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

  // Hamburger:

  $('.hamburger').click(function(event) {
    var $header = $('header');
    if ($header.hasClass('open')) {
      $('header').removeClass('open');
      $('.hamburger').removeClass('minus');
    } else {
      $('header').addClass('open');
      $('.hamburger').addClass('minus');
    }
  });

  // HEADER LINKS :

  $(".header-link").click(function(event) {
    $(".header-link").removeClass('active');
    $(this).addClass('active');
    easyScroll(this.attributes.href.value);
  });

  // HIGHLIGHT HEADER LINKS BASED ON SCROLL :

  function highlightOnScroll(a){
    $(".header-link").removeClass('active');
    $(".header-link[href*='"+a+"']").addClass('active');
  }

  $(function() {
    $.scrollify({
      section: "section",
      after : function () {
        var currentSectionId = $.scrollify.current()[0].id;
        highlightOnScroll(currentSectionId);

        if ($.scrollify.current()[0].id == "content") {
          counterUp()
        }
      }
    });
  });

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

})