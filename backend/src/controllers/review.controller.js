import * as reviewService from '../services/review.service.js';

/**
 * Create a review
 */
export const createReview = async (req, res) => {
  try {
    const { taskId, givenToId, rating, comment } = req.body;
    const givenById = req.user.id;

    if (!taskId || !givenToId || !rating) {
      return res.status(400).json({ error: 'taskId, givenToId, and rating are required' });
    }

    const review = await reviewService.createReview(taskId, givenById, givenToId, rating, comment);

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get reviews for a user (helper profile)
 */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await reviewService.getUserReviews(userId, parseInt(limit), parseInt(offset));

    res.json(result);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get reviews given by a user
 */
export const getReviewsGivenByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await reviewService.getReviewsGivenByUser(userId, parseInt(limit), parseInt(offset));

    res.json(result);
  } catch (error) {
    console.error('Get reviews given by user error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a specific review
 */
export const getReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await reviewService.getReview(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a review
 */
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await reviewService.updateReview(reviewId, userId, rating, comment);

    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const result = await reviewService.deleteReview(reviewId, userId);

    res.json(result);
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get top-rated helpers
 */
export const getTopRatedHelpers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const helpers = await reviewService.getTopRatedHelpers(parseInt(limit));

    res.json(helpers);
  } catch (error) {
    console.error('Get top-rated helpers error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createReview,
  getUserReviews,
  getReviewsGivenByUser,
  getReview,
  updateReview,
  deleteReview,
  getTopRatedHelpers,
};
