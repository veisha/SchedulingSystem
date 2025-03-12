'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './Login.module.css'; // Assuming you have a Login.module.css

export default function LoginPage() {
  const { data: session } = useSession(); // relies on the top-level <SessionProvider>
  const router = useRouter();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });
  
      if (res.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Login error:", error);
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Login</h1>

        {error && <div className={styles.error}>{error}</div>}

        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <button type="submit" className={styles.button}>Sign In</button>

        <p className={styles.text}>
          Don&apos;t have an account?{' '}
          <a href="/register" className={styles.link}>Register</a>
        </p>
      </form>
    </div>
  );
}
