"use client";

import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export function useGsapEffects() {
  useEffect(() => {
    // Ensure SVG visible
    const motionSVG = document.querySelector("#motionSVG") as SVGSVGElement | null;
    if (motionSVG) gsap.set(motionSVG, { autoAlpha: 1 });

    // Select path
    const path = document.querySelector("#motionPathHighlight") as SVGPathElement | null;
    if (!path) return;

    // Precompute path length
    const pathLength = path.getTotalLength() + 500;
    path.style.strokeDasharray = pathLength.toString();
    path.style.strokeDashoffset = pathLength.toString();

    // Initialize ScrollSmoother first
    const smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 2,
      effects: true,
      smoothTouch: 0.1
    });

    const contentEl = smoother.content() as HTMLElement;

    // ScrollTrigger to map scroll to stroke offset
    ScrollTrigger.create({
      trigger: contentEl,
      start: 0,
      end: () => contentEl.scrollHeight - window.innerHeight - 2000,
      scrub: true,
      onUpdate: (self) => {
        path.style.strokeDashoffset = (pathLength * (1 - self.progress)).toString();
      },
    });

    // Optional: grid filters (unchanged)
    const toolsCategories = document.querySelectorAll(".badge") as NodeListOf<HTMLElement>;
    const toolsGrid = document.getElementById("tools-grid");
    toolsCategories.forEach((category) => {
      category.addEventListener("click", () => {
        const elements = toolsGrid?.children as HTMLCollectionOf<HTMLElement>;
        if (!elements) return;
        const selectedCategory = category.dataset.filter;
        toolsCategories.forEach((c) => c.classList.remove("active"));
        category.classList.add("active");
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          element.classList.toggle("hidden", selectedCategory !== "all" && element.dataset.category !== selectedCategory);
        }
      });
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (smoother) smoother.kill();
      toolsCategories.forEach((category) => category.replaceWith(category.cloneNode(true)));
    };
  }, []);
}
