import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function BudgetChart({ budget = 0, spent = 0 }) {
  const ref = useRef();

  useEffect(() => {
    const data = [
      { label: "Budget", value: budget },
      { label: "Spent", value: spent },
    ];

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 300,
      height = 200,
      margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const chart = svg.attr("width", width).attr("height", height);

    chart
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", (d) =>
        d.label === "Budget" ? "#2196F3" : "#FF5722"
      );

    chart
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    chart
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
  }, [budget, spent]);

  return (
    <div className="chart">
      <h4>Budget vs Spent</h4>
      <svg ref={ref}></svg>
    </div>
  );
}
