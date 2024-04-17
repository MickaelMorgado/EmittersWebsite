document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(
    ScrollTrigger,
    ScrollMagic,
    Observer,
    MotionPathPlugin,
    CustomEase
  );

  var debug = false;
  var tl = gsap.timeline();
  var myTLProgress = 0;
  let path = elements.path;
  let svg = elements.svg;

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

  // Creating a SVG path:

  let rawPath = MotionPathPlugin.arrayToRawPath(converted, { curviness: 2 });

  path.setAttribute("d", MotionPathPlugin.rawPathToString(rawPath));

  // place the converted points as <circle> elements
  for (let i = 0; i < converted.length; i++) {
    createSVG("circle", svg, {
      cx: converted[i].x,
      cy: converted[i].y,
      r: 0.5,
      fill: debug ? "red" : "none",
    });
  }

  // helper function for creating SVG elements
  function createSVG(type, container, attributes) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", type),
      reg = /([a-z])([A-Z])/g,
      p;
    for (p in attributes) {
      element.setAttributeNS(
        null,
        p.replace(reg, "$1-$2").toLowerCase(),
        attributes[p]
      );
    }
    container.appendChild(element);
    return element;
  }

  // Ease to control speed of vertical position progress:
  CustomEase.create(
    "customEase",
    "M0,0 C0.378,0 0.126,0.5 0.4,0.5 0.539,0.5 0.53,0.521 0.572,0.548 0.643,0.593 0.681,0.816 0.787,0.948 0.836,1.01 0.926,1 1,1 "
  );

  // Main POS animation:
  tl.to(elements.posAnimation, {
    scrollTrigger: {
      trigger: elements.posArea,
      start: "500px center",
      end: "bottom center",
      scrub: 0.4,
      markers: false,
      onUpdate: (self) => {
        myTLProgress = self.progress;
      },
    },
    motionPath: {
      path: path,
      align: path,
      alignOrigin: [0.5, 0.5],
      reverse: true,
    },
    onUpdate: function () {
      if (myTLProgress < 0.5) {
        scale = 0.8 + myTLProgress * 1;
      } else {
        scale = 1.2 - (myTLProgress - 0.5) * 1;
      }

      gsap.set(elements.posAnimation, { scaleX: scale, scaleY: scale });
    },
    ease: "customEase",
    immediateRender: false,
    /*
    onComplete: function () {
      // Once the animation is complete, reverse the scale back to 1
      tl.to(elements.posAnimation, {
        scale: 1,
        //ease: "customEase",
      });
    },
    */
  });

  // Black POS:
  tl.to(elements.posBlack2, {
    scrollTrigger: {
      trigger: elements.section2,
      start: "-300px center",
      end: "600px center",
      scrub: 0.4,
      markers: false,
    },
    transformOrigin: "center center",
    scale: 0.9,
    rotation: -5,
    duration: 5,
  });

  // var scene = new ScrollMagic.Scene({
  //   duration: h,
  //   triggerHook: 0.2,
  // })
  //   .setTween(tl)
  //   .addTo(controller);
});
