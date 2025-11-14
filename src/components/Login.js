import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/api";

export default function Login(){
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(user, pass);
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      navigate("/");
    } catch (err) {
      alert("Login failed: check credentials");
      console.error(err.response?.data || err);
    }
  };

  return (
    <div style={{maxWidth:400, margin:"50px auto"}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div>
          <label>Username</label>
          <input value={user} onChange={e=>setUser(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
