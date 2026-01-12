import React, { useState } from "react";
import { api } from "../api/client";
import { useToast } from "../ui/ToastContext";

// PUBLIC_INTERFACE
export default function ContactPage() {
  /** Public contact submission form. */
  const { pushToast } = useToast();

  const [sender_name, setName] = useState("");
  const [sender_email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const nameErr = touched && sender_name.trim().length < 2 ? "Name is required." : null;
  const emailErr = touched && !/^\S+@\S+\.\S+$/.test(sender_email.trim()) ? "Valid email is required." : null;
  const msgErr = touched && message.trim().length < 10 ? "Message must be at least 10 characters." : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (nameErr || emailErr || msgErr) return;

    setLoading(true);
    try {
      await api.contact.submitMessage({
        sender_name: sender_name.trim(),
        sender_email: sender_email.trim(),
        subject: subject.trim() || null,
        message: message.trim(),
      });
      pushToast({ type: "success", title: "Message sent", message: "Thanks! We'll get back to you soon." });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTouched(false);
    } catch (e2) {
      pushToast({ type: "error", title: "Send failed", message: e2?.message || "Unable to submit message." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="card authCard">
        <h1 className="authTitle">Contact</h1>
        <p className="authSub">Send a message using the public contact endpoint.</p>

        <div className="hr" />

        <form onSubmit={onSubmit}>
          <div className="grid2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Name</div>
              <input className="input" value={sender_name} onChange={(e) => setName(e.target.value)} />
              {nameErr ? <div className="errorText">{nameErr}</div> : null}
            </div>
            <div>
              <div className="label">Email</div>
              <input className="input" value={sender_email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              {emailErr ? <div className="errorText">{emailErr}</div> : null}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Subject</div>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Optional" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div className="label">Message</div>
            <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
            {msgErr ? <div className="errorText">{msgErr}</div> : null}
          </div>

          <button className="btn btnPrimary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>
    </div>
  );
}
