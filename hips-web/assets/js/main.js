// Function to get coordinates of an element:
const getCoords = (elem) => {
  const box = elem.getBoundingClientRect();
  return {
    x: box.top + pageYOffset,
    y: box.left + pageXOffset,
  };
};

document.addEventListener("DOMContentLoaded", (event) => {
  const frameStart = 143; // 133;
  const frameCount = 300; // 226;

  let isFirstSectionScrolled = false;
  let isSecondSectionScrolled = false;

  // Function to generate and append frame elements
  const generateFrames = () => {
    const container = elements.posAnimation;

    for (let i = frameStart; i < frameCount; i++) {
      const frame = document.createElement("div");
      frame.classList.add("js-generated-frame");
      frame.style.backgroundImage = `url('./assets/images/Render0099-10000${i}.png')`;
      frame.style.visibility = "hidden";
      container.appendChild(frame);
    }
  };

  // Call the function to generate frames:
  generateFrames();

  // Get all frame elements:
  const frames = document.querySelectorAll(".js-generated-frame");

  // Function to update the frame at a given index:
  const updateFrame = (index) => {
    if (index >= frameCount - frameStart) {
      return;
    } else {
      frames.forEach((frame, idx) => {
        frame.style.visibility = idx === index ? "visible" : "hidden"; // Show the frame at the given index, hide others
      });
    }
  };

  // Animate frames based on scroll position:
  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset;
    const maxScrollTop = elements.html.scrollHeight - window.innerHeight;
    const scrollFraction = (scrollTop / maxScrollTop) * 0.8; // * 1.7
    const frameIndex = Math.min(
      frameCount - 1,
      Math.ceil(scrollFraction * frameCount)
    );

    if (scrollTop > 0) {
      elements.posAnimationIdle.style.display = "none";
      elements.posAnimation.style.display = "block";
    } else {
      elements.posAnimationIdle.style.display = "block";
      elements.posAnimation.style.display = "none";
    }

    if (!isFirstSectionScrolled && scrollFraction < 0.01) {
      elements.posAnimation.classList.add("first-section");
      isFirstSectionScrolled = true;
    } else {
      elements.posAnimation.classList.remove("first-section");
    }

    if (!isSecondSectionScrolled && scrollFraction > 0.3) {
      elements.posAnimation.classList.add("second-section");
      isSecondSectionScrolled = true;
    } else {
      elements.posAnimation.classList.remove("second-section");
    }

    requestAnimationFrame(() => {
      updateFrame(frameIndex);
    });
  });
});
