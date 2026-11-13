# Zuru ATM Locator

A client-only React ATM locator for Zuru, Kebbi State. The browser reads ATM records directly from Firestore and displays nearby locations on a Leaflet/OpenStreetMap map.

## Prerequisites

- Node.js 20 and npm
- A Firebase project with Cloud Firestore
- Firebase CLI for applying Firestore rules and deploying Hosting
- A service-account key for the seed script

## Setup

1. Create a Firebase project and enable Cloud Firestore in **production mode**.
2. In Firebase project settings, register a web app. Copy its web config into `client/.env` (copy `client/.env.example` and fill in each value):

   - `VITE_FIREBASE_API_KEY`: web app API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: web app auth domain
   - `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: default storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: web app messaging sender ID
   - `VITE_FIREBASE_APP_ID`: web app ID

   Firebase web configuration is public and is included in the client bundle. Security comes from the Firestore rules, not from hiding these values.
3. Apply the repository's rules to the project:

   ```powershell
   firebase use --add
   firebase deploy --only firestore:rules
   ```

   These rules allow public reads of `atm_centres` and deny all writes from clients.
4. Install the seed script's service-account key **outside the repository and outside version control**. Never inline the key in code or commit it. The repository `.gitignore` also excludes common service-account key filenames as a safeguard. Set the credential path and project ID in PowerShell, replacing the example paths and ID:

   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\secure\firebase-service-account.json'
   $env:FIREBASE_PROJECT_ID = 'your-project-id'
   ```

5. Seed the twelve example records:

   ```powershell
   npm install
   npm --prefix client install
   npm run seed
   ```

   All sample coordinates in `scripts/seed-data.json` are **SYNTHETIC PLACEHOLDERS**. Replace them with coordinates read from Google Maps before presenting the records as real ATM locations.
6. Start the client:

   ```powershell
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). Build the client with `npm run build`; Firebase Hosting serves the generated `client/dist` directory.

## Firestore data and radius searches

The `atm_centres` collection contains one document per ATM with `name`, `bank`, `address`, numeric `latitude` and `longitude`, mandatory `geohash`, nullable `phone`, `status` (`active` or `out_of_service`), and `verified_at` (`YYYY-MM-DD`). `scripts/seed.mjs` computes each geohash from its coordinates before writing the record.

Firestore cannot query a circular radius directly. The client uses `geofire-common` to generate geohash range bounds around the search center, reads all matching ranges, and then filters candidates by exact great-circle distance before sorting and limiting the results. The distance calculation uses Earth's mean radius of **6371 km**. Geohash ranges can include points outside the circle, so the exact distance filter is essential. Text matching on ATM name, bank, and address is performed in the client after the distance filter.

The current query does not filter by status. If a Firestore query later combines geohash ordering with a `status` filter, Firestore may require a composite index; create the index requested by the Firestore error before deploying that query.

## Limitations

- GPS accuracy varies by device and environment; results are only as precise as the reported coordinates and stored records.
- Internet connectivity is required to load Firestore results and OpenStreetMap tiles.
- Location search depends on the user granting browser permission. If permission or GPS is unavailable, enter coordinates manually; the form defaults to the Zuru town centre (`11.4333, 4.9833`).
- ATM status and verification dates can become stale. Confirm availability with the bank before travelling.
