import express from 'express';
import { searchTasks as dbSearchTasks } from '../services/task.service.js';
import { searchHelpersDbService } from '../services/user.service.js';
import client from '../services/es.client.js';
import prisma from '../utils/prisma.js';
import { verifyUserToken } from '../utils/jwt.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Resolve optional logged-in user from Authorization header
const resolveOptionalUser = async (req) => {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');
    if (scheme === 'Bearer' && token && token !== 'hirebuddy_admin_secret_2026') {
      const decoded = verifyUserToken(token);
      const userId = decoded?.id || decoded?.userId;
      if (userId) {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, phone: true, email: true, role: true, city: true },
        });
        if (u) return u;
      }
    }
  } catch {
    // Ignore invalid/expired token on public search routes
  }
  return null;
};

// Record a user search in SearchLog (non-blocking with 3-second duplicate guard)
const recentLogCache = new Map();
const recordSearchLog = async (
  req,
  {
    query = '',
    category = null,
    location = null,
    section = 'TASKS',
    resultsCount = 0,
  } = {}
) => {
  try {
    const cleanQuery = String(query || category || '').trim();
    const cleanCategory = category ? String(category).trim() : null;
    const cleanLocation = location ? String(location).trim() : null;

    if (!cleanQuery && !cleanCategory && !cleanLocation) return null;

    const resolvedUser = await resolveOptionalUser(req);
    const userId = resolvedUser?.id || req.body?.userId || req.query?.userId || null;
    const userName =
      resolvedUser?.name || req.body?.userName || req.query?.userName || 'Guest User';
    const userPhone =
      resolvedUser?.phone ||
      resolvedUser?.email ||
      req.body?.userPhone ||
      req.query?.userPhone ||
      null;
    const userRole =
      resolvedUser?.role || req.body?.userRole || req.query?.userRole || 'USER';

    const dedupeKey = `${userId || 'anon'}|${section}|${cleanQuery.toLowerCase()}|${
      cleanCategory || ''
    }|${cleanLocation || ''}`;
    const lastLoggedAt = recentLogCache.get(dedupeKey);
    if (lastLoggedAt && Date.now() - lastLoggedAt < 3500) {
      return null;
    }
    recentLogCache.set(dedupeKey, Date.now());

    return await prisma.searchLog.create({
      data: {
        userId,
        userName,
        userPhone,
        userRole,
        query: cleanQuery || cleanCategory || `Location: ${cleanLocation}`,
        category: cleanCategory,
        location: cleanLocation || resolvedUser?.city || null,
        section: String(section || 'TASKS').toUpperCase(),
        resultsCount: Number(resultsCount) || 0,
      },
    });
  } catch (err) {
    console.warn('SearchLog write warning:', err?.message);
    return null;
  }
};

// Simple ES-backed task search
router.get('/tasks', async (req, res) => {
  try {
    const { q, city, lat, lon, radius = '5km', limit = 20, offset = 0 } = req.query;
    const must = [];
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['title^3', 'description', 'category', 'city', 'skills'],
        },
      });
    }
    if (city) {
      must.push({ term: { city } });
    }

    const body = {
      from: Number(offset || 0),
      size: Number(limit || 20),
      query: must.length
        ? { bool: { must } }
        : { match_all: {} },
    };

    if (lat && lon) {
      body.sort = [
        {
          _geo_distance: {
            location: { lat: Number(lat), lon: Number(lon) },
            order: 'asc',
            unit: 'km',
            distance_type: 'plane',
          },
        },
      ];
      // also add geo filter
      body.query = {
        bool: {
          must,
          filter: {
            geo_distance: { distance: radius, location: { lat: Number(lat), lon: Number(lon) } },
          },
        },
      };
    }

    const result = await client.search({ index: 'tasks', body });
    const hits = result.hits.hits.map((h) => ({ id: h._id, ...h._source }));
    const total = result.hits.total?.value || 0;
    if (q || city || req.query.category) {
      recordSearchLog(req, {
        query: q || req.query.category || '',
        category: req.query.category || null,
        location: city || null,
        section: 'TASKS',
        resultsCount: hits.length || total,
      });
    }
    return res.json({ total, tasks: hits });
  } catch (e) {
    console.error('Search tasks error', e);
    // fallback to DB search
    try {
      const fallback = await dbSearchTasks(req.query);
      if (req.query.q || req.query.city || req.query.category) {
        recordSearchLog(req, {
          query: req.query.q || req.query.category || '',
          category: req.query.category || null,
          location: req.query.city || null,
          section: 'TASKS',
          resultsCount: fallback.tasks?.length || fallback.total || 0,
        });
      }
      return res.json({ total: fallback.total, tasks: fallback.tasks });
    } catch (err) {
      return res.status(500).json({ error: 'Search failed' });
    }
  }
});

