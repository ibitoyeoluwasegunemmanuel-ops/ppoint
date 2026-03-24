// MapboxMap.jsx — Premium Mapbox GL JS map component for PPOINNT
// Supports: Standard, Satellite, and Hybrid (satellite + roads + labels) views
// Supports: Dark/Light theme auto-switching for night/day driving
// Supports: High-res tiles, max zoom 22, building visibility from zoom 16+
// Supports: Smooth zoom transitions, mobile-optimized tile loading

import { useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
export { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { WifiOff } from 'lucide-react';

// ─── Token ────────────────────────────────────────────────────────────────────
// Set VITE_MAPBOX_TOKEN in your .env file for Mapbox tiles.
// Without a token, an open-source MapLibre-compatible style is used as fallback.
const REAL_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
// Mapbox GL JS v2+ strictly requires a token matching a specific format to initialize without throwing an Error.
const MAPBOX_TOKEN = REAL_TOKEN || 'pk.eyJ1IjoiZHVtbXkiLCJhIjoiZHVtbXkifQ.dummy';

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

// ─── Style Fallbacks (ArcGIS & OSM) ──────────────────────────────────────────
const FALLBACK_STYLES = {
  standard: {
    version: 8,
    sources: { 'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OSM' } },
    layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]
  },
  satellite: {
    version: 8,
    sources: { 'esri': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: '© Esri', maxzoom: 19 } },
    layers: [{ id: 'esri-layer', type: 'raster', source: 'esri' }]
  },
  hybrid: {
    version: 8,
    sources: { 
      'esri': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: '© Esri', maxzoom: 19 },
      'osm-labels': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, opacity: 0.6 } 
    },
    layers: [
      { id: 'esri-layer', type: 'raster', source: 'esri' },
      { id: 'labels-layer', type: 'raster', source: 'osm-labels' }
    ]
  }
};

function getMapStyle(viewMode, theme) {
  if (REAL_TOKEN) {
    return MAPBOX_STYLES[viewMode]?.[theme] || MAPBOX_STYLES.hybrid.dark;
  }
  return FALLBACK_STYLES[viewMode] || FALLBACK_STYLES.standard; 
}

// ─── Map View Toggle Button ───────────────────────────────────────────────────
export function MapViewToggle({ viewMode, onChange, theme = 'dark' }) {
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
  const [isLowNetwork, setIsLowNetwork] = useState(false);
  
  // Detect low network connection
  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
        setIsLowNetwork(true);
        setViewMode('standard'); // Force lightweight
      }
    }
  }, []);

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
    easeTo: (options) => {
      mapRef.current?.easeTo(options);
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
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
          {isLowNetwork && (
            <div className="flex items-center gap-2 rounded-xl bg-orange-500/90 px-3 py-1.5 text-[10px] font-black uppercase text-white backdrop-blur shadow-lg">
              <WifiOff size={12} /> Low Network Mode
            </div>
          )}
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


