import AtmCard from './AtmCard.jsx';

export default function AtmList({ results, selectedAtmId, onSelect, loading }) {
  const sortedResults = [...results].sort(
    (first, second) => Number(first.distance_km) - Number(second.distance_km),
  );

  return (
    <section className="results-panel" aria-labelledby="results-heading">
      <div className="results-heading">
        <div>
          <p className="eyebrow">Nearby</p>
          <h2 id="results-heading">ATMs</h2>
        </div>
        <span className="result-count">{results.length}</span>
      </div>

      {sortedResults.length > 0 ? (
        <ul className="atm-list">
          {sortedResults.map((atm) => (
            <li key={atm.id}>
              <AtmCard
                atm={atm}
                selected={selectedAtmId === atm.id}
                onSelect={() => onSelect(atm.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="list-empty">
          {loading ? 'Loading nearby ATMs…' : 'No ATMs to show yet.'}
        </p>
      )}
    </section>
  );
}
