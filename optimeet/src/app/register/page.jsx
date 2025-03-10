"use client";
import { useState, useEffect } from "react";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    timeZone: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Automatically get user's time zone on component mount
  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setForm((prev) => ({ ...prev, timeZone: userTimeZone }));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous error
    setSuccess(""); // Clear previous success

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        // Show specific error message from API response if available
        setError(data.error || "Something went wrong!");
      } else {
        setSuccess("Account created! You can now log in.");
        setForm({
          name: "",
          email: "",
          password: "",
          timeZone: form.timeZone // Keep the timeZone
        });
      }
    } catch (err) {
      setError("An unexpected error occurred!");
      console.error(err);
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>

        {error && <p className="error" style={{ color: "red" }}>{error}</p>}
        {success && <p className="success" style={{ color: "green" }}>{success}</p>}
      </form>
    </div>
  );
}
