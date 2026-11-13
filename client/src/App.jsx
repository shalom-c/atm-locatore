import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ControlBar from './components/ControlBar.jsx';
import MapView from './components/MapView.jsx';
import AtmList from './components/AtmList.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import StatusMessage from './components/StatusMessage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import useGeolocation from './hooks/useGeolocation.js';
import { fetchNearby } from './api.js';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import { getAuthErrorMessage } from './lib/auth.js';

const ZURU_CENTRE = { lat: 11.4333, lng: 4.9833 };
const DEGRADED_STATUSES = new Set([
  'denied',
  'unavailable',
  'timeout',
  'unsupported',
]);

function AtmLocator() {
  const { profile, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [radius, setRadius] = useState(5);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [selectedAtmId, setSelectedAtmId] = useState(null);
  const [manualDraft, setManualDraft] = useState({
    lat: String(ZURU_CENTRE.lat),
    lng: String(ZURU_CENTRE.lng),
  });
  const [manualCoords, setManualCoords] = useState(null);
  const requestId = useRef(0);
  const { coords, status, error: locationError, request } = useGeolocation();
  const effectiveCoords = coords || manualCoords;
  const isDegraded = DEGRADED_STATUSES.has(status);

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(getAuthErrorMessage(error));
    }
  }

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    if (!effectiveCoords) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setRequestError('');

    fetchNearby({ ...effectiveCoords, radiusKm: radius, query })
      .then((data) => {
        if (requestId.current !== currentRequestId) return;
        setResults(data);
        setSelectedAtmId(null);
      })
      .catch((error) => {
        if (requestId.current !== currentRequestId) return;
        setRequestError(error.message);
        setResults([]);
      })
      .finally(() => {
        if (requestId.current === currentRequestId) setLoading(false);
      });

    return () => {
      requestId.current += 1;
    };
  }, [effectiveCoords, radius, query]);

  function submitManualCoordinates(event) {
    event.preventDefault();
    const lat = Number(manualDraft.lat);
    const lng = Number(manualDraft.lng);

    if (
      manualDraft.lat.trim() === '' ||
      manualDraft.lng.trim() === '' ||
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      setRequestError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    setRequestError('');
    setManualCoords({ lat, lng });
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">Z</div>
        <div>
          <p className="eyebrow">Kebbi State, Nigeria</p>
          <h1>ATM Locator</h1>
          <p className="intro">Find an ATM near you in Zuru.</p>
        </div>
        <div className="account-actions">
          <span>{profile?.displayName || 'Your account'}</span>
          <button className="button button-secondary" type="button" onClick={handleLogout}>Log out</button>
          {logoutError && <span className="logout-error" role="alert">{logoutError}</span>}
        </div>
      </header>

      <ControlBar
        locationStatus={status}
        onLocate={request}
        radius={radius}
        onRadiusChange={setRadius}
        query={query}
        onQueryChange={setQuery}
      />

      {isDegraded && (
        <form className="manual-location" onSubmit={submitManualCoordinates}>
          <div className="manual-copy">
            <h2>Enter a location manually</h2>
            <p>{locationError} Use the Zuru town centre or enter coordinates.</p>
          </div>
          <label>
            Latitude
            <input
              type="number"
              step="any"
              min="-90"
              max="90"
              value={manualDraft.lat}
              onChange={(event) =>
                setManualDraft((draft) => ({ ...draft, lat: event.target.value }))
              }
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="any"
              min="-180"
              max="180"
              value={manualDraft.lng}
              onChange={(event) =>
                setManualDraft((draft) => ({ ...draft, lng: event.target.value }))
              }
            />
          </label>
          <button className="button button-primary manual-submit" type="submit">
            Find ATMs
          </button>
        </form>
      )}

      <StatusMessage
        loading={loading}
        error={requestError}
        count={results.length}
        radius={radius}
        hasCoordinates={Boolean(effectiveCoords)}
      />

      <section className="workspace" aria-label="ATM search results">
        <div className="map-panel">
          <MapView
            coords={effectiveCoords}
            results={results}
            selectedAtmId={selectedAtmId}
          />
        </div>
        <AtmList
          results={results}
          selectedAtmId={selectedAtmId}
          onSelect={setSelectedAtmId}
          loading={loading}
        />
      </section>

      <footer className="page-footer">
        <span>Map data &copy; OpenStreetMap contributors</span>
        <span>Confirm ATM availability with the bank before travelling.</span>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AtmLocator />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
