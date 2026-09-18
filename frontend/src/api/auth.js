import api from "./client";

/**
 * Retries a request once after a short delay if it failed because the
 * Render instance was cold-starting (502/503/504). Any other error is
 * re-thrown immediately - this is not a generic retry-everything wrapper.
 */
async function withColdStartRetry(requestFn, { retries = 1, delayMs = 2500 } = {}) {
  try {
    return await requestFn();
  } catch (err) {
    if (err.isColdStart && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return withColdStartRetry(requestFn, { retries: retries - 1, delayMs });
    }
    throw err;
  }
}

/**
 * POST /auth/signup
 * body: { full_name, email, password, role: "client" | "freelancer" }
 */
export function signup({ full_name, email, password, role }) {
  return withColdStartRetry(() =>
    api.post("/auth/signup", { full_name, email, password, role }).then((res) => res.data)
  );
}

/**
 * POST /auth/login
 * OAuth2PasswordRequestForm - must be sent as application/x-www-form-urlencoded
 * with fields "username" (the email) and "password".
 * Returns a bearer token payload, standard FastAPI shape: { access_token, token_type }
 */
export function login({ email, password }) {
  const form = new URLSearchParams();
  form.set("grant_type", "password");
  form.set("username", email);
  form.set("password", password);

  return withColdStartRetry(() =>
    api
      .post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((res) => res.data)
  );
}
