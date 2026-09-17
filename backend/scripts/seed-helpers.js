#!/usr/bin/env node
import prisma from '../src/utils/prisma.js';
import { indexHelper } from '../src/services/es.client.js';

const CATEGORIES = [
  'Cleaning',
  'Repairs',
  'Furniture Assembly',
  'Grocery Shopping',
  'Elder Care',
  'Delivery',
  'Driver',
  'Home Support',
];

const sampleCities = ['Delhi', 'Noida', 'Meerut', 'Ghaziabad', 'Greater Noida'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function createHelperForCategory(category, idx) {
  const name = `${category.split(' ')[0]} Helper ${idx}`;
  const skills = category;
  const city = rand(sampleCities);
  const hourlyRate = (150 + (idx * 25)) * 100; // paise
  try {
    const user = await prisma.user.create({
      data: {
        name,
        role: 'HELPER',
        skills,
        city,
        hourlyRate,
        isAvailable: true,
        averageRating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
        totalReviews: Math.floor(Math.random() * 200),
        password: null,
      }
    });

    console.log('Created helper', user.id, user.name, category);
    await indexHelper(user);
    console.log('Indexed helper', user.id);
    return user;
  } catch (e) {
    console.error('Failed to create helper for', category, e?.message || e);
  }
}

(async function main(){
  try {
    console.log('Seeding helpers for categories...');
    for (const cat of CATEGORIES) {
      // create 2 helpers per category
      await createHelperForCategory(cat, 1);
      await createHelperForCategory(cat, 2);
    }
    console.log('Seeding complete');
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed', e);
    process.exit(1);
  }
})();
