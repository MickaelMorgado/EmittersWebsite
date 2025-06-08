var page = {
  init: function () {
    this.carousel();
  },
  carousel: function () {
    function move() {
      // Carousel, horizontal movement
      var $carousel = $('.section-advantage-carousel-content-list');
      var $carouselItem = $('.section-advantage-carousel-item');
      var $carouselItemFirst = $carouselItem.first();
      var cl = $carouselItemFirst
        .clone()
        .removeClass('out-left')
        .addClass('out-right');

      $carousel.append(cl);

      setTimeout(function () {
        if ($('.out-right').length) {
          $('.out-left').remove();
        }
      }, 1000);

      $carouselItemFirst.addClass('out-left');
      $carouselItem.not().last().removeClass('out-right');

      // Scale, gradient, text animation
      var itemLength = $carouselItem.length - 1;
      var itemLengthDivide = Math.floor($carouselItem.length / 2);
      var cnt = 0;

      for (var i = 0; i < itemLength; i++) {
        if (i >= itemLengthDivide || i >= itemLengthDivide + 2) {
          $carouselItem.eq(3).addClass('scale');
          $carouselItem.eq(4).addClass('scale');
          $carouselItem.eq(5).addClass('scale');

          if (cnt == 0) {
            var $carouselCircle = $carouselItem.find(
              '.section-advantage-carousel-circle'
            );

            var bgClassList =
              'bg-dark bg-teal bg-pink bg-purple bg-orange bg-blue bg-green';
            var bgClassListArr = bgClassList.split(' ');
            var activeClass;

            for (
              var j = 0, bgClassListArrLength = bgClassListArr.length;
              j < bgClassListArrLength;
              j++
            ) {
              if (
                $carouselCircle.eq(4).filter('.' + bgClassListArr[j]).length
              ) {
                activeClass = bgClassListArr[j];

                $(
                  '.section-advantage-carousel-info-icon-container'
                ).removeClass('active');
                $(
                  '.section-advantage-carousel-info-icon-container'
                ).removeClass('pop');

                $('.section-advantage-carousel-info-icon-container')
                  .eq(j)
                  .addClass('active');
                $('.section-advantage-carousel-info-icon-container')
                  .eq(j)
                  .addClass('pop');
              }
            }

            cnt++;

            var $textOldContainer = $(
              '.section-advantage-carousel-info-title-text'
            );
            var $carouselIcon = $carouselItem.find(
              '.section-advantage-carousel-icon'
            );
            var textNew = $carouselItem.eq(4).attr('data-text');
            var textOld = $textOldContainer.text().replace(/\n|\r/g, '');
            var textOldLength = textOld.length;
            var textOldCnt = textOldLength;
            var secondTime = false;

            var image = $carouselIcon.eq(4).find('img');
            $('.section-advantage-carousel-info-icon-wrapper')
              .find('img')
              .attr('src', image.attr('src'));

            function loopChar() {
              if (!secondTime) {
                setTimeout(function () {
                  if (textOldCnt <= textOldLength && textOldCnt >= 0) {
                    loopChar();
                    textOldCnt--;

                    $textOldContainer.text(
                      textOld.substring(0, textOldCnt - 1)
                    );
                  }

                  if (textOldCnt == 0) {
                    secondTime = true;
                  }
                }, 10);
              } else {
                setTimeout(function () {
                  if (textOldCnt <= textNew.length) {
                    loopChar();
                    textOldCnt++;

                    $textOldContainer.text(
                      textNew.substring(0, textOldCnt - 1)
                    );
                  }
                }, 50);
              }
            }

            loopChar();
          }
        } else {
          $carouselItem.eq(i).removeClass('scale');
        }
      }
    }

    setInterval(move, 200 * 10);

    function startDashCounterSequence() {
      $('.section-scale-stat-pulse').addClass(
        'section-scale-stat-pulse-orange'
      );
      setTimeout(function () {
        $('.section-scale-stat-pulse-orange').toggleClass(
          'section-scale-stat-pulse-blue'
        );
      }, 1000 * 10);

      $('.section-scale-stat-heading').text('--');
      $('.section-scale-stat-heading').eq(0).text('Activating');
      $('.section-scale-stat-heading').eq(3).text('Store 21 Ltd');
      $('.section-scale-stat-heading').eq(2).text('UK');

      setTimeout(function () {
        $('.section-scale-stat-heading').eq(0).text('Online');
        $('.section-scale-stat-heading').eq(2).text('UK');
      }, 1000 * 6);

      setTimeout(function () {
        $('.section-scale-stat-heading').eq(0).text('Live');
        $('.section-scale-stat-heading').eq(3).text('Store 21 Ltd');
      }, 1000 * 10);

      var mbDigit = 1;
      var mbString = '';

      pprog1 = setTimeout(function () {
        $('.section-scale-stat-heading')
          .eq(1)
          .text(mbDigit + mbString);

        if (mbDigit < 29) {
          pprog2 = setInterval(function () {
            if (mbDigit < 29) {
              mbDigit += 1;
            }

            $('.section-scale-stat-heading')
              .eq(1)
              .text(mbDigit + mbString);
          }, 100 * 10);
        }
      }, 1000 * 11);
    }

    setInterval(function () {
      clearTimeout(pprog1);
      clearInterval(pprog2);
      $('.section-scale-stat-pulse').removeClass(
        'section-scale-stat-pulse-blue'
      );
      startDashCounterSequence();
    }, 30000);

    startDashCounterSequence();
  },
};

$(function () {
  page.init();
});
