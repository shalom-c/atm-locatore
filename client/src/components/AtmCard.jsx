function formatVerifiedDate(value) {
  if (!value) {
    return 'Not provided';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export default function AtmCard({ atm, selected, onSelect }) {
  return (
    <button
      className={`atm-card${selected ? ' atm-card-selected' : ''}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="atm-card-topline">
        <span className="atm-bank">{atm.bank}</span>
        <span className="atm-distance">{Number(atm.distance_km).toFixed(2)} km</span>
      </span>
      <span className="atm-name">{atm.name}</span>
      <span className="atm-address">{atm.address}</span>
      <span className="atm-coordinates">
        {Number(atm.latitude).toFixed(5)}, {Number(atm.longitude).toFixed(5)}
      </span>
      <span className="atm-verified">Verified {formatVerifiedDate(atm.verified_at)}</span>
    </button>
  );
}
