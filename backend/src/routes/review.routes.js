import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/reviews - Create a review
 */
router.post('/', reviewController.createReview);

/**
 * GET /api/reviews/user/:userId - Get reviews for a user
 */
router.get('/user/:userId', reviewController.getUserReviews);

/**
 * GET /api/reviews/my-reviews - Get reviews given by current user
 */
router.get('/my-reviews', reviewController.getReviewsGivenByUser);

/**
 * GET /api/reviews/top-helpers - Get top-rated helpers
 */
router.get('/top-helpers', reviewController.getTopRatedHelpers);

/**
 * GET /api/reviews/:reviewId - Get a specific review
 */
router.get('/:reviewId', reviewController.getReview);

/**
 * PUT /api/reviews/:reviewId - Update a review
 */
router.put('/:reviewId', reviewController.updateReview);

/**
 * DELETE /api/reviews/:reviewId - Delete a review
 */
router.delete('/:reviewId', reviewController.deleteReview);

export default router;