// Robust ES-backed helper search with DB fallback
router.get('/helpers', async (req, res) => {
  try {
    const {
      q,
      city,
      lat,
      lon,
      radius = '50km',
      limit = 20,
      offset = 0,
      isAvailable,
      isVerified,
      minRating,
      maxPrice,
      sort,
    } = req.query;

    const must = [];
    const filter = [];

    if (q && q.trim()) {
      must.push({
        multi_match: {
          query: q.trim(),
          fields: ['name^3', 'skills^2', 'city'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (city && city.trim()) {
      must.push({
        match: {
          city: {
            query: city.trim(),
            operator: 'and',
          },
        },
      });
    }

    if (isAvailable === 'true' || isAvailable === true) {
      filter.push({ term: { isAvailable: true } });
    }

    if (isVerified === 'true' || isVerified === true) {
      filter.push({ term: { isVerified: true } });
    }

    if (minRating && !isNaN(Number(minRating))) {
      filter.push({ range: { averageRating: { gte: Number(minRating) } } });
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      const paise = Number(maxPrice) > 1000 ? Number(maxPrice) : Number(maxPrice) * 100;
      filter.push({ range: { hourlyRate: { lte: paise } } });
    }

    const boolQuery = {};
    if (must.length) boolQuery.must = must;
    if (filter.length) boolQuery.filter = filter;

    const body = {
      from: Number(offset || 0),
      size: Number(limit || 20),
      query: (must.length || filter.length) ? { bool: boolQuery } : { match_all: {} },
    };

    if (lat && lon) {
      body.sort = [
        {
          _geo_distance: {
            location: { lat: Number(lat), lon: Number(lon) },
            order: 'asc',
            unit: 'km',
            distance_type: 'plane',
          },
        },
      ];
    } else if (sort === 'price_low') {
      body.sort = [{ hourlyRate: { order: 'asc' } }];
    } else if (sort === 'price_high') {
      body.sort = [{ hourlyRate: { order: 'desc' } }];
    } else if (sort === 'rating_high') {
      body.sort = [{ averageRating: { order: 'desc' } }];
    } else if (sort === 'reviews_high') {
      body.sort = [{ totalReviews: { order: 'desc' } }];
    }

    const result = await client.search({ index: 'helpers', body });
    const hits = (result.hits?.hits || []).map((h) => {
      const s = h._source || {};
      return {
        id: h._id || s.id,
        ...s,
        skills: Array.isArray(s.skills)
          ? s.skills
          : (s.skills ? String(s.skills).split(',').map((x) => x.trim()).filter(Boolean) : []),
        isVerified: s.isVerified ?? (s.idVerificationStatus === 'VERIFIED'),
      };
    });

    const total = result.hits?.total?.value || 0;

    // If ES produced 0 hits (e.g. unindexed fields or fuzzy mismatch), check DB fallback
    if (hits.length === 0) {
      const fallback = await searchHelpersDbService(req.query);
      if (fallback.helpers.length > 0) {
        if (q || city) {
          recordSearchLog(req, {
            query: q || '',
            category: req.query.category || null,
            location: city || null,
            section: 'HELPERS',
            resultsCount: fallback.helpers.length,
          });
        }
        return res.json(fallback);
      }
    }

    if (q || city) {
      recordSearchLog(req, {
        query: q || '',
        category: req.query.category || null,
        location: city || null,
        section: 'HELPERS',
        resultsCount: hits.length,
      });
    }

    return res.json({ total, helpers: hits });
  } catch (e) {
    console.warn('ES search helpers error, falling back to database query:', e.message || e);
    try {
      const fallback = await searchHelpersDbService(req.query);
      if (req.query.q || req.query.city) {
        recordSearchLog(req, {
          query: req.query.q || '',
          category: req.query.category || null,
          location: req.query.city || null,
          section: 'HELPERS',
          resultsCount: fallback.helpers?.length || 0,
        });
      }
      return res.json(fallback);
    } catch (err) {
      console.error('Database search fallback failed:', err);
      return res.status(500).json({ error: 'Search failed' });
    }
  }
});

/**
 * POST /api/search/log - Explicitly log what a user is searching across Services, Helpers, Tasks, Marketplace
 */
router.post('/log', async (req, res) => {
  try {
    const { query, category, location, section = 'SERVICES', resultsCount = 0 } = req.body || {};
    const log = await recordSearchLog(req, {
      query,
      category,
      location,
      section,
      resultsCount,
    });
    return res.json({ success: true, log });
  } catch (error) {
    console.error('Log search error:', error);
    return res.status(500).json({ error: 'Failed to log search' });
  }
});

/**
 * GET /api/search/logs - Admin endpoint to inspect what users are searching
 */
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const { userId, section, q, limit = 150 } = req.query;
    const where = {};

    if (userId) where.userId = String(userId);
    if (section && section !== 'ALL') where.section = String(section).toUpperCase();
    if (q && String(q).trim()) {
      const term = String(q).trim();
      where.OR = [
        { query: { contains: term } },
        { userName: { contains: term } },
        { userPhone: { contains: term } },
        { category: { contains: term } },
        { location: { contains: term } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.searchLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit) || 150, 500),
      }),
      prisma.searchLog.count({ where }),
    ]);

    // Compute aggregated top queries & zero-result queries
    const queryMap = new Map();
    const sectionCounts = { SERVICES: 0, HELPERS: 0, TASKS: 0, MARKETPLACE: 0 };

    logs.forEach((item) => {
      const sec = (item.section || 'SERVICES').toUpperCase();
      sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;

      const key = String(item.query || '').trim().toLowerCase();
      if (!key) return;
      if (!queryMap.has(key)) {
        queryMap.set(key, {
          query: item.query,
          count: 0,
          zeroResultsCount: 0,
          totalResults: 0,
          lastSearchedAt: item.createdAt,
          section: item.section,
          users: new Set(),
        });
      }
      const entry = queryMap.get(key);
      entry.count += 1;
      entry.totalResults += Number(item.resultsCount || 0);
      if (Number(item.resultsCount || 0) === 0) {
        entry.zeroResultsCount += 1;
      }
      if (item.userId || item.userName) {
        entry.users.add(item.userId || item.userName);
      }
      if (new Date(item.createdAt) > new Date(entry.lastSearchedAt)) {
        entry.lastSearchedAt = item.createdAt;
      }
    });

    const aggregated = Array.from(queryMap.values()).map((e) => ({
      query: e.query,
      count: e.count,
      uniqueUsers: e.users.size,
      avgResults: Math.round(e.totalResults / e.count),
      zeroResultsCount: e.zeroResultsCount,
      section: e.section,
      lastSearchedAt: e.lastSearchedAt,
    }));

    const topQueries = [...aggregated].sort((a, b) => b.count - a.count).slice(0, 15);
    const zeroResultQueries = aggregated
      .filter((e) => e.zeroResultsCount > 0)
      .sort((a, b) => b.zeroResultsCount - a.zeroResultsCount)
      .slice(0, 10);

    return res.json({
      success: true,
      total,
      logs,
      topQueries,
      zeroResultQueries,
      sectionBreakdown: sectionCounts,
    });
  } catch (error) {
    console.error('Get search logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch search logs' });
  }
});

/**
 * DELETE /api/search/logs/:id - Delete a specific search log entry
 */
router.delete('/logs/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.searchLog.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete search log' });
  }
});

/**
 * DELETE /api/search/logs - Clear search logs (optional ?userId= filter)
 */
router.delete('/logs', authMiddleware, async (req, res) => {
  try {
    const where = req.query.userId ? { userId: String(req.query.userId) } : {};
    const deleted = await prisma.searchLog.deleteMany({ where });
    return res.json({ success: true, deletedCount: deleted.count });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to clear search logs' });
  }
});

export default router;
