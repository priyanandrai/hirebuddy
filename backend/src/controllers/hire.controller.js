import { createTaskAndIndex } from '../services/task.service.js';

export const createHireRequest = async (req, res) => {
  try {
    const user = req.user;
    const payload = req.body;

    // Basic validation
    if (!payload.title || !payload.description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    const task = await createTaskAndIndex(payload, user);
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Create hire request error', error);
    res.status(500).json({ message: 'Failed to create hire request' });
  }
};

export default {
  createHireRequest,
};
