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
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = 800;
    const height = 800;
    const radius = 300;
    const levels = 4; // concentric circles
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const center = { x: width / 2, y: height / 2 };
    const angleSlice = (2 * Math.PI) / data.length;

    // scale for skill percentage
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // draw concentric circles
    for (let i = 1; i <= levels; i++) {
      svg.append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", (radius / levels) * i)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.1)")
        .attr("stroke-width", 1);
    }

    // calculate points
    const lineGenerator = d3.lineRadial<SkillData>()
      .radius((d: SkillData) => rScale(d.level))
      .angle((_: SkillData, i: number) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // draw area
    svg.append("path")
      .attr("d", lineGenerator(data))
      .attr("transform", `translate(${center.x},${center.y})`)
      .attr("fill", "#ff394a")
      .attr("fill-opacity", 0.1)
      .attr("stroke", "#ff394a")
      .attr("stroke-width", 3);

    // add labels
    data.forEach((d, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const labelRadius = radius + 50;
      const x = center.x + Math.cos(angle) * labelRadius;
      const y = center.y + Math.sin(angle) * labelRadius;
      //const degrees = (angle * 180) / Math.PI;
      svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("fill", "#fff")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        //.attr("transform", `rotate(${degrees}, ${x}, ${y})`)
        .text(d.name);
    });
  }, [data]);

  return <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 800" style={{ aspectRatio: "1 / 1" }} />;
}
