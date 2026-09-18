"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { endpoints, clearAuthSession } from "../api/client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHouse,
  faSeedling,
  faLayerGroup,
  faCloudSun,
  faDroplet,
  faBug,
  faPaw,
  faChartLine,
  faChartColumn,
  faFileLines,
  faGear,
  faUser,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

import logo from "../assets/logo.jpeg";


const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: faBars, end: true },
  { to: "/overview", label: "Farms", icon: faHouse, end: true },
  { to: "/crops", label: "Crops", icon: faSeedling },
  { to: "/soil", label: "Soil Health", icon: faLayerGroup },
  { to: "/weather", label: "Weather Intelligence", icon: faCloudSun },
  { to: "/irrigation", label: "Irrigation", icon: faDroplet },
  { to: "/pests", label: "Pest Alert", icon: faBug },
  { to: "/livestock", label: "Livestock", icon: faPaw },
  { to: "/market", label: "Market Intelligence", icon: faChartLine },
  { to: "/analytics", label: "Analytics", icon: faChartColumn },
  { to: "/reports", label: "Reports", icon: faFileLines },
  { to: "/settings", label: "Settings", icon: faGear },
  { to: "/profile", label: "Profile", icon: faUser },
  { to: "/recommendations", label: "Recommendations", icon: faWandMagicSparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await endpoints.logout();
    } finally {
      clearAuthSession();
      router.push("/login");
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo.src} alt="Farm Logo" className="sidebar-logo" />

        <div>
          <div className="sidebar-brand-name">dikachiFarmOS</div>
          <div className="sidebar-brand-tag">Mapped. Nurtured. Sustainable.</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon, end }) => {
          const isActive = end
            ? pathname === to
            : pathname === to || pathname.startsWith(`${to}/`);

          return (
            <Link
              key={to}
              href={to}
              className={`sidebar-link${isActive ? " active" : ""}`}
            >
              <FontAwesomeIcon icon={icon} style={{ fontSize: "28px" }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <span className="status-dot" />
          <span>6 sensors online</span>
        </div>
        <div className="sidebar-footer-farm">Urban Farm � Lagos, NG</div>
        <button className="sidebar-logout" type="button" onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );
}
