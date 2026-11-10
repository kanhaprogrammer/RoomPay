// Vite exposes env vars prefixed with VITE_ on import.meta.env.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// Free hosting (e.g. Render) can take ~30-60s to wake a sleeping server.
const REQUEST_TIMEOUT_MS = 60000;

export class ApiRequestError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      signal: controller.signal,
    });
  } catch (networkErr) {
    if (networkErr && networkErr.name === "AbortError") {
      throw new ApiRequestError("The server is taking too long to respond. Please try again in a moment.");
    }
    throw new ApiRequestError("Can't reach the Room Pay server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiRequestError(
      (data && data.message) || "Something went wrong. Please try again.",
      response.status
    );
  }

  return data;
}

const seg = encodeURIComponent;

export const roomApi = {
  create: (roomName, name) =>
    request("/rooms", { method: "POST", body: JSON.stringify({ roomName, name }) }),

  join: (roomCode, name) =>
    request("/rooms/join", { method: "POST", body: JSON.stringify({ roomCode, name }) }),

  getOverview: (roomCode) => request(`/rooms/${seg(roomCode)}`),

  getMembers: (roomCode) => request(`/rooms/${seg(roomCode)}/members`),

  leave: (roomCode, memberId) =>
    request(`/rooms/${seg(roomCode)}/members/${seg(memberId)}`, { method: "DELETE" }),

  kick: (roomCode, memberId, requesterId) =>
    request(`/rooms/${seg(roomCode)}/members/${seg(memberId)}/kick`, {
      method: "POST",
      body: JSON.stringify({ requesterId }),
    }),
};

export const expenseApi = {
  add: (payload) => request("/expenses", { method: "POST", body: JSON.stringify(payload) }),

  list: (roomCode, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const qs = params.toString();
    return request(`/expenses/${seg(roomCode)}${qs ? `?${qs}` : ""}`);
  },

  recent: (roomCode, limit = 5) => request(`/expenses/${seg(roomCode)}/recent?limit=${limit}`),
};
