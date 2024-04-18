document.addEventListener("DOMContentLoaded", (event) => {
  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset;

    if (scrollTop > 0) {
      elements.posAnimationIdle.style.display = "none";
      elements.posAnimation.style.display = "block";
    } else {
      elements.posAnimationIdle.style.display = "block";
      elements.posAnimation.style.display = "none";
    }
  });
});
