"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const AUTH_ROUTES = ["/login", "/register"];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  return (
    <div className="app-shell">
      {!isAuthRoute && <Sidebar />}

      <main className="app-main">
        <div className="app-main-inner">{children}</div>
      </main>
    </div>
  );
}