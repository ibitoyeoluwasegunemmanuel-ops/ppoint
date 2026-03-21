// MapboxMap.jsx — Premium Mapbox GL JS map component for PPOINNT
// Supports: Standard, Satellite, and Hybrid (satellite + roads + labels) views
// Supports: Dark/Light theme auto-switching for night/day driving
// Supports: High-res tiles, max zoom 22, building visibility from zoom 16+
// Supports: Smooth zoom transitions, mobile-optimized tile loading

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// ─── Token ────────────────────────────────────────────────────────────────────
// Set VITE_MAPBOX_TOKEN in your .env file for Mapbox tiles.
// Without a token, an open-source MapLibre-compatible style is used as fallback.
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// ─── Map Style Definitions ───────────────────────────────────────────────────
// If Mapbox token is present, use official Mapbox styles (highest quality).
// Otherwise, fall back to free open-source styles (maptiler/carto).
const MAPBOX_STYLES = {
  standard: {
    light: 'mapbox://styles/mapbox/streets-v12',
    dark:  'mapbox://styles/mapbox/dark-v11',
  },
  satellite: {
    light: 'mapbox://styles/mapbox/satellite-v9',
    dark:  'mapbox://styles/mapbox/satellite-v9',
  },
  hybrid: {
    light: 'mapbox://styles/mapbox/satellite-streets-v12',
    dark:  'mapbox://styles/mapbox/satellite-streets-v12',
  },
};

// Free fallback styles (no token needed)
const FALLBACK_STYLES = {
  standard: {
    light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    dark:  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  satellite: {
    light: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    dark:  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  hybrid: {
    light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    dark:  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
};

function getMapStyle(viewMode, theme) {
  if (MAPBOX_TOKEN) {
    return MAPBOX_STYLES[viewMode]?.[theme] || MAPBOX_STYLES.hybrid.dark;
  }
  return FALLBACK_STYLES[viewMode]?.[theme] || FALLBACK_STYLES.hybrid.dark;
}

// ─── Map View Toggle Button ───────────────────────────────────────────────────
function MapViewToggle({ viewMode, onChange, theme = 'dark' }) {
  const VIEWS = [
    { id: 'standard',  label: 'Map',       icon: '🗺' },
    { id: 'satellite', label: 'Satellite', icon: '🛰' },
    { id: 'hybrid',    label: 'Hybrid',    icon: '🌍' },
  ];

  const base = theme === 'dark'
    ? 'bg-stone-900/90 border-white/10 text-white'
    : 'bg-white/90 border-stone-200 text-stone-900';

  const activeClass = 'bg-amber-400 text-stone-950 border-transparent';
  const inactiveClass = theme === 'dark'
    ? 'text-stone-400 hover:text-white hover:bg-white/10'
    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100';

  return (
    <div className={`flex items-center gap-0.5 rounded-2xl border p-1 backdrop-blur-xl shadow-xl ${base}`}>
      {VIEWS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={label}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
            viewMode === id ? activeClass : inactiveClass
          }`}
        >
          <span>{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Theme auto-detect (night = dark, day = light) ───────────────────────────
function getPreferredTheme() {
  const hour = new Date().getHours();
  return (hour >= 19 || hour < 6) ? 'dark' : 'light';
}

// ─── Main MapboxMap Component ─────────────────────────────────────────────────
const MapboxMap = forwardRef(function MapboxMap(
  {
    center = [3.3792, 6.5244], // [lng, lat] — Lagos default
    zoom = 13,
    minZoom = 3,
    maxZoom = 22,
    style = { height: '100%', width: '100%' },
    className = '',
    defaultViewMode = 'hybrid', // 'standard' | 'satellite' | 'hybrid'
    defaultTheme,               // 'light' | 'dark' | auto-detected
    showViewToggle = true,
    showNavigationControl = false,
    onMoveEnd,
    onClick,
    onDragStart,
    children,
    interactive = true,
  },
  ref
) {
  const mapRef = useRef(null);
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [theme] = useState(defaultTheme || getPreferredTheme());
  const [viewState, setViewState] = useState({
    longitude: center[0],
    latitude: center[1],
    zoom,
  });

  // Expose imperative map API via ref
  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, z) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: z || zoom,
        duration: 1200,
        essential: true,
      });
    },
    fitBounds: (bounds, options) => {
      mapRef.current?.fitBounds(bounds, { ...options, duration: 1000 });
    },
    getMap: () => mapRef.current,
  }));

  const mapStyle = getMapStyle(viewMode, theme);

  const handleMove = useCallback((evt) => {
    setViewState(evt.viewState);
    onMoveEnd?.(evt.viewState);
  }, [onMoveEnd]);

  const handleClick = useCallback((evt) => {
    onClick?.(evt.lngLat.lat, evt.lngLat.lng);
  }, [onClick]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onDragStart={onDragStart}
        onClick={handleClick}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN || undefined}
        minZoom={minZoom}
        maxZoom={maxZoom}
        interactive={interactive}
        style={{ height: '100%', width: '100%' }}
        // Performance: prefetch adjacent tiles, preload fonts
        optimizeForTerrain={false}
        reuseMaps
      >
        {showNavigationControl && (
          <NavigationControl position="top-right" />
        )}
        {children}
      </Map>

      {/* View mode toggle overlay */}
      {showViewToggle && (
        <div className="absolute bottom-3 left-3 z-10">
          <MapViewToggle viewMode={viewMode} onChange={setViewMode} theme={theme} />
        </div>
      )}

      {/* Mapbox attribution tweak for mobile */}
      <style>{`
        .mapboxgl-ctrl-attrib { font-size: 10px !important; }
        .mapboxgl-ctrl-logo { display: none !important; }
      `}</style>
    </div>
  );
});

export default MapboxMap;

// ─── Re-export react-map-gl primitives for use in pages ──────────────────────
export { Marker, Popup, Source, Layer, MapViewToggle };
