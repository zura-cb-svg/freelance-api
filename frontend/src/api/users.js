import api from "./client";

/**
 * GET /users/me
 */
export function getMyProfile() {
  return api.get("/users/me").then((res) => res.data);
}

/**
 * PATCH /users/me
 * body: { full_name?, bio?, skills? }
 */
export function updateMyProfile({ full_name, bio, skills }) {
  const payload = {};
  if (full_name !== undefined) payload.full_name = full_name;
  if (bio !== undefined) payload.bio = bio;
  if (skills !== undefined) payload.skills = skills;
  return api.patch("/users/me", payload).then((res) => res.data);
}

/**
 * GET /users/me/jobs
 * Jobs posted by the currently authenticated client.
 */
export function getMyJobs() {
  return api.get("/users/me/jobs").then((res) => res.data);
}

/**
 * POST /users/me/portfolio  (multipart/form-data, field name "file")
 */
export function uploadPortfolio(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post("/users/me/portfolio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
}
