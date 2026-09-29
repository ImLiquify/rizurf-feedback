import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchEmployees } from '../api';
import type { Employee } from '../types';
import { Avatar } from './Avatar';
import { IconSearch } from './icons';

// Top-bar peek: type a name, see who matches and their rating, jump to them.
export function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchEmployees(query)
        .then((r) => {
          if (!cancelled) {
            setResults(r.slice(0, 6));
            setActive(0);
          }
        })
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function go(e: Employee) {
    navigate(`/employees/${e.id}`);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return setOpen(false);
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      go(results[active]);
    }
  }

  const showPanel = open && query.trim() !== '';

  return (
    <div className="quick-search" ref={wrapRef}>
      <IconSearch width={16} height={16} />
      <input
        type="search"
        placeholder="Quick find a coworker"
        aria-label="Quick find a coworker"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="quick-search-results"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showPanel && (
        <ul className="quick-search-panel" id="quick-search-results" role="listbox">
          {results.length === 0 && <li className="quick-search-empty">No one matches “{query}”.</li>}
          {results.map((e, i) => (
            <li key={e.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={'quick-search-row' + (i === active ? ' active' : '')}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(e)}
              >
                <Avatar name={e.name} photoUrl={e.photoUrl} size={30} />
                <span className="quick-search-name">
                  {e.name}
                  <span className="muted small">{e.role}</span>
                </span>
                <span className="quick-search-rating">
                  {e.avgRating != null ? (
                    <>
                      <span className="stars">★</span> {e.avgRating.toFixed(1)}
                      <span className="muted small"> ({e.reviewCount})</span>
                    </>
                  ) : (
                    <span className="muted small">No reviews</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
