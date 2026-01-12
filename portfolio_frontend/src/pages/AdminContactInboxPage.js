import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../ui/ToastContext";

const STATUS = ["new", "in_progress", "resolved"];

// PUBLIC_INTERFACE
export default function AdminContactInboxPage() {
  /** Admin inbox for contact messages: list + update status. */
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const msgs = await api.contact.listMessages();
      setItems(msgs || []);
    } catch {
      // handled globally
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.contact.updateMessage(id, { status });
      pushToast({ type: "success", title: "Updated", message: "Message status updated." });
      await load();
    } catch (e) {
      pushToast({ type: "error", title: "Update failed", message: e?.message || "Unable to update status." });
    }
  };

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <div style={{ fontWeight: 900 }}>Contact messages</div>
          <div className="helper">Requires admin (FastAPI /contact/messages GET/PUT).</div>
        </div>
        <button className="btn" type="button" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>
      <div className="cardBody">
        {loading ? <div className="helper">Loading...</div> : null}
        {!loading && items.length === 0 ? <div className="helper">No messages found.</div> : null}

        {items.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject / Message</th>
                <th>Status</th>
                <th style={{ width: 210 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 800 }}>{m.sender_name}</div>
                    <div className="helper">{m.sender_email}</div>
                    <div className="helper">{new Date(m.created_at).toLocaleString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800 }}>{m.subject || "(no subject)"}</div>
                    <div className="helper" style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>
                  </td>
                  <td>
                    <span className={["badge", m.status === "resolved" ? "badgeSuccess" : "badgePrimary"].join(" ")}>
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <select className="select" value={m.status} onChange={(e) => updateStatus(m.id, e.target.value)}>
                      {STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
