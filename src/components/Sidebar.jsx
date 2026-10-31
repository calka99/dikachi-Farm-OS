"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faSeedling,
  faLayerGroup,
  faCloudSun,
  faDroplet,
  faBug,
  faPaw,
  faChartLine,
  faFileLines,
  faGear,
  faUser,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

import logo from "../assets/LogoM.jpeg";


const NAV_ITEMS = [
  { to: "/dashboard", label: "Farm Overview", icon: faBars, end: true },
  { to: "/crops", label: "Crops", icon: faSeedling },
  { to: "/soil", label: "Soil Health", icon: faLayerGroup },
  { to: "/weather", label: "Weather", icon: faCloudSun },
  { to: "/irrigation", label: "Irrigation", icon: faDroplet },
  { to: "/pests", label: "Pest Alerts", icon: faBug },
  { to: "/market", label: "Market Prices", icon: faChartLine },
  { to: "/livestock", label: "Livestock", icon: faPaw },
  { to: "/reports", label: "Reports", icon: faFileLines },
  { to: "/ai_recommendations", label: "Recommendations", icon: faWandMagicSparkles },
   { to: "/settings", label: "Settings", icon: faGear },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const updateProfileName = () => {
      const storedUser = localStorage.getItem("farmos_user");
      if (!storedUser) {
        setProfileName("");
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        setProfileName(typeof user.username === "string" ? user.username : "");
      } catch (error) {
        console.error("Unable to read the saved profile name.", error);
        setProfileName("");
      }
    };

    updateProfileName();
    window.addEventListener("storage", updateProfileName);
    window.addEventListener("farmos-user-updated", updateProfileName);
    return () => {
      window.removeEventListener("storage", updateProfileName);
      window.removeEventListener("farmos-user-updated", updateProfileName);
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <img src={logo.src} alt="dikachiFarmOS Logo" className="sidebar-logo" />
        </div>

        <div>
          <div className="sidebar-brand-name">DikachiFarmOS</div>
          <div className="sidebar-brand-tag">Smart Farming System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon, end }) => {
          const isActive = end
            ? pathname === to
            : pathname === to || pathname.startsWith(`${to}/`);
          const itemLabel = to === "/profile" ? profileName || label : label;

          return (
            <Link
              key={to}
              href={to}
              className={`sidebar-link${isActive ? " active" : ""}`}
            >
              <FontAwesomeIcon icon={icon} style={{ fontSize: "28px" }} />
              <span>{itemLabel}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link
          href="/profile"
          className={`sidebar-profile${pathname === "/profile" || pathname.startsWith("/profile/") ? " active" : ""}`}
          aria-current={pathname === "/profile" || pathname.startsWith("/profile/") ? "page" : undefined}
        >
          <span>{profileName || "Profile"}</span>
          <FontAwesomeIcon icon={faUser} />
        </Link>
      
      </div>
    </aside>
  );
}
