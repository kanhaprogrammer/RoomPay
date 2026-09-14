const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkErr) {
    throw new Error(
      "Can't reach the Room Pay server. Make sure the backend is running."
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch (parseErr) {
    data = null;
  }

  if (!response.ok) {
    throw new Error((data && data.message) || "Something went wrong. Please try again.");
  }

  return data;
}

export const roomApi = {
  create: (roomName, name) =>
    request("/rooms", { method: "POST", body: JSON.stringify({ roomName, name }) }),

  join: (roomCode, name) =>
    request("/rooms/join", { method: "POST", body: JSON.stringify({ roomCode, name }) }),

  getOverview: (roomCode) => request(`/rooms/${roomCode}`),

  getMembers: (roomCode) => request(`/rooms/${roomCode}/members`),

  leave: (roomCode, memberId) =>
    request(`/rooms/${roomCode}/members/${memberId}`, { method: "DELETE" }),

  kick: (roomCode, memberId, requesterId) =>
    request(`/rooms/${roomCode}/members/${memberId}/kick`, {
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
    return request(`/expenses/${roomCode}${qs ? `?${qs}` : ""}`);
  },

  recent: (roomCode, limit = 5) => request(`/expenses/${roomCode}/recent?limit=${limit}`),
};
