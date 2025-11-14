// src/components/Transactions.js
import React, { useEffect, useState, useRef } from "react";
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
  getCategories,
} from "../api/api";
import * as d3 from "d3";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ amount: "", category: "", date: "", description: "" });
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });
  const chartRef = useRef(null);

  const load = async (p = 1, appliedFilters = filters) => {
    try {
      const params = { page: p };
      if (appliedFilters.category) params.category = appliedFilters.category;
      if (appliedFilters.startDate) params.start_date = appliedFilters.startDate;
      if (appliedFilters.endDate) params.end_date = appliedFilters.endDate;

      const res = await getTransactions(params);
      setTransactions(res.data.results || res.data);
      setMeta({ count: res.data.count, next: res.data.next, previous: res.data.previous });
    } catch (err) {
      console.error("Error loading transactions", err);
    }
  };

  useEffect(() => {
    load();
    (async () => {
      try {
        const r = await getCategories();
        setCategories(r.data.results || r.data);
      } catch (e) {
        console.error("Error loading categories", e);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.date) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await createTransaction({
        amount: parseFloat(form.amount),
        category: parseInt(form.category),
        date: form.date,
        description: form.description,
      });
      setForm({ amount: "", category: "", date: "", description: "" });
      load(page);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Error creating transaction");
    }
  };

  const startEdit = (tx) => setEditing({ ...tx });
  const cancelEdit = () => setEditing(null);
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateTransaction(editing.id, {
        amount: parseFloat(editing.amount),
        category: parseInt(editing.category),
        date: editing.date,
        description: editing.description,
      });
      cancelEdit();
      load(page);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Error updating transaction");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete transaction?")) return;
    try {
      await deleteTransaction(id);
      load(page);
    } catch (err) {
      console.error(err);
    }
  };

  // Draw chart of expenses by category
  useEffect(() => {
    if (!chartRef.current) return;
    const expensesByCategory = categories.map(c => {
      const total = transactions
        .filter(tx => tx.category === c.id)
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      return { category: c.name, total };
    }).filter(d => d.total > 0);

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();
    const width = 400, height = 250, margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const x = d3.scaleBand().domain(expensesByCategory.map(d => d.category))
      .range([margin.left, width - margin.right]).padding(0.4);
    const y = d3.scaleLinear()
      .domain([0, d3.max(expensesByCategory, d => d.total) || 100])
      .range([height - margin.bottom, margin.top]);

    svg.selectAll("rect")
      .data(expensesByCategory)
      .join("rect")
      .attr("x", d => x(d.category))
      .attr("y", d => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d.total))
      .attr("fill", "#f44336");

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x)).selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
  }, [transactions, categories]);

  // Filter handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    load(1, newFilters);
    setPage(1);
  };

  return (
    <div className="app">
      <h2>Transactions</h2>

      {/* Filter Section */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
      </div>

      {/* Transaction Form */}
      {!editing && (
        <form onSubmit={submit} style={{ marginBottom: 20 }}>
          <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit">Add Transaction</button>
        </form>
      )}

      {/* Edit Form */}
      {editing && (
        <div style={{ marginBottom: 20, border: "1px solid #ccc", padding: 10 }}>
          <h4>Edit Transaction #{editing.id}</h4>
          <form onSubmit={saveEdit}>
            <input type="number" step="0.01" value={editing.amount} onChange={e => setEditing({ ...editing, amount: e.target.value })} required />
            <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} required>
              <option value="">Select</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} required />
            <input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <button type="submit">Save</button>
            <button type="button" onClick={cancelEdit} style={{ marginLeft: 10 }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      <table border="1" cellPadding="5" style={{ width: "100%", marginBottom: 10 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.date}</td>
              <td>{tx.amount}</td>
              <td>{tx.category_name || tx.category}</td>
              <td>{tx.description}</td>
              <td>
                <button onClick={() => startEdit(tx)}>Update</button>
                <button onClick={() => remove(tx.id)} style={{ marginLeft: 5 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginBottom: 20 }}>
        <button disabled={!meta?.previous} onClick={() => { const newPage = Math.max(1, page - 1); setPage(newPage); load(newPage); }}>Prev</button>
        <span style={{ margin: "0 8px" }}>Page {page}</span>
        <button disabled={!meta?.next} onClick={() => { const newPage = page + 1; setPage(newPage); load(newPage); }}>Next</button>
      </div>

      {/* Chart */}
      <div>
        <h3>Expenses by Category</h3>
        <svg ref={chartRef} width={400} height={250}></svg>
      </div>
    </div>
  );
}
