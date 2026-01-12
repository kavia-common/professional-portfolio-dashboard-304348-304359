import React, { useEffect, useState } from "react";
import { api } from "../api/client";

// PUBLIC_INTERFACE
export default function AdminUsersPage() {
  /** Admin-only user list (FastAPI /admin/users). */
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const u = await api.admin.listUsers();
      setUsers(u || []);
    } catch {
      // handled globally
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <div style={{ fontWeight: 900 }}>Users</div>
          <div className="helper">Admin-only list of registered users.</div>
        </div>
        <button className="btn" type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>
      <div className="cardBody">
        {loading ? <div className="helper">Loading...</div> : null}
        {!loading && users.length === 0 ? <div className="helper">No users found.</div> : null}

        {users.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 700 }}>{u.email}</td>
                  <td>{u.username}</td>
                  <td>
                    <span className={["badge", u.role === "admin" ? "badgeSuccess" : "badgePrimary"].join(" ")}>
                      {u.role}
                    </span>
                  </td>
                  <td className="helper">{u.created_at ? new Date(u.created_at).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
