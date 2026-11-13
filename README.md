# Zuru ATM Locator

A client-only React ATM locator for Zuru, Kebbi State. The browser reads ATM records directly from Firestore and displays nearby locations on a Leaflet/OpenStreetMap map.

## Prerequisites

- Node.js 20 and npm
- A Firebase project with Cloud Firestore
- Firebase CLI for applying Firestore rules and deploying Hosting
- A service-account key for the seed script

## Environment variables

The map uses Leaflet with OpenStreetMap tiles, so it does not require a map API key. The client Firebase configuration uses these variables in `client/.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

For Render deployments, add these same `VITE_` variables in the service's **Environment** tab. Vite embeds them at build time, so redeploy after adding or changing them.

## Setup

1. Create a Firebase project and enable Cloud Firestore in **production mode**.
2. In Firebase Console, open **Authentication → Sign-in method** and enable the **Email/Password** provider.
3. In Firebase project settings, register a web app. Copy its web config into `client/.env` (copy `client/.env.example` and fill in each value):

   - `VITE_FIREBASE_API_KEY`: web app API key
   - `VITE_FIREBASE_AUTH_DOMAIN`: web app auth domain
   - `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET`: default storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: web app messaging sender ID
   - `VITE_FIREBASE_APP_ID`: web app ID

   Firebase web configuration is public and is included in the client bundle. Security comes from the Firestore rules, not from hiding these values.
4. Publish the repository's Firestore rules to the project:

   ```powershell
   firebase use --add
   firebase deploy --only firestore:rules
   ```

   The rules in `firestore.rules` are:

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /atm_centres/{id} { allow read: if true; allow write: if false; }
       match /users/{uid} {
         allow read, update: if request.auth != null && request.auth.uid == uid;
         allow create: if request.auth != null && request.auth.uid == uid
           && request.resource.data.nin is string
           && request.resource.data.nin.matches('^[0-9]{11}$');
         allow delete: if false;
       }
     }
   }
   ```

   `users` holds sensitive NIN data and must never be publicly readable; users can only read or update their own UID-keyed document. ATM records remain world-readable and client writes are denied.
5. Install the seed script's service-account key **outside the repository and outside version control**. Never inline the key in code or commit it. The repository `.gitignore` also excludes common service-account key filenames as a safeguard. Set the credential path and project ID in PowerShell, replacing the example paths and ID:

   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\secure\firebase-service-account.json'
   $env:FIREBASE_PROJECT_ID = 'your-project-id'
   ```

6. Seed the twelve example records:

   ```powershell
   npm install
   npm --prefix client install
   npm run seed
   ```

   All sample coordinates in `scripts/seed-data.json` are **SYNTHETIC PLACEHOLDERS**. Replace them with coordinates read from Google Maps before presenting the records as real ATM locations.
7. Start the client:

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

## Performance and hosting

- The frontend is a Vite static site deployed to Firebase Hosting, which serves it through Google's CDN. Vite production builds minify and tree-shake the code; route pages and the Leaflet map are loaded on demand. The map uses no custom image or web-font assets, and the system font stack avoids a font download.
- Firebase Hosting sends `index.html` with revalidation/no-store headers and keeps fingerprinted `/assets/` files immutable for one year. Hosting provides transport compression for static assets.
- Firebase Authentication's browser persistence restores the session. The client also caches only the user's UID and display name in local storage so the returning-user shell can appear while Firebase verifies the session. It does not cache ID tokens or the Firestore profile (which contains NIN data). Nearby ATM results are cached in memory for two minutes and matching map search text is filtered locally.
- The current sign-in and signup flows use email/password; Firebase Auth is initialized without its unused popup/redirect resolver. Add that resolver if an OAuth popup or redirect provider is introduced later.
- Auth restoration has an eight-second timeout and a retry action. The profile document is fetched once in the background after auth resolves, so it cannot block the app shell.
- This repository has no Render web service, custom API, or database backend. `/health`, backend compression/CORS, Render region placement, connection pooling, startup migrations, server-side query/index optimization, and Render keep-alive therefore do not apply here. ATM searches query Firestore directly and run geohash-bound reads in parallel; the query uses Firestore's default geohash single-field index. There is no per-result database lookup/N+1 pattern.
- No Render keep-alive job is configured: the app's static frontend and Firestore do not need a warm Render process. If a separate Render free web service is introduced later, it can sleep when idle and a periodic ping is not a reliable substitute for a paid always-on instance. Keep the static frontend on Firebase Hosting (or another CDN) and place any API/database in a compatible region if that backend is added.
- There are no external fonts or content images to preload or convert; Leaflet's map tiles are requested only as the map is mounted. The module entry script is a browser module (deferred by default).

### Measuring performance

Lighthouse 13.6 mobile-mode runs were made against local Vite production previews of the pre-change commit and final build, using the same route (`/`, which redirected to `/login`) and Chrome setup. These are local results, not Render production measurements:

| Metric | Before | After |
| --- | ---: | ---: |
| LCP | 5,075 ms | 905 ms |
| TTFB | 466 ms | 528 ms |
| Total Blocking Time | 405 ms | 494 ms |
| Performance score | 0.68 | 0.87 |

The substantial LCP improvement is consistent with showing the shell before auth resolves. TBT increased by 89 ms and TTFB by 62 ms in this run; local Lighthouse results vary, and the auth SDK still performs background work. Measure the production domain after deployment to capture Render/Firebase network and cold-start behavior.
