import React, { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function _navClass({ isActive }) {
  return ["navLink", isActive ? "navLinkActive" : ""].filter(Boolean).join(" ");
}

// PUBLIC_INTERFACE
export default function DashboardLayout() {
  /** Layout for authenticated dashboard routes. */
  const { profile, role, logout } = useAuth();
  const location = useLocation();

  const headerTitle = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/dashboard/projects")) return "Projects";
    if (p.startsWith("/dashboard/skills")) return "Skills";
    if (p.startsWith("/dashboard/profile")) return "Profile";
    if (p.startsWith("/dashboard/admin")) return "Admin";
    if (p.startsWith("/dashboard/contact-inbox")) return "Contact Inbox";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true">
            <span style={{ fontWeight: 900, color: "#2563eb" }}>P</span>
          </div>
          <div className="brandTitle">
            <strong>Portfolio</strong>
            <span>{role === "admin" ? "Admin" : "Dashboard"}</span>
          </div>
        </div>

        <nav className="nav" aria-label="Sidebar navigation">
          <div className="navGroupTitle">Main</div>
          <NavLink to="/dashboard" end className={_navClass}>Home</NavLink>
          <NavLink to="/dashboard/projects" className={_navClass}>Projects</NavLink>
          <NavLink to="/dashboard/skills" className={_navClass}>Skills</NavLink>
          <NavLink to="/dashboard/profile" className={_navClass}>Profile</NavLink>

          <div className="navGroupTitle">Admin</div>
          <NavLink to="/dashboard/contact-inbox" className={_navClass}>Contact Messages</NavLink>
          {role === "admin" ? <NavLink to="/dashboard/admin/users" className={_navClass}>Users</NavLink> : null}

          <div className="navGroupTitle">Public</div>
          <NavLink to="/contact" className={_navClass}>Contact Form</NavLink>

          <div className="hr" />

          <button className="btn btnDanger" onClick={() => logout()} type="button">
            Sign out
          </button>
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <div className="headerLeft">
            <div className="headerTitle">{headerTitle}</div>
          </div>
          <div className="headerRight">
            <span className="badge badgePrimary" title="Current user">
              {profile?.display_name || profile?.headline || "Signed in"}
            </span>
          </div>
        </header>

        <div className="content">
          <div className="container">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
