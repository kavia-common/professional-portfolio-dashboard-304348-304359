import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Login page. */
  const { login, authLoading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from || "/dashboard", [location.state]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [touched, setTouched] = useState(false);

  const usernameErr = touched && username.trim().length < 3 ? "Username is required." : null;
  const passwordErr = touched && password.length < 4 ? "Password is required." : null;
  const disabled = authLoading || !!usernameErr || !!passwordErr;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (usernameErr || passwordErr) return;
    const ok = await login({ username: username.trim(), password });
    if (ok) nav(from, { replace: true });
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h1 className="authTitle">Sign in</h1>
        <p className="authSub">Access your portfolio dashboard.</p>

        <div className="hr" />

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 12 }}>
            <div className="label">Username</div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
            {usernameErr ? <div className="errorText">{usernameErr}</div> : null}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {passwordErr ? <div className="errorText">{passwordErr}</div> : null}
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <button className="btn btnPrimary" type="submit" disabled={disabled}>
              {authLoading ? "Signing in..." : "Sign in"}
            </button>
            <span className="helper">
              New here? <Link to="/register">Create an account</Link>
            </span>
          </div>
        </form>

        <div className="hr" />
        <p className="helper">
          Admin seed: <strong>admin@example.com</strong> (username depends on seed), use your configured password.
        </p>
      </div>
    </div>
  );
}
