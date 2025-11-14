// src/components/Dashboard.js
import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { getTransactionSummary, getBudgetSummary } from "../api/api";

export default function Dashboard() {
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0 });
  const [budgetSummary, setBudgetSummary] = useState({ total_budget: 0, total_spent: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  const summaryChartRef = useRef(null);
  const budgetChartRef = useRef(null);

  // Load dashboard data
  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, budgetRes] = await Promise.all([
        getTransactionSummary(),
        getBudgetSummary(),
      ]);

      setSummary({
        total_income: txRes.data?.total_income ?? txRes.data?.income ?? 0,
        total_expense: txRes.data?.total_expense ?? txRes.data?.expense ?? 0,
      });

      const totalBudget = budgetRes.data?.total_budget ?? 0;
      const totalSpent = budgetRes.data?.total_spent ?? 0;
      setBudgetSummary({
        total_budget: totalBudget,
        total_spent: totalSpent,
        remaining: budgetRes.data?.remaining ?? totalBudget - totalSpent,
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const balance = (summary.total_income || 0) - (summary.total_expense || 0);

  // Draw a D3 bar chart
  const drawBarChart = (ref, data, colors = []) => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 400;
    const height = 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // X and Y scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.4);

    const yMax = Math.max(...data.map((d) => d.value), 100); // min 100 for visibility
    const y = d3.scaleLinear().domain([0, yMax]).range([height - margin.bottom, margin.top]);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "#333")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Draw bars
    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", (d, i) => colors[i] || "#2196f3")
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1).html(`${d.label}: ₹${d.value}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", event.pageX + 10 + "px").style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    // Y axis
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
  };

  // Draw charts on data change
  useEffect(() => {
    drawBarChart(
      summaryChartRef,
      [
        { label: "Income", value: summary.total_income },
        { label: "Expense", value: summary.total_expense },
      ],
      ["#4caf50", "#f44336"]
    );

    drawBarChart(
      budgetChartRef,
      [
        { label: "Budget", value: budgetSummary.total_budget },
        { label: "Spent", value: budgetSummary.total_spent },
      ],
      ["#2196f3", "#f44336"]
    );
  }, [summary, budgetSummary]);

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="dashboard" style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        <div style={{ flex: 1, padding: 20, borderRadius: 8, background: "#e8f5e9", textAlign: "center" }}>
          <h3>Total Income</h3>
          <p style={{ color: "green", fontWeight: "bold", fontSize: 20 }}>₹{summary.total_income}</p>
        </div>
        <div style={{ flex: 1, padding: 20, borderRadius: 8, background: "#ffebee", textAlign: "center" }}>
          <h3>Total Expenses</h3>
          <p style={{ color: "red", fontWeight: "bold", fontSize: 20 }}>₹{summary.total_expense}</p>
        </div>
        <div style={{ flex: 1, padding: 20, borderRadius: 8, background: "#e3f2fd", textAlign: "center" }}>
          <h3>Balance</h3>
          <p style={{ color: "blue", fontWeight: "bold", fontSize: 20 }}>₹{balance}</p>
        </div>
      </div>

      {/* Charts */}
      <div style={{ marginBottom: 40 }}>
        <h3>Income vs Expenses</h3>
        <svg ref={summaryChartRef} width={400} height={250}></svg>
      </div>

      <div>
        <h3>Budget vs Spent</h3>
        <p>Budget: ₹{budgetSummary.total_budget}</p>
        <p>Spent: ₹{budgetSummary.total_spent}</p>
        <p>Remaining: ₹{budgetSummary.remaining}</p>
        <svg ref={budgetChartRef} width={400} height={250}></svg>
      </div>
    </div>
  );
}
