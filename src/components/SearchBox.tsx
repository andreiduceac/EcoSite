import { useLanguage } from "../i18n/LanguageProvider";
import { useState } from 'react';
import { Search, LoaderCircle, MapPin } from 'lucide-react';
import { searchPlaces } from '../services/geocoding';
import type { SearchPlace } from '../services/geocoding';
import type { Coordinate } from '../types';
export function SearchBox({
  onSelect,
  disabled = false
}: {
  onSelect: (c: Coordinate) => void;
  disabled?: boolean;
}) {
  const {
    tr
  } = useLanguage();
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<SearchPlace[] | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const search = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setPlaces(null);
    const r = await searchPlaces(query);
    if (r.ok) setPlaces(r.data);else setError(r.error.message);
    setLoading(false);
  };
  return <div className="search-container"><form className="search-box" onSubmit={e => {
      e.preventDefault();
      void search();
    }}><Search size={16} /><input aria-label={tr("Search location")} placeholder={tr("Search a city, address, or lat, lon")} value={query} disabled={disabled} onChange={e => setQuery(e.target.value)} /><button type="submit" disabled={loading || disabled || !query.trim()} aria-label={tr("Submit location search")}>{loading ? <LoaderCircle size={15} className="spin" /> : <span>{tr("Search")}</span>}</button></form>{error && <div className="search-results" role="alert">{tr(error)}</div>}{places && <div className="search-results">{!places.length ? <p>{tr("No places found. Try a nearby city or coordinates.")}</p> : places.map((p, i) => <button key={i} onClick={() => {
        onSelect({
          lat: p.lat,
          lon: p.lon
        });
        setQuery(p.name.split(',').slice(0, 2).join(','));
        setPlaces(null);
      }}><MapPin size={15} /><span>{tr(p.name)}</span></button>)}<small>{tr("Search © OpenStreetMap contributors · Nominatim")}</small></div>}</div>;
}
