import api from "./client";

/**
 * GET /jobs/
 * Supported query params (per backend OpenAPI spec): search, min_budget,
 * max_budget, limit (default 10), offset (default 0).
 * There is no server-side category / job-type / remote / experience filter,
 * so those are not implemented as fake params.
 */
export function getJobs({ search, minBudget, maxBudget, limit = 12, offset = 0 } = {}) {
  const params = { limit, offset };
  if (search) params.search = search;
  if (minBudget !== undefined && minBudget !== null && minBudget !== "") {
    params.min_budget = minBudget;
  }
  if (maxBudget !== undefined && maxBudget !== null && maxBudget !== "") {
    params.max_budget = maxBudget;
  }
  return api.get("/jobs/", { params }).then((res) => res.data);
}

/**
 * There is no GET /jobs/{id} endpoint on the backend yet. To show a single
 * job's details we search across the paginated list for a matching id.
 * This is a client-side workaround, not a real detail endpoint - it will
 * stop being reliable once the catalog is large. Flagged clearly for a
 * future backend addition.
 */
export async function findJobById(id) {
  const targetId = Number(id);
  const pageSize = 50;
  let offset = 0;

  // Cap the search so a missing job can't spin forever.
  for (let page = 0; page < 20; page += 1) {
    const batch = await getJobs({ limit: pageSize, offset });
    const match = batch.find((job) => job.id === targetId);
    if (match) return match;
    if (batch.length < pageSize) return null;
    offset += pageSize;
  }
  return null;
}

/**
 * POST /jobs/
 * body: { title, description, budget }
 */
export function createJob({ title, description, budget }) {
  return api.post("/jobs/", { title, description, budget }).then((res) => res.data);
}

/**
 * PUT /jobs/{id}
 * body: { title, description, budget }
 */
export function updateJob(id, { title, description, budget }) {
  return api.put(`/jobs/${id}`, { title, description, budget }).then((res) => res.data);
}

/**
 * DELETE /jobs/{id}
 */
export function deleteJob(id) {
  return api.delete(`/jobs/${id}`).then((res) => res.data);
}
