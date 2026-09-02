import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const node = process.env.ELASTICSEARCH_URL || process.env.ELASTIC_SEARCH_URL;
const apiKey = process.env.ELASTICSEARCH_API_KEY || process.env.ELASTIC_SEARCH_API_KEY;

const client = new Client({
  node: node || 'http://localhost:9200',
  auth: apiKey ? { apiKey } : undefined,
});

async function createIndices() {
  // tasks index
  const hasTasks = await client.indices.exists({ index: 'tasks' });
  if (!hasTasks) {
    await client.indices.create({
      index: 'tasks',
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'text', analyzer: 'english' },
            description: { type: 'text', analyzer: 'english' },
            category: { type: 'keyword' },
            city: { type: 'keyword' },
            location: { type: 'geo_point' },
            preferredAt: { type: 'date' },
            budget: { type: 'double' },
            helperId: { type: 'keyword' },
            createdAt: { type: 'date' }
          }
        }
      }
    });
  }

  // helpers index
  const hasHelpers = await client.indices.exists({ index: 'helpers' });
  if (!hasHelpers) {
    await client.indices.create({
      index: 'helpers',
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            name: { type: 'text', analyzer: 'english' },
            skills: { type: 'text', analyzer: 'english' },
            city: { type: 'keyword' },
            latitude: { type: 'float' },
            longitude: { type: 'float' },
            isAvailable: { type: 'boolean' },
            averageRating: { type: 'double' }
          }
        }
      }
    });
  }

  return { tasks: !hasTasks, helpers: !hasHelpers };
}

async function indexTask(task) {
  if (!task || !task.id) return;
  const doc = {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    city: task.city || null,
    location: task.latitude && task.longitude ? { lat: task.latitude, lon: task.longitude } : undefined,
    preferredAt: task.preferredAt,
    budget: task.budget,
    helperId: task.assignedToId || task.helperId || null,
    createdAt: task.createdAt,
  };
  await client.index({ index: 'tasks', id: String(task.id), document: doc, refresh: 'wait_for' }).catch((e) => console.error('ES indexTask error', e));
}

async function deleteTask(taskId) {
  if (!taskId) return;
  await client.delete({ index: 'tasks', id: String(taskId), refresh: 'wait_for' }).catch(() => {});
}

async function indexHelper(user) {
  if (!user || !user.id) return;
  const doc = {
    id: user.id,
    name: user.name,
    skills: user.skills || null,
    city: user.city || null,
    latitude: user.latitude || null,
    longitude: user.longitude || null,
    isAvailable: !!user.isAvailable,
    averageRating: user.averageRating || 0,
  };
  await client.index({ index: 'helpers', id: String(user.id), document: doc, refresh: 'wait_for' }).catch((e) => console.error('ES indexHelper error', e));
}

async function deleteHelper(userId) {
  if (!userId) return;
  await client.delete({ index: 'helpers', id: String(userId), refresh: 'wait_for' }).catch(() => {});
}

export default client;
export { createIndices, indexTask, deleteTask, indexHelper, deleteHelper };
