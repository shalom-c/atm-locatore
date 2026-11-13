import {
  collection,
  getDocs,
  orderBy,
  query as firestoreQuery,
  startAt,
  endAt,
} from 'firebase/firestore';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';
import { db } from './lib/firebase.js';

const nearbyCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 30;

function validateCoordinate(value, parameter, minimum, maximum) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`Invalid ${parameter}: a numeric value is required.`);
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error(
      `Invalid ${parameter}: must be a number from ${minimum} to ${maximum}.`,
    );
  }
  return number;
}

async function fetchNearbyCandidates(latitude, longitude, radius) {
  const key = JSON.stringify([latitude, longitude, radius]);
  const cached = nearbyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  if (cached) nearbyCache.delete(key);

  const center = [latitude, longitude];
  const bounds = geohashQueryBounds(center, radius * 1000);
  const promise = Promise.all(
    bounds.map((bound) =>
      getDocs(
        firestoreQuery(
          collection(db, 'atm_centres'),
          orderBy('geohash'),
          startAt(bound[0]),
          endAt(bound[1]),
        ),
      ),
    ),
  )
    .then((snapshots) =>
      snapshots
        .flatMap((snapshot) =>
          snapshot.docs.map((document) => {
            const atm = document.data();
            return {
              ...atm,
              id: document.id,
              distance_km: distanceBetween(center, [atm.latitude, atm.longitude]) / 1000,
            };
          }),
        )
        .filter((atm) => atm.distance_km <= radius)
        .sort((first, second) => first.distance_km - second.distance_km),
    )
    .catch((error) => {
      nearbyCache.delete(key);
      throw error;
    });

  nearbyCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, promise });
  if (nearbyCache.size > MAX_CACHE_ENTRIES) {
    nearbyCache.delete(nearbyCache.keys().next().value);
  }
  return promise;
}

export async function fetchNearby({ lat, lng, radiusKm, query = '' }) {
  const latitude = validateCoordinate(lat, 'lat', -90, 90);
  const longitude = validateCoordinate(lng, 'lng', -180, 180);
  const radius = validateCoordinate(radiusKm, 'radius', 0.5, 50);
  const results = await fetchNearbyCandidates(latitude, longitude, radius);

  const searchText = String(query).trim().toLowerCase();
  const filteredResults = searchText
    ? results.filter((atm) =>
        [atm.name, atm.bank, atm.address].some((value) =>
          String(value).toLowerCase().includes(searchText),
        ),
      )
    : results;

  return filteredResults.slice(0, 20);
}
