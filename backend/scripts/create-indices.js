#!/usr/bin/env node
import { createIndices } from '../src/services/es.client.js';

(async () => {
  try {
    const res = await createIndices();
    console.log('Indices created/checked:', res);
    process.exit(0);
  } catch (e) {
    console.error('Failed to create indices', e);
    process.exit(1);
  }
})();
