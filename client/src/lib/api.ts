const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
  token?: string;
};

async function tryRefresh(): Promise<string | null> {
  const { getRefreshToken, setToken, clearSession } = await import("./auth");
  const refreshToken = getRefreshToken();

  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error();

    setToken(data.accessToken);

    return data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

export async function apiFetch(
  path: string,
  options: ApiOptions = {},
  isRetry = false
) {
  const { method = "GET", body, token } = options;

  // FormData (file uploads) must NOT be JSON.stringify'd and must NOT get a
  // manual Content-Type — the browser sets its own multipart boundary.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    // IMPORTANT: without this, the browser's HTTP cache can serve a
    // previously logged-in user's response for the same GET URL
    // (e.g. /api/applications/me) even after a different user's token
    // is sent, since the cache key does not include the Authorization
    // header unless the server sends "Vary: Authorization".
    cache: "no-store",
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isRetry && token) {
    const newToken = await tryRefresh();

    if (newToken) {
      return apiFetch(path, { ...options, token: newToken }, true);
    }

    window.location.href = "/login";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Something went wrong");
  }

  return data;
}