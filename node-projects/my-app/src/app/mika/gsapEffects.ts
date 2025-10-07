"use client";

import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
// import { MotionPathHelper } from "gsap/MotionPathHelper"; // Optional helper

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, ScrollSmoother);

export function useGsapEffects() {
  useEffect(() => {
    // Initial setup
    gsap.set("#motionSVG", { autoAlpha: 1 });

    const highlightPath = document.querySelector("#motionPathHighlight") as SVGGeometryElement;
    if (!highlightPath) return;

    const pathLength = highlightPath.getTotalLength();

    gsap.set(highlightPath, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });

    // Animation - follows full page scroll with path-based progress
    gsap.to("#tractor", {
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0,
        markers: false,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.set(highlightPath, {
            strokeDashoffset: pathLength * (1 - progress),
          });
        },
        onEnter: () => {
          gsap.set(highlightPath, {
            strokeDashoffset: pathLength,
          });
        },
        onEnterBack: () => {
          gsap.set(highlightPath, {
            strokeDashoffset: pathLength,
          });
        },
      },
      motionPath: {
        path: "#motionPathHighlight",
        align: "#motionPathHighlight",
        alignOrigin: [0.5, 0.5],
        autoRotate: 90,
      },
    });

    // Initialize ScrollSmoother
    ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 2,
      effects: true,
      smoothTouch: 0.1,
    });

    // Tools grid filter
    const toolsCategories = document.querySelectorAll(".badge") as NodeListOf<HTMLElement>;
    const toolsGrid = document.getElementById("tools-grid");

    toolsCategories.forEach((category) => {
      category.addEventListener("click", () => {
        const elements = toolsGrid?.children as HTMLCollectionOf<HTMLElement>;
        if (!elements) return;
        const selectedCategory = category.dataset.filter;

        toolsCategories.forEach((category) => {
          category.classList.remove("active");
        });
        category.classList.add("active");

        if (selectedCategory === "all") {
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            element.classList.remove("hidden");
          }
          return;
        }

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          element.classList.add("hidden");
        }

        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.dataset.category === selectedCategory) {
            element.classList.remove("hidden");
          }
        }
      });
    });

    // Cleanup function to remove event listeners on unmount
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.killTweensOf(highlightPath);
      // Remove event listeners from badges
      toolsCategories.forEach((category) => {
        category.replaceWith(category.cloneNode(true));
      });
    };
  }, []);
}
