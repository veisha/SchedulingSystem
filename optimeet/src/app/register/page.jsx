"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Register.module.css"; // Import your CSS module here!

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    timeZone: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setForm((prev) => ({ ...prev, timeZone: userTimeZone }));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
  
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        setError(data.error || "Something went wrong!");
      } else {
        setSuccess("Account created! You can now log in.");
        setForm({
          name: "",
          email: "",
          password: "",
          timeZone: form.timeZone
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred!");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>Register</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className={styles.input}
          />

          <button type="submit" className={styles.button}>Register</button>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <p className={styles.footer}>
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
