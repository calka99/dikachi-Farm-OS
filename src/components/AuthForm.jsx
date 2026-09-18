"use client";

import Link from "next/link";
import { useState } from "react";
import { endpoints, saveAuthSession } from "../api/client";

export default function AuthForm({ mode = "login" }) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const session = await (isRegister
        ? endpoints.register(form)
        : endpoints.login({ username: form.username, password: form.password }));
      saveAuthSession(session);
      window.location.href = "/dashboard";
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="page-eyebrow">dikachiFarmOS / secure access</div>
        <h1>{isRegister ? "Create your farm account" : "Welcome back"}</h1>
        <p className="auth-intro">
          {isRegister ? "Set up your workspace and start managing the field." : "Sign in to continue managing your farm operations."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Username or email
            <input name="username" value={form.username} onChange={updateField} autoComplete="username" required />
          </label>

          {isRegister && (
            <label>
              Email address
              <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
            </label>
          )}

          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={updateField} autoComplete={isRegister ? "new-password" : "current-password"} required />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Working..." : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? "Already have an account? " : "New to dikachiFarmOS? "}
          <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
        </p>
      </section>
    </main>
  );
}
