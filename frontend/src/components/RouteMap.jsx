// RouteMap.jsx — Mapbox-powered route map with satellite/hybrid support
import { useRef, useEffect } from 'react';
import MapboxMap, { Marker, Source, Layer } from './MapboxMap';

function DriverPin() {
  return (
    <div style={{
      width: 28, height: 28, background: '#3b82f6', border: '3px solid white',
      borderRadius: '50%', boxShadow: '0 0 0 4px rgba(59,130,246,0.3),0 0 12px rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L8 10H16L12 2Z"/>
        <circle cx="12" cy="16" r="4"/>
      </svg>
    </div>
  );
}

function DestPin() {
  return <div style={{ fontSize: 28, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>📍</div>;
}

export default function RouteMap({ driverLat, driverLng, destination, route, mapRef, isFullScreen }) {
  const internalRef = useRef(null);
  const ref = mapRef || internalRef;

  // Auto-center via imperative flyTo
  useEffect(() => {
    if (!ref.current) return;
    if (driverLat && driverLng) {
      ref.current.flyTo(driverLng, driverLat, isFullScreen ? 16 : 15);
    }
  }, [driverLat, driverLng, isFullScreen]);

  const center = driverLat && driverLng ? [driverLng, driverLat] : [3.3792, 6.5244];

  const routeGeojson = route && route.length > 1 ? {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: route.map(([lat, lng]) => [lng, lat]),
    },
  } : null;

  return (
    <MapboxMap
      ref={ref}
      center={center}
      zoom={13}
      defaultViewMode="hybrid"
      defaultTheme="dark"
      showViewToggle
      style={{ height: '100%', width: '100%' }}
    >
      {routeGeojson && (
        <Source id="route-rm" type="geojson" data={routeGeojson}>
          <Layer id="route-rm-casing" type="line"
            paint={{ 'line-color': '#000', 'line-width': 10, 'line-opacity': 0.25 }}
            layout={{ 'line-join': 'round', 'line-cap': 'round' }} />
          <Layer id="route-rm-line" type="line"
            paint={{ 'line-color': '#2563eb', 'line-width': 6, 'line-opacity': 0.9 }}
            layout={{ 'line-join': 'round', 'line-cap': 'round' }} />
        </Source>
      )}
      {driverLat && driverLng && (
        <Marker longitude={driverLng} latitude={driverLat} anchor="center">
          <DriverPin />
        </Marker>
      )}
      {destination && (
        <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
          <DestPin />
        </Marker>
      )}
    </MapboxMap>
  );
}
