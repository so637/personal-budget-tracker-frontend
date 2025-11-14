import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const activeStyle = {
    fontWeight: "bold",
    color: "#1976d2",
  };

  return (
    <nav style={{ display: "flex", gap: 20, padding: 10, borderBottom: "1px solid #ccc" }}>
      <NavLink to="/" style={({ isActive }) => (isActive ? activeStyle : undefined)} end>
        Dashboard
      </NavLink>
      <NavLink to="/transactions" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        Transactions
      </NavLink>
      <NavLink to="/budgets" style={({ isActive }) => (isActive ? activeStyle : undefined)}>
        Budgets
      </NavLink>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
        style={{ marginLeft: "auto", background: "#f44336", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 4 }}
      >
        Logout
      </button>
    </nav>
  );
}
