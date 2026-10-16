"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { endpoints } from "@/api/client";

const EMPTY_PROFILE = { username: "", email: "", first_name: "", last_name: "" };
const EMPTY_PASSWORD_FORM = { current_password: "", new_password: "", confirm_password: "" };

export default function ProfilePage() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    endpoints.me()
      .then((data) => setProfile(data))
      .catch((requestError) => setLoadError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (event) => {
    setProfile({ ...profile, [event.target.name]: event.target.value });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setProfileMessage("");
    setProfileError("");
    try {
      const updated = await endpoints.updateProfile(profile);
      setProfile(updated);
      localStorage.setItem("farmos_user", JSON.stringify(updated));
      setProfileMessage("Profile updated successfully.");
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePasswordField = (event) => {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value });
  };

  const retryLoadProfile = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await endpoints.me();
      setProfile(data);
    } catch (requestError) {
      setLoadError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const result = await endpoints.changePassword(passwordForm);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordMessage(result.detail || "Password changed successfully.");
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="loading-text">Loading profile...</div>;

  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" subtitle="Manage your personal details and account security." />
      {loadError && (
        <div className="card section-gap">
          <p className="auth-error" role="alert">Unable to load your profile: {loadError}</p>
          <button type="button" onClick={retryLoadProfile}>Try again</button>
        </div>
      )}
      {!loadError && (
        <>
          <div className="card profile-card">
            <form className="profile-form" onSubmit={submit}>
              <label>
                Username
                <input name="username" type="text" value={profile.username} onChange={updateField} required />
              </label>
              <label>
                Email address
                <input name="email" type="email" value={profile.email} onChange={updateField} required />
              </label>
              <label>
                First name
                <input name="first_name" type="text" value={profile.first_name || ""} onChange={updateField} autoComplete="given-name" />
              </label>
              <label>
                Last name
                <input name="last_name" type="text" value={profile.last_name || ""} onChange={updateField} autoComplete="family-name" />
              </label>
              {profileError && <p className="auth-error" role="alert">{profileError}</p>}
              {profileMessage && <p className="profile-success" role="status">{profileMessage}</p>}
              <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
            </form>
          </div>
          <div className="card profile-card section-gap">
            <h2 className="card-title">Change password</h2>
            <form className="profile-form" onSubmit={submitPassword}>
              <label>
                Current password
                <input
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.current_password}
                  onChange={updatePasswordField}
                  required
                />
              </label>
              <label>
                New password
                <input
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.new_password}
                  onChange={updatePasswordField}
                  required
                />
              </label>
              <label>
                Confirm new password
                <input
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirm_password}
                  onChange={updatePasswordField}
                  required
                />
              </label>
              {passwordError && <p className="auth-error" role="alert">{passwordError}</p>}
              {passwordMessage && <p className="profile-success" role="status">{passwordMessage}</p>}
              <button className="auth-submit" type="submit" disabled={savingPassword}>
                {savingPassword ? "Changing password..." : "Change password"}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
