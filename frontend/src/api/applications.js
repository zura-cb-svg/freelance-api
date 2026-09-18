import api from "./client";

/**
 * POST /jobs/{job_id}/applications
 * body: { cover_letter, proposed_price, estimated_days }
 */
export function applyToJob(jobId, { cover_letter, proposed_price, estimated_days }) {
  return api
    .post(`/jobs/${jobId}/applications`, { cover_letter, proposed_price, estimated_days })
    .then((res) => res.data);
}

/**
 * GET /jobs/{job_id}/applications
 * Intended for the job owner to review applications received.
 */
export function getApplicationsForJob(jobId) {
  return api.get(`/jobs/${jobId}/applications`).then((res) => res.data);
}

/**
 * PATCH /jobs/applications/{application_id}/status
 * body: { status: "pending" | "accepted" | "rejected" }
 */
export function updateApplicationStatus(applicationId, status) {
  return api
    .patch(`/jobs/applications/${applicationId}/status`, { status })
    .then((res) => res.data);
}

/**
 * GET /users/me/applications
 * The freelancer's own submitted applications.
 */
export function getMyApplications() {
  return api.get("/users/me/applications").then((res) => res.data);
}
