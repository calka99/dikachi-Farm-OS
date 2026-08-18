"use client";

import "./globals.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./dashboard/page";
import FarmOverview from"./overview/page"; 
import Analytics from "./analytics/page";
import Crops from "./crops/page";
import Irrigation from "./irrigation/page";
import Pests from "./pests/page";  
import Market from "./market/page"; 
import Reports from "./reports/page";
import LivestockPage from "./livestock/page";
import Soil from "./soil/page";
import Weather from "./weather/page";
import Settings from "./settings/page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/overveiw" element={<FarmOverview />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/soil" element={<Soil />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/pests" element={<Pests />} />
        <Route path="/livestock" element={<LivestockPage />} />
        <Route path="/market" element={<Market />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}


