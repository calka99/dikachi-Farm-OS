'use client';

import React from "react";

import {
  BarChart, Bar, LineChart, Line,
  AreaChart, Area, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import"../globals.css";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";

export default function Analytics() {
  const { data, loading } = useFetch(() => endpoints.analytics(DEFAULT_FARM_ID), []);

  const chartData = (data || []).map((s) => ({
    period: s.period_label.replace("2026-", ""),
    yield: s.crop_yield_kg,
    efficiency: s.resource_efficiency_pct,
    cost: s.production_cost / 1000,
    revenue: s.revenue / 1000,
    sustainability: s.sustainability_score,
  }));

  const latest = data?.[data.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Performance analytics"
        subtitle="Yield, resource efficiency, and sustainability are now live on the home page."
      />

      {loading && <div className="loading-text">Loading analytics…</div>}

      {latest && (
        <div className="grid grid-4">
          <div className="stat-card">
            <div className="stat-label">Latest yield</div>
            <div className="stat-value">{latest.crop_yield_kg.toLocaleString()} kg</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resource efficiency</div>
            <div className="stat-value">{latest.resource_efficiency_pct}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Margin</div>
            <div className="stat-value">
              {(((latest.revenue - latest.production_cost) / latest.revenue) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sustainability score</div>
            <div className="stat-value">{latest.sustainability_score}</div>
          </div>
        </div>
      )}

      <div className="grid grid-2 section-gap">
        <div className="card">
          <div className="card-title">Crop yield (kg) by period</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
                <Area type="monotone" dataKey="yield" stroke="var(--leaf-600)" fill="var(--lime-300)" fillOpacity={0.5} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Cost vs revenue (₦&#39;000)</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="cost" fill="var(--red-500)" radius={[4, 4, 0, 0]} name="Cost" />
                <Bar dataKey="revenue" fill="var(--leaf-500)" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Resource efficiency &amp; sustainability score</div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="efficiency" stroke="var(--leaf-600)" strokeWidth={2.2} dot={{ r: 3 }} name="Efficiency %" />
              <Line type="monotone" dataKey="sustainability" stroke="var(--sky-500)" strokeWidth={2.2} dot={{ r: 3 }} name="Sustainability score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
