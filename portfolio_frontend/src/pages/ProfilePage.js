import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastContext";

function normalizeSocials(obj) {
  if (!obj || typeof obj !== "object") return {};
  return obj;
}

// PUBLIC_INTERFACE
export default function ProfilePage() {
  /** View/edit the current user's profile. */
  const { profile, refreshProfile, setProfile } = useAuth();
  const { pushToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [display_name, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [socialsJson, setSocialsJson] = useState("{}");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refreshProfile();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || "");
    setHeadline(profile.headline || "");
    setBio(profile.bio || "");
    setLocation(profile.location || "");
    setWebsite(profile.website || "");
    setSocialsJson(JSON.stringify(normalizeSocials(profile.socials), null, 2));
  }, [profile]);

  const onSave = async (e) => {
    e.preventDefault();
    let socialsObj = {};
    try {
      socialsObj = socialsJson.trim() ? JSON.parse(socialsJson) : {};
    } catch {
      pushToast({ type: "error", title: "Invalid socials JSON", message: "Please provide valid JSON for socials." });
      return;
    }

    setLoading(true);
    try {
      const updated = await api.profile.updateMe({
        display_name: display_name.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        socials: socialsObj,
      });
      setProfile(updated);
      pushToast({ type: "success", title: "Profile saved", message: "Your profile was updated." });
    } catch (e2) {
      pushToast({ type: "error", title: "Save failed", message: e2?.message || "Unable to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="cardHeader">
        <div>
          <div style={{ fontWeight: 900 }}>My Profile</div>
          <div className="helper">Edit fields that appear on your portfolio.</div>
        </div>
        {loading ? <span className="badge">Saving...</span> : null}
      </div>
      <div className="cardBody">
        <form onSubmit={onSave}>
          <div className="grid2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Display name</div>
              <input className="input" value={display_name} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <div className="label">Headline</div>
              <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full-stack developer..." />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Bio</div>
            <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="grid2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Location</div>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <div className="label">Website</div>
              <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Socials (JSON)</div>
            <textarea className="textarea" value={socialsJson} onChange={(e) => setSocialsJson(e.target.value)} />
            <div className="helper">Example: {"{\"github\":\"https://github.com/you\",\"linkedin\":\"...\"}"}</div>
          </div>

          <div className="row">
            <button className="btn btnPrimary" type="submit" disabled={loading}>
              Save
            </button>
            <button className="btn" type="button" onClick={() => refreshProfile()} disabled={loading}>
              Reload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
