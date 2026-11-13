// All coordinates in seed-data.json are SYNTHETIC PLACEHOLDERS; replace each with Google Maps values.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { geohashForLocation } from 'geofire-common';

const inputPath = resolve(process.argv[2] || 'scripts/seed-data.json');
const records = JSON.parse(await readFile(inputPath, 'utf8'));

if (!Array.isArray(records)) {
  throw new Error('Seed input must be a JSON array of ATM records.');
}

for (const [index, record] of records.entries()) {
  if (
    typeof record.name !== 'string' ||
    typeof record.bank !== 'string' ||
    typeof record.address !== 'string' ||
    typeof record.latitude !== 'number' ||
    !Number.isFinite(record.latitude) ||
    record.latitude < -90 ||
    record.latitude > 90 ||
    typeof record.longitude !== 'number' ||
    !Number.isFinite(record.longitude) ||
    record.longitude < -180 ||
    record.longitude > 180 ||
    (record.phone !== null && typeof record.phone !== 'string') ||
    !['active', 'out_of_service'].includes(record.status) ||
    typeof record.verified_at !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(record.verified_at)
  ) {
    throw new Error(`Invalid ATM record at index ${index}.`);
  }
}

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = getFirestore();
const collection = db.collection('atm_centres');

for (let offset = 0; offset < records.length; offset += 500) {
  const batch = db.batch();
  for (const record of records.slice(offset, offset + 500)) {
    batch.set(collection.doc(), {
      ...record,
      geohash: geohashForLocation([record.latitude, record.longitude]),
    });
  }
  await batch.commit();
}

console.log(`Seeded ${records.length} ATM records into atm_centres.`);
