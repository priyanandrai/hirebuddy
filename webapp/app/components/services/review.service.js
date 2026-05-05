// webapp/app/components/services/review.service.js
import { apiClient } from "../lib/apiClient";
import { REVIEW_ENDPOINTS } from "../lib/endpoints";

export const createReview = (taskId, givenToId, rating, comment = null) => {
  return apiClient(REVIEW_ENDPOINTS.CREATE_REVIEW, {
    method: "POST",
    body: {
      taskId,
      givenToId,
      rating, // 1-5
      comment,
    },
  });
};

export const getUserReviews = (userId, limit = 20, offset = 0) => {
  return apiClient(`${REVIEW_ENDPOINTS.GET_USER_REVIEWS}/${userId}?limit=${limit}&offset=${offset}`, {
    method: "GET",
  });
};

export const getMyReviews = (limit = 20, offset = 0) => {
  return apiClient(`${REVIEW_ENDPOINTS.GET_MY_REVIEWS}?limit=${limit}&offset=${offset}`, {
    method: "GET",
  });
};

export const getReviewById = (reviewId) => {
  return apiClient(`${REVIEW_ENDPOINTS.GET_REVIEW}/${reviewId}`, {
    method: "GET",
  });
};

export const updateReview = (reviewId, rating = null, comment = null) => {
  return apiClient(`${REVIEW_ENDPOINTS.UPDATE_REVIEW}/${reviewId}`, {
    method: "PUT",
    body: { rating, comment },
  });
};

export const deleteReview = (reviewId) => {
  return apiClient(`${REVIEW_ENDPOINTS.DELETE_REVIEW}/${reviewId}`, {
    method: "DELETE",
  });
};

export const getTopRatedHelpers = (limit = 10) => {
  return apiClient(`${REVIEW_ENDPOINTS.GET_TOP_HELPERS}?limit=${limit}`, {
    method: "GET",
  });
};

export default {
  createReview,
  getUserReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getTopRatedHelpers,
};
