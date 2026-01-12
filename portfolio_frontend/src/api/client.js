/**
 * Central API client for the Portfolio backend (FastAPI).
 * - Uses fetch (no extra deps).
 * - Supports Bearer JWT and global 401/403 handling.
 */

const DEFAULT_TIMEOUT_MS = 20000;

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Get API base URL from env (do not hardcode). */
  const base = process.env.REACT_APP_API_BASE_URL;
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

/**
 * In-memory auth state lives in AuthContext; this module only holds:
 * - a token getter/setter provided by AuthContext
 * - an unauthorized handler to trigger logout or redirect
 */
let _getToken = () => null;
let _onUnauthorized = () => {};

// PUBLIC_INTERFACE
export function configureApiClient({ getToken, onUnauthorized }) {
  /** Configure token provider and unauthorized callback. */
  _getToken = getToken || (() => null);
  _onUnauthorized = onUnauthorized || (() => {});
}

async function _withTimeout(promise, timeoutMs) {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await promise(ac.signal);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function _request(method, path, { body, query, headers } = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      "Missing REACT_APP_API_BASE_URL. Please configure environment variables.",
      0,
      null
    );
  }

  const url = new URL(baseUrl + path);

  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }

  const token = _getToken();
  const finalHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  const doFetch = (signal) =>
    fetch(url.toString(), {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

  let resp;
  try {
    resp = await _withTimeout(doFetch, DEFAULT_TIMEOUT_MS);
  } catch (e) {
    throw new ApiError("Network error contacting API", 0, String(e?.message || e));
  }

  // 204 No Content
  if (resp.status === 204) return null;

  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await resp.json().catch(() => null) : await resp.text().catch(() => null);

  if (!resp.ok) {
    const detail = payload?.detail ?? payload ?? null;
    const msg = typeof detail === "string" ? detail : "Request failed";
    const err = new ApiError(msg, resp.status, detail);

    if (resp.status === 401 || resp.status === 403) {
      // Trigger global handler (logout, toast, redirect)
      _onUnauthorized(err);
    }
    throw err;
  }

  return payload;
}

/** API modules matching FastAPI routers:
 * - /auth/register, /auth/login
 * - /profile/me GET/PUT
 * - /projects (CRUD)
 * - /skills (list public, CRUD admin)
 * - /contact/messages (submit public, list/update admin)
 * - /admin/users (list admin)
 */

// PUBLIC_INTERFACE
export const api = {
  /** Auth endpoints */
  auth: {
    // PUBLIC_INTERFACE
    async register({ email, username, password }) {
      /** Register new user. */
      return _request("POST", "/auth/register", { body: { email, username, password } });
    },
    // PUBLIC_INTERFACE
    async login({ username, password }) {
      /** Login and receive JWT: {access_token, token_type?}. */
      return _request("POST", "/auth/login", { body: { username, password } });
    },
  },

  /** Profile endpoints */
  profile: {
    // PUBLIC_INTERFACE
    async getMe() {
      /** Get current user's profile (creates if missing). */
      return _request("GET", "/profile/me");
    },
    // PUBLIC_INTERFACE
    async updateMe(payload) {
      /** Update current user's profile. */
      return _request("PUT", "/profile/me", { body: payload });
    },
  },

  /** Projects endpoints */
  projects: {
    // PUBLIC_INTERFACE
    async list({ status } = {}) {
      /** List projects. Optionally filter by status (?status=published|draft|archived). */
      return _request("GET", "/projects", { query: { status } });
    },
    // PUBLIC_INTERFACE
    async create(payload) {
      /** Create project: {title, description?, repo_url?, live_url?, status, skill_ids?} */
      return _request("POST", "/projects", { body: payload });
    },
    // PUBLIC_INTERFACE
    async get(projectId) {
      /** Get project by id. */
      return _request("GET", `/projects/${projectId}`);
    },
    // PUBLIC_INTERFACE
    async update(projectId, payload) {
      /** Update project by id. */
      return _request("PUT", `/projects/${projectId}`, { body: payload });
    },
    // PUBLIC_INTERFACE
    async remove(projectId) {
      /** Delete project by id. */
      return _request("DELETE", `/projects/${projectId}`);
    },
  },

  /** Skills endpoints */
  skills: {
    // PUBLIC_INTERFACE
    async list() {
      /** Public list of skills. */
      return _request("GET", "/skills");
    },
    // PUBLIC_INTERFACE
    async create(payload) {
      /** Admin create skill. */
      return _request("POST", "/skills", { body: payload });
    },
    // PUBLIC_INTERFACE
    async update(skillId, payload) {
      /** Admin update skill. */
      return _request("PUT", `/skills/${skillId}`, { body: payload });
    },
    // PUBLIC_INTERFACE
    async remove(skillId) {
      /** Admin delete skill. */
      return _request("DELETE", `/skills/${skillId}`);
    },
  },

  /** Contact endpoints */
  contact: {
    // PUBLIC_INTERFACE
    async submitMessage(payload) {
      /** Public submit contact message. */
      return _request("POST", "/contact/messages", { body: payload });
    },
    // PUBLIC_INTERFACE
    async listMessages() {
      /** Admin list messages. */
      return _request("GET", "/contact/messages");
    },
    // PUBLIC_INTERFACE
    async updateMessage(messageId, payload) {
      /** Admin update message status. */
      return _request("PUT", `/contact/messages/${messageId}`, { body: payload });
    },
  },

  /** Admin endpoints */
  admin: {
    // PUBLIC_INTERFACE
    async listUsers() {
      /** Admin list all users. */
      return _request("GET", "/admin/users");
    },
  },
};

// PUBLIC_INTERFACE
export { ApiError };
/** Export ApiError for UI error rendering and global handling. */
