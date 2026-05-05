import { prisma } from '../utils/prisma.js';

/**
 * Create a review for a completed task
 */
export const createReview = async (taskId, givenById, givenToId, rating, comment = null) => {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Verify task is completed
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'COMPLETED') {
      throw new Error('Can only review completed tasks');
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        taskId_givenById: { taskId, givenById },
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this task');
    }

    const review = await prisma.review.create({
      data: {
        taskId,
        givenById,
        givenToId,
        rating,
        comment,
      },
      include: {
        givenBy: { select: { id: true, name: true, image: true } },
        givenTo: { select: { id: true, name: true, image: true } },
      },
    });

    // Update user's average rating
    const allReviews = await prisma.review.findMany({
      where: { givenToId },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: givenToId },
      data: {
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews: allReviews.length,
      },
    });

    return review;
  } catch (error) {
    console.error('Failed to create review:', error);
    throw error;
  }
};

/**
 * Get reviews for a user (helper)
 */
export const getUserReviews = async (userId, limit = 20, offset = 0) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { givenToId: userId },
      include: {
        givenBy: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.review.count({ where: { givenToId: userId } });

    // Calculate stats
    const stats = {
      totalReviews: total,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    reviews.forEach((review) => {
      stats.ratingDistribution[review.rating]++;
    });

    if (total > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      stats.averageRating = parseFloat((totalRating / total).toFixed(2));
    }

    return { reviews, total, limit, offset, stats };
  } catch (error) {
    console.error('Failed to fetch user reviews:', error);
    throw error;
  }
};

/**
 * Get reviews given by a user
 */
export const getReviewsGivenByUser = async (userId, limit = 20, offset = 0) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { givenById: userId },
      include: {
        givenTo: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.review.count({ where: { givenById: userId } });

    return { reviews, total, limit, offset };
  } catch (error) {
    console.error('Failed to fetch reviews given by user:', error);
    throw error;
  }
};

/**
 * Get a specific review
 */
export const getReview = async (reviewId) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        givenBy: { select: { id: true, name: true, image: true } },
        givenTo: { select: { id: true, name: true, image: true } },
        task: { select: { id: true, title: true, description: true } },
      },
    });

    return review;
  } catch (error) {
    console.error('Failed to fetch review:', error);
    throw error;
  }
};

/**
 * Update a review
 */
export const updateReview = async (reviewId, userId, rating = null, comment = null) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.givenById !== userId) {
      throw new Error('You can only edit your own reviews');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating !== null ? rating : undefined,
        comment: comment !== null ? comment : undefined,
      },
      include: {
        givenBy: { select: { id: true, name: true, image: true } },
        givenTo: { select: { id: true, name: true, image: true } },
      },
    });

    // Recalculate average rating
    const allReviews = await prisma.review.findMany({
      where: { givenToId: review.givenToId },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: review.givenToId },
      data: {
        averageRating: parseFloat(avgRating.toFixed(2)),
      },
    });

    return updatedReview;
  } catch (error) {
    console.error('Failed to update review:', error);
    throw error;
  }
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId, userId) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.givenById !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate average rating
    const allReviews = await prisma.review.findMany({
      where: { givenToId: review.givenToId },
    });

    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.user.update({
        where: { id: review.givenToId },
        data: {
          averageRating: parseFloat(avgRating.toFixed(2)),
          totalReviews: allReviews.length,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: review.givenToId },
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });
    }

    return { success: true, message: 'Review deleted' };
  } catch (error) {
    console.error('Failed to delete review:', error);
    throw error;
  }
};

/**
 * Get top-rated helpers
 */
export const getTopRatedHelpers = async (limit = 10) => {
  try {
    const helpers = await prisma.user.findMany({
      where: { role: 'HELPER', averageRating: { gt: 0 } },
      select: {
        id: true,
        name: true,
        image: true,
        skills: true,
        averageRating: true,
        totalReviews: true,
        city: true,
      },
      orderBy: { averageRating: 'desc' },
      take: limit,
    });

    return helpers;
  } catch (error) {
    console.error('Failed to fetch top-rated helpers:', error);
    throw error;
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
