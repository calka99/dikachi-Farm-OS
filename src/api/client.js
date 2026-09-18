'use client';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

import React, { useState, useEffect } from 'react';









async function request(path, options = {}) {
  const access = typeof window !== "undefined" ? localStorage.getItem("farmos_access") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || Object.values(error).flat().join(" ") || `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export function saveAuthSession(session) {
  localStorage.setItem("farmos_access", session.access);
  localStorage.setItem("farmos_refresh", session.refresh);
  localStorage.setItem("farmos_user", JSON.stringify(session.user));
}

export function clearAuthSession() {
  localStorage.removeItem("farmos_access");
  localStorage.removeItem("farmos_refresh");
  localStorage.removeItem("farmos_user");
}

export const DEFAULT_FARM_ID = 1;

export const endpoints = {
  register: (payload) => request("/api/accounts/register/", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/accounts/login/", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/api/accounts/logout/", {
    method: "POST",
    body: JSON.stringify({ refresh: localStorage.getItem("farmos_refresh") }),
  }),
  me: () => request("/api/accounts/me/"),
  updateProfile: (payload) => request("/api/accounts/me/update/", { method: "PUT", body: JSON.stringify(payload) }),
  recommendations: (farmId) => request(`/api/recommendations/?farm_id=${farmId}`),
  generateRecommendations: (farmId) => request(`/api/recommendations/?farm_id=${farmId}`, { method: "POST" }),
  dashboardOverview: () => request("/api/dashboard/overview/"),
  farmOverview: (farmId) => request(`/api/farms/${farmId}/overview/`),
  farms: () => request("/api/farms/"),
  crops: (farmId) => request(`/api/crop/crops/?farm_id=${farmId}`),
  soil: (farmId) => request(`/api/soil/?farm_id=${farmId}`),
  weather: (farmId) => request(`/api/weather/?farm_id=${farmId}`),
  irrigation: (farmId) => request(`/api/irrigation/?farm_id=${farmId}`),
  pests: (farmId) => request(`/api/pests/?farm_id=${farmId}`),
  livestock: (farmId) => request(`/api/livestock/?farm_id=${farmId}`),
  market: () => request("/api/market-data/"),
  analytics: (farmId) => request(`/api/analytics/?farm_id=${farmId}`),
  reports: (farmId) => request(`/api/reports/monthly/?farm_id=${farmId}`),
  alerts: (farmId) => request(`/api/farms/alerts/?farm_id=${farmId}`),
  settings: (farmId) => request(`/api/settings/${farmId}/`),
  updateSettings: (farmId, payload) => request(`/api/settings/${farmId}/update/`, { method: "PUT", body: JSON.stringify(payload) }),
  acknowledgeAlert: (id) => request(`/api/farms/alerts/${id}/acknowledge/`, { method: "PATCH" }),
  resolvePest: (id) => request(`/api/pests/${id}/resolve/`, { method: "PATCH" }),
  updateIrrigationStatus: (id, status) => request(`/api/irrigation/${id}/status/?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

