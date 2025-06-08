// TODO: use window.onload = function() { to wait for all images to load before
$(document).ready(() => {
  gsap.registerPlugin(
    ScrollTrigger,
    ScrollMagic,
    Observer,
    MotionPathPlugin,
    CustomEase
  );

  // Debugs: -------------------------------------------------------------------
  var debug = false;
  /*
  // Adding some debug styles:
  if (debug) {
    elements.posAnimation.classList.add('d-pos-animation');
    elements.posAnimationSVGWrapper.classList.add('d-pos-animation-svg');
    elements.posAnimationPointWrapper.classList.add('d-point-debugger');
  }

  if (window.innerWidth > settings.mobileBreakpoint) {
    // Image Sequence Animation: ------------------------------------------------
    const frameStart = 143; // 133;
    const frameEnd = 300; // 226;
    const animationLength = frameEnd - frameStart;
    var tl = gsap.timeline();
    let path = elements.path;
    let svg = elements.svg;

    // Function to generate and append frame elements
    const generateFrames = () => {
      const container = elements.posAnimation;

      for (let i = frameStart; i <= frameEnd; i++) {
        const frame = document.createElement('div');
        frame.classList.add('js-generated-frame');
        frame.style.backgroundImage = `url('./assets/images/Render0099-10000${i}.png')`;
        frame.style.visibility = 'hidden';
        container.appendChild(frame);
      }
    };

    // Call the function to generate frames:
    //generateFrames();

    // Get all frame elements:
    const frames = document.querySelectorAll('.js-generated-frame');

    // Function to update the frame at a given index:
    const updateFrame = (index) => {
      if (index >= animationLength) {
        return;
      } else {
        frames.forEach((frame, idx) => {
          frame.style.visibility = idx === index ? 'visible' : 'hidden'; // Show the frame at the given index, hide others
        });
      }
    };

    // GSAP Animation: ----------------------------------------------------------

    // Fix Coordinates:
    let fromElement = elements.posArea;
    let toElement = elements.path;
    let anchors = [];

    // Define an array of point elements
    let pointElements = elements.posAnimationPoints;

    // Iterate over the point elements
    for (let i = 0; i < pointElements.length; i++) {
      let relativePoint = MotionPathPlugin.getRelativePosition(
        elements.posAnimationSVGWrapper,
        pointElements[i]
      );
      // Add the relative position to the anchors array
      anchors.push({ x: relativePoint.x, y: relativePoint.y });
    }
    let matrix = MotionPathPlugin.convertCoordinates(fromElement, toElement);
    let converted = anchors.map((p) => matrix.apply(p));
    let rawPath = MotionPathPlugin.arrayToRawPath(converted, { curviness: 2 });

    path.setAttribute('d', MotionPathPlugin.rawPathToString(rawPath));

    // place the converted points as <circle> elements
    for (let i = 0; i < converted.length; i++) {
      createSVG('circle', svg, {
        cx: converted[i].x,
        cy: converted[i].y,
        r: 0.5,
        fill: debug ? 'red' : 'none',
      });
    }

    // helper function for creating SVG elements
    function createSVG(type, container, attributes) {
      var element = document.createElementNS(
          'http://www.w3.org/2000/svg',
          type
        ),
        reg = /([a-z])([A-Z])/g,
        p;
      for (p in attributes) {
        element.setAttributeNS(
          null,
          p.replace(reg, '$1-$2').toLowerCase(),
          attributes[p]
        );
      }
      container.appendChild(element);
      return element;
    }

    // Ease to control speed of vertical position progress:
    CustomEase.create(
      'oldEase',
      'M0,0 C0.378,0 0.125,0.3 0.4,0.3 0.539,0.3 0.621,0.316 0.663,0.343 0.734,0.388 0.738,0.604 0.77,0.773 0.783,0.847 0.853,1 1,1 '
    );
    CustomEase.create(
      'newEase',
      'M0,0 C0,0 0.051,0.001 0.07,0.021 0.096,0.049 0.105,0.146 0.157,0.146 0.2,0.146 0.255,0.148 0.28,0.16 0.334,0.184 0.309,0.3 0.38,0.3 0.531,0.3 0.36,0.3 0.516,0.3 0.874,0.3 0.608,1 0.87,1 1.034,1 1,1 1,1 '
    );
    const easeScale = [0, 1, 0.4, 0.4, 1, 0.8, 0];

    // Main POS animation:
    tl.to(elements.posAnimation, {
      scrollTrigger: {
        trigger: elements.posArea,
        start: '500px center',
        end: '90% center',
        scrub: 0.4,
        onUpdate: (self) => {
          const minScale = 0.75; // Minimum scale
          const maxScale = 1.2; // Maximum scale
          const progress = self.progress;
          const easeIndex = progress * (easeScale.length - 1); // Calculate the index in the easeScale array
          const easeIndexFloor = Math.floor(easeIndex);
          const easeIndexFraction = easeIndex - easeIndexFloor; // Get the fractional part

          // Check if easeIndexFloor is within the valid range
          if (easeIndexFloor >= 0 && easeIndexFloor < easeScale.length - 1) {
            const easedProgress =
              easeScale[easeIndexFloor] +
              easeIndexFraction *
                (easeScale[easeIndexFloor + 1] - easeScale[easeIndexFloor]); // Interpolate between easing values
            const scale = minScale + easedProgress * (maxScale - minScale); // Interpolate between minScale and maxScale based on the eased progress

            // SCALE ANIMATION:
            gsap.set(elements.posAnimation, { scale: scale });

            // FRAME ANIMATION:
            let interpolatedIndex = Math.ceil(
              gsap.utils.interpolate(0, animationLength, progress * 1.07)
            );
            updateFrame(interpolatedIndex);
          }
        },
      },
      motionPath: {
        path: path,
        align: path,
        alignOrigin: [0.5, 0.5],
        reverse: true,
      },
      ease: 'newEase', // The "ease" property seems to be related to timeline, so it can affect the MotionPath following speed but might not speed up the vertical progress from ScrollTrigger
      immediateRender: false,
    });
  }


  // Content Animations:
  const contentElements = elements.contents;

  contentElements.forEach((contentElement, index) => {
    gsap.to(contentElement, {
      x: '0',
      opacity: 1,
      duration: 2,
      scrollTrigger: {
        trigger: contentElement.parentElement,
        start: '-25% center',
        end: '25% center',
        scrub: 1,
        id: `contentAnimation-${index}`,
      },
    });
  });
    */
});
