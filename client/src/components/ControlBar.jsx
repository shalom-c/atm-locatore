export default function ControlBar({
  locationStatus,
  onLocate,
  radius,
  onRadiusChange,
  query,
  onQueryChange,
}) {
  function handleSearch(event) {
    event.preventDefault();
  }

  return (
    <section className="control-bar" aria-label="Search controls">
      <button
        className="button button-primary locate-button"
        type="button"
        onClick={onLocate}
        disabled={locationStatus === 'locating'}
      >
        {locationStatus === 'locating' ? 'Locating…' : 'Use my location'}
      </button>

      <label className="radius-control">
        <span>Search radius</span>
        <select
          value={radius}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
        >
          {[1, 2, 5, 10, 20].map((distance) => (
            <option key={distance} value={distance}>
              {distance} km
            </option>
          ))}
        </select>
      </label>

      <form className="search-form" onSubmit={handleSearch} role="search">
        <label className="sr-only" htmlFor="atm-search">Search ATMs</label>
        <input
          id="atm-search"
          type="search"
          placeholder="Search bank, ATM or address"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button className="button button-search" type="submit" aria-label="Search ATMs">
          Search
        </button>
      </form>
    </section>
  );
}
