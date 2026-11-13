import { useCallback, useState } from 'react';

export default function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setCoords(null);
      setError('Location is not supported by this browser.');
      setStatus('unsupported');
      return;
    }

    setError('');
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('ready');
      },
      (geolocationError) => {
        setCoords(null);
        if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
          setStatus('denied');
          setError('Location permission was denied.');
        } else if (geolocationError.code === geolocationError.TIMEOUT) {
          setStatus('timeout');
          setError('Getting your location took too long.');
        } else {
          setStatus('unavailable');
          setError('Your location is currently unavailable.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { coords, status, error, request };
}
