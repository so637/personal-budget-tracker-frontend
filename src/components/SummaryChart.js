import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function SummaryChart({ income = 0, expense = 0 }) {
  const ref = useRef();

  useEffect(() => {
    const data = [
      { label: "Income", value: income },
      { label: "Expense", value: expense },
    ];

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove(); // clear previous chart

    const width = 250,
      height = 250,
      radius = Math.min(width, height) / 2;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(["#4CAF50", "#F44336"]);

    const pie = d3.pie().value((d) => d.value);
    const path = d3.arc().outerRadius(radius).innerRadius(70);

    const arcs = g.selectAll(".arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", path)
      .attr("fill", (d) => color(d.data.label));

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${path.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .text((d) => d.data.label);
  }, [income, expense]);

  return (
    <div className="chart">
      <h4>Income vs Expense</h4>
      <svg ref={ref}></svg>
    </div>
  );
}
