"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { endpoints } from "@/api/client";

const EMPTY_PROFILE = { username: "", email: "", first_name: "", last_name: "" };

export default function ProfilePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    endpoints.me()
      .then((data) => setProfile(data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (event) => {
    setProfile({ ...profile, [event.target.name]: event.target.value });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const updated = await endpoints.updateProfile(profile);
      setProfile(updated);
      localStorage.setItem("farmos_user", JSON.stringify(updated));
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-text">Loading profile...</div>;

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" subtitle="Keep your farm workspace identity up to date." />
      <div className="card profile-card">
        <form className="profile-form" onSubmit={submit}>
          {['username', 'email', 'first_name', 'last_name'].map((field) => (
            <label key={field}>
              {field.replace('_', ' ')}
              <input name={field} type={field === 'email' ? 'email' : 'text'} value={profile[field] || ''} onChange={updateField} required={field === 'username' || field === 'email'} />
            </label>
          ))}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="profile-success">{message}</p>}
          <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        </form>
      </div>
    </>
  );
}
