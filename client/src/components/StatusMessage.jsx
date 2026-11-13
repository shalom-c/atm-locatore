export default function StatusMessage({
  loading,
  error,
  count,
  radius,
  hasCoordinates,
}) {
  let message = 'Use your location or enter coordinates to find nearby ATMs.';

  if (loading) {
    message = 'Finding nearby ATMs…';
  } else if (error) {
    message = error;
  } else if (hasCoordinates && count > 0) {
    message = `Found ${count} ${count === 1 ? 'ATM' : 'ATMs'} within ${radius} km.`;
  } else if (hasCoordinates) {
    message = `No ATMs found within ${radius} km. Try a larger radius or a different search.`;
  }

  return (
    <p className={`status-message${error ? ' status-error' : ''}`} role="status" aria-live="polite">
      {message}
    </p>
  );
}
