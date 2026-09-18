import api from "./client";

/**
 * POST /users/{target_user_id}/reviews
 * body: { rating: 1-5, comment }
 */
export function addReview(targetUserId, { rating, comment }) {
  return api
    .post(`/users/${targetUserId}/reviews`, { rating, comment })
    .then((res) => res.data);
}

/**
 * GET /users/{target_user_id}/reviews
 * Response schema isn't typed in the spec; assumed to be an array of
 * { id, rating, comment, reviewer_id, target_user_id } matching ReviewResponse.
 */
export function getUserReviews(targetUserId) {
  return api.get(`/users/${targetUserId}/reviews`).then((res) => res.data);
}
