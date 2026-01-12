import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// PUBLIC_INTERFACE
export default function DashboardHomePage() {
  /** Dashboard home / overview. */
  const { profile, role } = useAuth();

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHeader">
          <div>
            <div style={{ fontWeight: 900 }}>Welcome</div>
            <div className="helper">Manage your portfolio content and publish projects.</div>
          </div>
          <span className="badge badgeSuccess">{role === "admin" ? "Admin" : "User"}</span>
        </div>
        <div className="cardBody">
          <p style={{ marginTop: 0 }}>
            <strong>{profile?.display_name || "Your profile"}</strong>
          </p>
          <p className="helper">
            Tip: keep your profile headline and bio updated for a polished public portfolio.
          </p>
          <div className="row">
            <Link className="btn btnPrimary" to="/dashboard/projects">Manage projects</Link>
            <Link className="btn" to="/dashboard/profile">Edit profile</Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div style={{ fontWeight: 900 }}>Quick actions</div>
            <div className="helper">Common tasks from one place.</div>
          </div>
        </div>
        <div className="cardBody">
          <div className="row" style={{ alignItems: "stretch" }}>
            <Link className="btn" to="/dashboard/skills">View skills</Link>
            <Link className="btn" to="/contact">Public contact form</Link>
            <Link className="btn" to="/dashboard/contact-inbox">Contact inbox</Link>
          </div>
          <div className="hr" />
          <p className="helper" style={{ margin: 0 }}>
            The API base URL is read from <code>REACT_APP_API_BASE_URL</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
