import express from 'express';
import { searchTasks as dbSearchTasks } from '../services/task.service.js';
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

// Simple ES-backed helper search
router.get('/helpers', async (req, res) => {
  try {
    const { q, city, lat, lon, radius = '50km', limit = 20, offset = 0 } = req.query;
    const must = [];
    if (q) {
      must.push({ multi_match: { query: q, fields: ['name^3', 'skills', 'city'] } });
    }
    if (city) must.push({ term: { city } });

    const body = {
      from: Number(offset || 0),
      size: Number(limit || 20),
      query: must.length ? { bool: { must } } : { match_all: {} },
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
      body.query = { bool: { must, filter: { geo_distance: { distance: radius, location: { lat: Number(lat), lon: Number(lon) } } } } };
    }

    const result = await client.search({ index: 'helpers', body });
    const hits = result.hits.hits.map((h) => ({ id: h._id, ...h._source }));
    return res.json({ total: result.hits.total?.value || 0, helpers: hits });
  } catch (e) {
    console.error('Search helpers error', e);
    return res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
