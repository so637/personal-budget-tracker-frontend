// src/components/Budgets.js
import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
} from "../api/api";

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ month: "", amount: "" });
  const [editing, setEditing] = useState(null);
  const [summary, setSummary] = useState(null); // total budget summary
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const chartRef = useRef(null);

  // Load budgets
  const loadBudgets = async (p = 1) => {
    try {
      const res = await getBudgets({ page: p });
      setBudgets(res.data.results || res.data);
      setMeta({
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
      });
    } catch (err) {
      console.error("Error loading budgets:", err);
    }
  };

  // Load summary for chart
  const loadSummary = async () => {
    try {
      const res = await getBudgetSummary();
      setSummary(res.data || res);
    } catch (err) {
      console.error("Error loading budget summary:", err);
    }
  };

  useEffect(() => {
    loadBudgets(page);
    loadSummary();
  }, [page]);

  // Add new budget
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, month: `${form.month}-01` };
      await createBudget(payload);
      setForm({ month: "", amount: "" });
      loadBudgets(page);
      loadSummary();
    } catch (err) {
      console.error("Error creating budget:", err.response?.data || err);
      alert("Failed to add budget");
    }
  };

  // Edit budget
  const startEdit = (b) => {
    setEditing({ id: b.id, month: b.month.slice(0, 7), amount: b.amount });
  };
  const cancelEdit = () => setEditing(null);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateBudget(editing.id, {
        month: `${editing.month}-01`,
        amount: parseFloat(editing.amount),
      });
      cancelEdit();
      loadBudgets(page);
      loadSummary();
    } catch (err) {
      console.error("Error updating budget:", err);
      alert("Failed to update budget");
    }
  };

  // Delete budget
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await deleteBudget(id);
      loadBudgets(page);
      loadSummary();
    } catch (err) {
      console.error("Error deleting budget:", err);
    }
  };

  // Draw D3 chart for total budget vs total spent
  useEffect(() => {
    if (!summary) return;

    const data = [
      { label: "Budget", value: summary.total_budget },
      { label: "Spent", value: summary.total_spent },
    ];

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove(); // clear previous chart

    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

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

    // Bars
    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", (d) => (d.label === "Budget" ? "#4caf50" : "#f44336"));

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    // Y axis
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
  }, [summary]);

  return (
    <div className="app">
      <h2>Budgets</h2>

      {/* Add / Edit Form */}
      {editing ? (
        <form onSubmit={handleSaveEdit} style={{ marginBottom: 20 }}>
          <h4>Edit Budget #{editing.id}</h4>
          <div>
            <label>Month</label>
            <input
              type="month"
              value={editing.month}
              onChange={(e) => setEditing({ ...editing, month: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
              required
            />
          </div>
          <button type="submit">Save</button>
          <button type="button" onClick={cancelEdit} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        </form>
      ) : (
        <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
          <div>
            <label>Month</label>
            <input
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <button type="submit">Add Budget</button>
        </form>
      )}

      {/* Budget Table */}
      <table border="1" cellPadding="5" style={{ marginBottom: 20 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Month</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.month}</td>
              <td>{b.amount}</td>
              <td>
                <button onClick={() => startEdit(b)}>Update</button>
                <button onClick={() => handleDelete(b.id)} style={{ marginLeft: 5 }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginBottom: 20 }}>
        <button
          disabled={!meta?.previous}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          Prev
        </button>
        <span style={{ margin: "0 8px" }}>Page {page}</span>
        <button
          disabled={!meta?.next}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* D3 Chart */}
      <h3>Budget vs Actual Expenses</h3>
      <svg ref={chartRef} width={400} height={300}></svg>
    </div>
  );
}
