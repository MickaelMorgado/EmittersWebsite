import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface SkillData {
  name: string;
  level: number;
}

interface RadarChartProps {
  data: SkillData[];
}

export default function RadarChart({ data }: RadarChartProps) {
  const backgroundSvgRef = useRef<SVGSVGElement>(null);
  const foregroundSvgRef = useRef<SVGSVGElement>(null);
  const labelsSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const size = 600;

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = size;
    const height = size;
    const radius = size / 2;
    const levels = 4; // concentric circles
    const center = { x: width / 2, y: height / 2 };
    const angleSlice = (2 * Math.PI) / data.length;

    // scale for skill percentage
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Background SVG - concentric circles
    const backgroundSvg = d3.select(backgroundSvgRef.current);
    backgroundSvg.selectAll("*").remove();

    for (let i = 1; i <= levels; i++) {
      backgroundSvg.append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", (radius / levels) * i)
        .attr("fill", "none")
        .attr("stroke", "rgba(30,30,30,1)")
        .attr("stroke-width", 1);
    }

    // Foreground SVG - filled area (elevated)
    const foregroundSvg = d3.select(foregroundSvgRef.current);
    foregroundSvg.selectAll("*").remove();

    const lineGenerator = d3.lineRadial<SkillData>()
      .radius((d: SkillData) => rScale(d.level))
      .angle((_: SkillData, i: number) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    foregroundSvg.append("path")
      .attr("d", lineGenerator(data))
      .attr("transform", `translate(${center.x},${center.y})`)
      .attr("fill", "#ff394a")
      .attr("fill-opacity", 0.1)
      .attr("stroke", "#ff394a")
      .attr("stroke-width", 1)
      //.attr("filter", "drop-shadow(0 0 8px rgba(255, 57, 74, 0.3))");

    // Labels SVG - at normal depth
    const labelsSvg = d3.select(labelsSvgRef.current);
    labelsSvg.selectAll("*").remove();

    data.forEach((d, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const labelRadius = radius - 70; // This setup make sure that labels stay inside canvas
      const x = center.x + Math.cos(angle) * labelRadius;
      const y = center.y + Math.sin(angle) * labelRadius;
      labelsSvg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("fill", "#fff")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(d.name);
    });
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Calculate rotation angles (-20 to 20 degrees)
      const rotateY = (mouseX / (rect.width / 2)) * 20;
      const rotateX = -(mouseY / (rect.height / 2)) * 20;

      container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      container.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
        position: 'relative'
      }}
    >
      {/* Background layer - circles */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          zIndex: 1,
          transform: 'translateZ(-200px)'
        }}
      >
        <svg
          ref={backgroundSvgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: 'block'
          }}
        />
      </div>

      {/* Foreground layer - filled area (elevated) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          zIndex: 2,
          transform: 'translateZ(-20px)'
        }}
      >
        <svg
          ref={foregroundSvgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: 'block'
          }}
        />
      </div>

      {/* Labels layer - at normal depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          zIndex: 3,
          transform: 'translateZ(50px)'
        }}
      >
        <svg
          ref={labelsSvgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}
