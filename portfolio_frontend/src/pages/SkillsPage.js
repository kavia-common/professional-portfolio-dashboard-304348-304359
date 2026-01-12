import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastContext";

function emptySkill() {
  return { name: "", category: "", level: 1 };
}

// PUBLIC_INTERFACE
export default function SkillsPage() {
  /** Skills list; admin can create/update/delete. */
  const { role } = useAuth();
  const { pushToast } = useToast();

  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySkill());
  const [touched, setTouched] = useState(false);

  const nameErr = touched && form.name.trim().length < 2 ? "Name is required." : null;

  const grouped = useMemo(() => {
    const groups = new Map();
    (skills || []).forEach((s) => {
      const key = s.category || "Uncategorized";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [skills]);

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.skills.list();
      setSkills(s || []);
    } catch {
      // handled globally
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptySkill());
    setTouched(false);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({ name: s.name || "", category: s.category || "", level: s.level ?? 1 });
    setTouched(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (nameErr) return;

    try {
      if (editingId == null) {
        await api.skills.create({
          name: form.name.trim(),
          category: form.category.trim() || null,
          level: Number(form.level) || 1,
        });
        pushToast({ type: "success", title: "Skill created", message: "New skill added." });
      } else {
        await api.skills.update(editingId, {
          name: form.name.trim(),
          category: form.category.trim() || null,
          level: Number(form.level) || 1,
        });
        pushToast({ type: "success", title: "Skill updated", message: "Skill saved." });
      }
      await load();
      startCreate();
    } catch (e2) {
      pushToast({ type: "error", title: "Save failed", message: e2?.message || "Unable to save skill." });
    }
  };

  const onDelete = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this skill?")) return;
    try {
      await api.skills.remove(id);
      pushToast({ type: "success", title: "Skill deleted", message: "Skill removed." });
      await load();
      if (editingId === id) startCreate();
    } catch (e) {
      pushToast({ type: "error", title: "Delete failed", message: e?.message || "Unable to delete skill." });
    }
  };

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHeader">
          <div>
            <div style={{ fontWeight: 900 }}>Skills</div>
            <div className="helper">{isAdmin ? "Admin can manage skills." : "Skills are public and managed by admins."}</div>
          </div>
          {isAdmin ? <button className="btn" type="button" onClick={startCreate}>New</button> : null}
        </div>
        <div className="cardBody">
          {loading ? <div className="helper">Loading...</div> : null}
          {!loading && skills.length === 0 ? <div className="helper">No skills found.</div> : null}

          {grouped.map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div style={{ fontWeight: 900 }}>{cat}</div>
                <span className="badge">{items.length}</span>
              </div>
              <div className="hr" style={{ margin: "10px 0" }} />
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Level</th>
                    {isAdmin ? <th style={{ width: 180 }}>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.name}</td>
                      <td>
                        <span className="badge badgeSuccess">L{s.level ?? 1}</span>
                      </td>
                      {isAdmin ? (
                        <td>
                          <div className="row">
                            <button className="btn" type="button" onClick={() => startEdit(s)}>Edit</button>
                            <button className="btn btnDanger" type="button" onClick={() => onDelete(s.id)}>Delete</button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div style={{ fontWeight: 900 }}>Skill editor</div>
            <div className="helper">Requires admin (FastAPI /skills POST/PUT/DELETE).</div>
          </div>
          {!isAdmin ? <span className="badge badgeDanger">Admin only</span> : null}
        </div>
        <div className="cardBody">
          {!isAdmin ? (
            <div className="helper">
              You are not an admin. You can view skills but cannot modify them.
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div style={{ marginBottom: 12 }}>
                <div className="label">Name</div>
                <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                {nameErr ? <div className="errorText">{nameErr}</div> : null}
              </div>

              <div className="grid2" style={{ marginBottom: 12 }}>
                <div>
                  <div className="label">Category</div>
                  <input className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Frontend, Backend, DevOps..." />
                </div>
                <div>
                  <div className="label">Level</div>
                  <input className="input" type="number" min={1} max={5} value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} />
                  <div className="helper">1-5 recommended.</div>
                </div>
              </div>

              <div className="row">
                <button className="btn btnPrimary" type="submit">
                  {editingId == null ? "Create" : "Save"}
                </button>
                <button className="btn" type="button" onClick={startCreate}>Reset</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
