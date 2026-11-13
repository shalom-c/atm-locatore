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

export async function fetchNearby({ lat, lng, radiusKm, query = '' }) {
  const latitude = validateCoordinate(lat, 'lat', -90, 90);
  const longitude = validateCoordinate(lng, 'lng', -180, 180);
  const radius = validateCoordinate(radiusKm, 'radius', 0.5, 50);
  const center = [latitude, longitude];
  const bounds = geohashQueryBounds(center, radius * 1000);
  const snapshots = await Promise.all(
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
  );

  let results = snapshots.flatMap((snapshot) =>
    snapshot.docs.map((document) => {
      const atm = document.data();
      return {
        ...atm,
        id: document.id,
        distance_km: distanceBetween(center, [atm.latitude, atm.longitude]) / 1000,
      };
    }),
  );

  // Geohash ranges over-return candidates, so filter by exact distance for correctness.
  results = results
    .filter((atm) => atm.distance_km <= radius)
    .sort((first, second) => first.distance_km - second.distance_km);

  const searchText = String(query).trim().toLowerCase();
  if (searchText) {
    results = results.filter((atm) =>
      [atm.name, atm.bank, atm.address].some((value) =>
        String(value).toLowerCase().includes(searchText),
      ),
    );
  }

  return results.slice(0, 20);
}
