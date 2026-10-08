import express from 'express';
import { searchTasks as dbSearchTasks } from '../services/task.service.js';
import { searchHelpersDbService } from '../services/user.service.js';
import client from '../services/es.client.js';

const router = express.Router();

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
    return res.json({ total: result.hits.total?.value || 0, tasks: hits });
  } catch (e) {
    console.error('Search tasks error', e);
    // fallback to DB search
    try {
      const fallback = await dbSearchTasks(req.query);
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
        return res.json(fallback);
      }
    }

    return res.json({ total, helpers: hits });
  } catch (e) {
    console.warn('ES search helpers error, falling back to database query:', e.message || e);
    try {
      const fallback = await searchHelpersDbService(req.query);
      return res.json(fallback);
    } catch (err) {
      console.error('Database search fallback failed:', err);
      return res.status(500).json({ error: 'Search failed' });
    }
  }
});

export default router;
