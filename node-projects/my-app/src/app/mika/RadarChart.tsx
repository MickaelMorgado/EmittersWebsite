import * as d3 from "d3";
import { useEffect, useRef } from "react";

export default function RadarChart({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
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
        .attr("stroke", "#222")
        .attr("stroke-width", 2);
    }

    // calculate points
    const lineGenerator = d3.lineRadial()
      .radius(d => rScale(d.level))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // draw area
    svg.append("path")
      .attr("d", lineGenerator(data))
      .attr("transform", `translate(${center.x},${center.y})`)
      .attr("fill", "#ef4444")
      .attr("fill-opacity", 0.1)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 3);

    // add labels
    data.forEach((d, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = center.x + Math.cos(angle) * (radius + 15);
      const y = center.y + Math.sin(angle) * (radius + 15);
      svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("fill", "#fff")
        .attr("font-size", 14)
        .attr("text-anchor", "middle")
        .text(d.name);
    });
  }, [data]);

  return <svg ref={svgRef} width={800} height={800} />;
}
