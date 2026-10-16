'use client';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

import React, { useState, useEffect } from 'react';









async function request(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const access = auth && typeof window !== "undefined" ? localStorage.getItem("farmos_access") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
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
  localStorage.removeItem("farmos_selected_farm");
  localStorage.removeItem("farmos_selected_farm_details");
}

export function saveSelectedFarmId(farmId) {
  localStorage.setItem("farmos_selected_farm", String(farmId));
}

export function saveSelectedFarm(farm) {
  saveSelectedFarmId(farm.id);
  localStorage.setItem("farmos_selected_farm_details", JSON.stringify({ id: farm.id, name: farm.name }));
  window.dispatchEvent(new Event("farmos-selected-farm"));
}

export function clearSelectedFarm() {
  localStorage.removeItem("farmos_selected_farm");
  localStorage.removeItem("farmos_selected_farm_details");
  selectedFarmStorageValue = null;
  selectedFarmSnapshot = null;
  window.dispatchEvent(new Event("farmos-selected-farm"));
}

export function getSelectedFarmId() {
  return localStorage.getItem("farmos_selected_farm");
}

export function getSelectedFarm() {
  const stored = localStorage.getItem("farmos_selected_farm_details");
  return stored ? JSON.parse(stored) : null;
}

let selectedFarmSnapshot = null;
let selectedFarmStorageValue = null;

export function getSelectedFarmSnapshot() {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("farmos_selected_farm_details");
  if (stored === selectedFarmStorageValue) return selectedFarmSnapshot;

  selectedFarmStorageValue = stored;
  selectedFarmSnapshot = stored ? JSON.parse(stored) : null;
  return selectedFarmSnapshot;
}

export function subscribeToSelectedFarm(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("farmos-selected-farm", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("farmos-selected-farm", callback);
  };
}


export const endpoints = {
  register: (payload) => request("/api/accounts/register/", { method: "POST", body: JSON.stringify(payload), auth: false }),
  login: (payload) => request("/api/accounts/login/", { method: "POST", body: JSON.stringify(payload), auth: false }),
  logout: () => request("/api/accounts/logout/", {
    method: "POST",
    body: JSON.stringify({ refresh: localStorage.getItem("farmos_refresh") }),
  }),
  me: () => request("/api/accounts/me/"),
  updateProfile: (payload) => request("/api/accounts/me/update/", { method: "PUT", body: JSON.stringify(payload) }),
  changePassword: (payload) => request("/api/accounts/me/change-password/", { method: "POST", body: JSON.stringify(payload) }),
  generateRecommendations: (farmId) => request("/api/recommendations/", { method: "POST", body: JSON.stringify({ farm_id: farmId }) }),
  dashboardOverview: () => request("/api/dashboard/overview/"),
  farmOverview: (farmId) => request(`/api/farms/${farmId}/overview/`),
  farms: () => request("/api/farms/"),
  ownedFarms: () => request("/api/farms/mine/"),
  createFarm: (payload) => request("/api/farms/create/", { method: "POST", body: JSON.stringify(payload) }),
  updateFarm: (farmId, payload) => request(`/api/farms/${farmId}/update/`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteFarm: (farmId) => request(`/api/farms/${farmId}/delete/`, { method: "DELETE" }),
  categories: () => request("/api/crop/categories/"),
  cropTypes: () => request("/api/crop/crop-types/"),
  crops: (farmId) => request(farmId ? `/api/crop/crops/?farm_id=${farmId}` : "/api/crop/crops/"),
  createCrop: (payload) => request("/api/crop/crops/create/", { method: "POST", body: JSON.stringify(payload) }),
  deleteCrop: (cropId) => request(`/api/crop/crops/${cropId}/delete/`, { method: "DELETE" }),
  markCropHarvested: (cropId, payload) => request(`/api/crop/crops/${cropId}/harvest/`, { method: "POST", body: JSON.stringify(payload) }),
  soil: (farmId) => request(`/api/soil/?farm_id=${farmId}`),
  createSoil: (payload) => request("/api/soil/", { method: "POST", body: JSON.stringify(payload) }),
  weather: (farmId) => request(`/api/weather/?farm=${farmId}`),
  nextHourWeather: (farmId) => request(`/api/weather/next-hour/?farm=${farmId}`),
  next24HoursWeather: (farmId) => request(`/api/weather/next-24-hours/?farm=${farmId}`),
  irrigation: (farmId) => request(`/api/irrigation/?farm_id=${farmId}`),
  createIrrigation: (payload) => request("/api/irrigation/create/", { method: "POST", body: JSON.stringify(payload) }),
  pests: (farmId) => request(farmId ? `/api/pests/?farm_id=${farmId}` : "/api/pests/"),
  createPest: (payload) => request("/api/pests/create/", { method: "POST", body: JSON.stringify(payload) }),
  livestock: (farmId) => request(farmId ? `/api/livestock/?farm_id=${farmId}` : "/api/livestock/"),
  livestockTypes: () => request("/api/livestock/types/"),
  createLivestock: (payload) => request("/api/livestock/", { method: "POST", body: JSON.stringify(payload) }),
  updateLivestock: (livestockId, payload) => request(`/api/livestock/${livestockId}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  livestockHealthAlerts: (farmId) => request(farmId ? `/api/livestock/health-alerts/?farm_id=${farmId}` : "/api/livestock/health-alerts/"),
  createLivestockHealthAlert: (payload) => request("/api/livestock/health-alerts/", { method: "POST", body: JSON.stringify(payload) }),
  market: () => request("/api/market-data/"),
  reports: (farmId, month) => {
    const params = new URLSearchParams();
    if (farmId) params.set("farm_id", farmId);
    if (month) params.set("month", month);
    const query = params.toString();
    return request(`/api/reports/monthly/${query ? `?${query}` : ""}`);
  },
  generateReports: (month) => request("/api/reports/monthly/generate/", { method: "POST", body: JSON.stringify({ month }) }),
  alerts: (farmId) => request(`/api/farms/alerts/?farm_id=${farmId}`),
  settings: () => request("/api/settings/"),
  updateSettings: (payload) => request("/api/settings/update/", { method: "PUT", body: JSON.stringify(payload) }),
  acknowledgeAlert: (id) => request(`/api/farms/alerts/${id}/acknowledge/`, { method: "PATCH" }),
  resolvePest: (id) => request(`/api/pests/${id}/resolve/`, { method: "PATCH" }),
  updateIrrigationStatus: (id, status) => request(`/api/irrigation/${id}/status/?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};
