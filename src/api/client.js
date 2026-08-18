'use client';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

import React, { useState, useEffect } from 'react';









async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json(); 
}

export const DEFAULT_FARM_ID = 1;

export const endpoints = {
  dashboardOverview: () => request("/api/dashboard/overview/"),
  farmOverview: (farmId) => request(`/api/farms/${farmId}/overview`),
  farms: () => request("/api/farms/"),
  crops: (farmId) => request(`/api/crops/?farm_id=${farmId}`),
  soil: (farmId) => request(`/api/soil/?farm_id=${farmId}`),
  weather: (farmId) => request(`/api/weather/?farm_id=${farmId}`),
  irrigation: (farmId) => request(`/api/irrigation/?farm_id=${farmId}`),
  pests: (farmId) => request(`/api/pests/?farm_id=${farmId}`),
  livestock: (farmId) => request(`/api/livestock/?farm_id=${farmId}`),
  market: () => request("/api/market/"),
  analytics: (farmId) => request(`/api/analytics/?farm_id=${farmId}`),
  reports: (farmId) => request(`/api/reports/?farm_id=${farmId}`),
  alerts: (farmId) => request(`/api/alerts/?farm_id=${farmId}`),
  settings: (farmId) => request(`/api/settings/${farmId}`),
  updateSettings: (farmId, payload) => request(`/api/settings/${farmId}`, { method: "PUT", body: JSON.stringify(payload) }),
  acknowledgeAlert: (id) => request(`/api/alerts/${id}/acknowledge`, { method: "PATCH" }),
  resolvePest: (id) => request(`/api/pests/${id}/resolve`, { method: "PATCH" }),
  updateIrrigationStatus: (id, status) => request(`/api/irrigation/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
};

