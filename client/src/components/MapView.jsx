import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ZURU_CENTRE = [11.4333, 4.9833];

function MapController({ coords, selectedAtmId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (selectedAtmId) {
      const marker = markerRefs.current.get(selectedAtmId);
      if (marker) {
        map.panTo(marker.getLatLng());
        marker.openPopup();
        return;
      }
    }

    if (coords) {
      map.panTo([coords.lat, coords.lng]);
    }
  }, [coords, map, markerRefs, selectedAtmId]);

  return null;
}

function formatVerifiedDate(value) {
  if (!value) {
    return 'Not provided';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export default function MapView({ coords, results, selectedAtmId }) {
  const markerRefs = useRef(new Map());

  return (
    <MapContainer
      center={coords ? [coords.lat, coords.lng] : ZURU_CENTRE}
      zoom={14}
      scrollWheelZoom
      className="leaflet-map"
      aria-label="Interactive map showing nearby ATMs"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {coords && (
        <CircleMarker
          center={[coords.lat, coords.lng]}
          radius={9}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#087f8c', fillOpacity: 1 }}
        >
          <Popup>Your search location</Popup>
        </CircleMarker>
      )}
      {results.map((atm) => (
        <CircleMarker
          key={atm.id}
          ref={(marker) => {
            if (marker) {
              markerRefs.current.set(atm.id, marker);
            } else {
              markerRefs.current.delete(atm.id);
            }
          }}
          center={[atm.latitude, atm.longitude]}
          radius={selectedAtmId === atm.id ? 10 : 7}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: selectedAtmId === atm.id ? '#d15a37' : '#c3422b',
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>{atm.name}</strong>
            <br />
            {atm.bank}
            <br />
            {atm.address}
            <br />
            Coordinates: {Number(atm.latitude).toFixed(5)}, {Number(atm.longitude).toFixed(5)}
            <br />
            {Number(atm.distance_km).toFixed(2)} km away
            <br />
            Verified: {formatVerifiedDate(atm.verified_at)}
          </Popup>
        </CircleMarker>
      ))}
      <MapController
        coords={coords}
        selectedAtmId={selectedAtmId}
        markerRefs={markerRefs}
      />
    </MapContainer>
  );
}
