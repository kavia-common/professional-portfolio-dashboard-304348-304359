import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// PUBLIC_INTERFACE
export default function RegisterPage() {
  /** Registration page. */
  const { register, authLoading } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState(false);

  const emailErr =
    touched && !/^\S+@\S+\.\S+$/.test(email.trim()) ? "A valid email is required." : null;
  const usernameErr = touched && username.trim().length < 3 ? "Username must be at least 3 characters." : null;
  const passwordErr = touched && password.length < 6 ? "Password must be at least 6 characters." : null;

  const disabled = authLoading || !!emailErr || !!usernameErr || !!passwordErr;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (emailErr || usernameErr || passwordErr) return;

    const ok = await register({ email: email.trim(), username: username.trim(), password });
    if (ok) nav("/login");
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h1 className="authTitle">Create account</h1>
        <p className="authSub">Register to manage your projects, skills, and profile.</p>

        <div className="hr" />

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 12 }}>
            <div className="label">Email</div>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {emailErr ? <div className="errorText">{emailErr}</div> : null}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Username</div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            {usernameErr ? <div className="errorText">{usernameErr}</div> : null}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            {passwordErr ? <div className="errorText">{passwordErr}</div> : null}
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btnPrimary" type="submit" disabled={disabled}>
              {authLoading ? "Creating..." : "Create account"}
            </button>
            <span className="helper">
              Already have an account? <Link to="/login">Sign in</Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
