var elements = {
  body: document.querySelector("body"),
  banner: document.querySelector("#section0"),
  contents: document.querySelectorAll(".content"),
  html: document.querySelector("html"),
  posAnimationSVGWrapper: document.querySelector("#pos-animation-svg"),
  path: document.querySelector("#pos-animation-svg path"),
  posAnimationIdle: document.querySelector("#pos-animation-idle"),
  posArea: document.querySelector("#gsap-pos-area"),
  posAnimation: document.querySelector("#pos-animation"),
  posAnimationPointWrapper: document.querySelector("#pos-animation-points"),
  posAnimationPoints: document.querySelectorAll(
    "#pos-animation-points .d-point"
  ),
  posBlack: document.querySelector("#pos-black"),
  posBlack2: document.querySelector("#pos-black-2"),
  preloaderAnimation: document.querySelector("#preloader-animation"),
  threeCanvas: document.querySelector("#floating-canvas"),
  section2: document.querySelector("#section2"),
  svg: document.querySelector("#pos-animation-svg svg"),
};

settings = {
  mobileBreakpoint: 992,
};

window.elements = elements;
