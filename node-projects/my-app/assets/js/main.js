$(document).ready(() => {
  $(window).on("scroll", () => {
    debugger;
    const scrollTop = window.pageYOffset;

    if (scrollTop > 0 && window.innerWidth > settings.mobileBreakpoint) {
      elements.posAnimationIdle.style.display = "none";
      elements.posAnimation.style.display = "block";
      elements.threeCanvas.style.display = "block";
    } else {
      elements.posAnimationIdle.style.display = "block";
      elements.posAnimation.style.display = "none";
      elements.threeCanvas.style.display = "none";
    }
  });

  // Remove Preloader:
  setTimeout(() => {
    elements.preloaderAnimation.classList.remove("preloader--active");
  }, 3000);
});
