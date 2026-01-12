import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useToast } from "../ui/ToastContext";

const STATUS_OPTIONS = ["draft", "published", "archived"];

function emptyForm() {
  return {
    title: "",
    description: "",
    repo_url: "",
    live_url: "",
    status: "draft",
    skill_ids: [],
  };
}

// PUBLIC_INTERFACE
export default function ProjectsPage() {
  /** Projects list + editor. */
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [skills, setSkills] = useState([]);

  const [filterStatus, setFilterStatus] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [touched, setTouched] = useState(false);

  const titleErr = touched && form.title.trim().length < 2 ? "Title is required." : null;

  const selectedSkillNames = useMemo(() => {
    const map = new Map(skills.map((s) => [s.id, s.name]));
    return form.skill_ids.map((id) => map.get(id)).filter(Boolean);
  }, [form.skill_ids, skills]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.projects.list({ status: filterStatus || undefined }), api.skills.list()]);
      setItems(p || []);
      setSkills(s || []);
    } catch {
      // handled by global handler/toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setTouched(false);
  };

  const startEdit = (proj) => {
    setEditingId(proj.id);
    setForm({
      title: proj.title || "",
      description: proj.description || "",
      repo_url: proj.repo_url || "",
      live_url: proj.live_url || "",
      status: proj.status || "draft",
      skill_ids: (proj.skills || []).map((s) => s.id),
    });
    setTouched(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (titleErr) return;

    try {
      if (editingId == null) {
        await api.projects.create({
          ...form,
          title: form.title.trim(),
          description: form.description.trim() || null,
          repo_url: form.repo_url.trim() || null,
          live_url: form.live_url.trim() || null,
          skill_ids: form.skill_ids.length ? form.skill_ids : null,
        });
        pushToast({ type: "success", title: "Project created", message: "Your project was created." });
      } else {
        await api.projects.update(editingId, {
          ...form,
          title: form.title.trim(),
          description: form.description.trim() || null,
          repo_url: form.repo_url.trim() || null,
          live_url: form.live_url.trim() || null,
          skill_ids: form.skill_ids,
        });
        pushToast({ type: "success", title: "Project updated", message: "Your changes were saved." });
      }
      await loadAll();
      startCreate();
    } catch (e2) {
      pushToast({ type: "error", title: "Save failed", message: e2?.message || "Unable to save project." });
    }
  };

  const onDelete = async (id) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await api.projects.remove(id);
      pushToast({ type: "success", title: "Project deleted", message: "Project removed." });
      await loadAll();
      if (editingId === id) startCreate();
    } catch (e) {
      pushToast({ type: "error", title: "Delete failed", message: e?.message || "Unable to delete project." });
    }
  };

  const toggleSkill = (skillId) => {
    setForm((prev) => {
      const has = prev.skill_ids.includes(skillId);
      const skill_ids = has ? prev.skill_ids.filter((x) => x !== skillId) : [...prev.skill_ids, skillId];
      return { ...prev, skill_ids };
    });
  };

  return (
    <div className="grid2">
      <div className="card">
        <div className="cardHeader">
          <div>
            <div style={{ fontWeight: 900 }}>Projects</div>
            <div className="helper">Create, edit, and publish your work.</div>
          </div>
          <div className="row">
            <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status">
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn" type="button" onClick={startCreate}>New</button>
          </div>
        </div>

        <div className="cardBody">
          {loading ? <div className="helper">Loading...</div> : null}
          {!loading && items.length === 0 ? <div className="helper">No projects found.</div> : null}

          {items.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Links</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{p.title}</div>
                      {p.description ? <div className="helper">{p.description}</div> : null}
                      {(p.skills || []).length ? (
                        <div className="row" style={{ marginTop: 6 }}>
                          {(p.skills || []).slice(0, 3).map((s) => (
                            <span key={s.id} className="badge">{s.name}</span>
                          ))}
                          {(p.skills || []).length > 3 ? <span className="badge">+{(p.skills || []).length - 3}</span> : null}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={["badge", p.status === "published" ? "badgeSuccess" : "badgePrimary"].join(" ")}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="row">
                        {p.repo_url ? <a className="btn btnGhost" href={p.repo_url} target="_blank" rel="noreferrer">Repo</a> : null}
                        {p.live_url ? <a className="btn btnGhost" href={p.live_url} target="_blank" rel="noreferrer">Live</a> : null}
                      </div>
                    </td>
                    <td>
                      <div className="row">
                        <button className="btn" type="button" onClick={() => startEdit(p)}>Edit</button>
                        <button className="btn btnDanger" type="button" onClick={() => onDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div style={{ fontWeight: 900 }}>{editingId == null ? "Create project" : `Edit project #${editingId}`}</div>
            <div className="helper">Fields map to the FastAPI ProjectCreate/ProjectUpdate schemas.</div>
          </div>
        </div>
        <div className="cardBody">
          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 12 }}>
              <div className="label">Title</div>
              <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              {titleErr ? <div className="errorText">{titleErr}</div> : null}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Description</div>
              <textarea className="textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="grid2" style={{ marginBottom: 12 }}>
              <div>
                <div className="label">Repo URL</div>
                <input className="input" value={form.repo_url} onChange={(e) => setForm((p) => ({ ...p, repo_url: e.target.value }))} placeholder="https://github.com/..." />
              </div>
              <div>
                <div className="label">Live URL</div>
                <input className="input" value={form.live_url} onChange={(e) => setForm((p) => ({ ...p, live_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Status</div>
              <select className="select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Skills</div>
              <div className="row">
                {skills.map((s) => (
                  <label key={s.id} className="badge" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.skill_ids.includes(s.id)}
                      onChange={() => toggleSkill(s.id)}
                      style={{ marginRight: 6 }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
              {selectedSkillNames.length ? <div className="helper" style={{ marginTop: 6 }}>Selected: {selectedSkillNames.join(", ")}</div> : null}
            </div>

            <div className="row">
              <button className="btn btnPrimary" type="submit" disabled={loading}>
                {editingId == null ? "Create" : "Save"}
              </button>
              <button className="btn" type="button" onClick={startCreate}>Reset</button>
            </div>

            <p className="helper" style={{ marginTop: 10 }}>
              Note: Project visibility to the public depends on status (published).
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
