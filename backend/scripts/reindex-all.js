#!/usr/bin/env node
import prisma from '../src/utils/prisma.js';
import { indexTask, indexHelper } from '../src/services/es.client.js';

async function reindexTasks() {
  const batchSize = 500;
  let skip = 0;
  while (true) {
    const tasks = await prisma.task.findMany({ skip, take: batchSize });
    if (!tasks.length) break;
    for (const t of tasks) {
      await indexTask(t);
    }
    skip += tasks.length;
    console.log('Indexed', skip, 'tasks');
  }
}

async function reindexHelpers() {
  const batchSize = 500;
  let skip = 0;
  while (true) {
    const users = await prisma.user.findMany({ where: { role: 'HELPER' }, skip, take: batchSize });
    if (!users.length) break;
    for (const u of users) {
      await indexHelper(u);
    }
    skip += users.length;
    console.log('Indexed', skip, 'helpers');
  }
}

(async () => {
  try {
    console.log('Reindexing tasks...');
    await reindexTasks();
    console.log('Reindexing helpers...');
    await reindexHelpers();
    console.log('Reindex complete');
    process.exit(0);
  } catch (e) {
    console.error('Reindex failed', e);
    process.exit(1);
  }
})();
