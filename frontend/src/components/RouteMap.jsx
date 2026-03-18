// RouteMap.jsx
import { Polyline, MapContainer, Marker, TileLayer, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';

function AutoCenter({ driverLat, driverLng, mapRef, isFullScreen }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
    if (driverLat && driverLng) {
      map.setView([driverLat, driverLng], isFullScreen ? 16 : 15, { animate: true });
    }
  }, [driverLat, driverLng, isFullScreen]);
  return null;
}

export default function RouteMap({ driverLat, driverLng, destination, route, mapRef, isFullScreen }) {
  const center = driverLat && driverLng ? [driverLat, driverLng] : [6.5, 3.3];
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} whenCreated={map => { if (mapRef) mapRef.current = map; }}>
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark:invert"
      />
      <AutoCenter driverLat={driverLat} driverLng={driverLng} mapRef={mapRef} isFullScreen={isFullScreen} />
      {driverLat && driverLng && (
        <Marker position={[driverLat, driverLng]}>
          <Popup>Start</Popup>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>Destination</Popup>
        </Marker>
      )}
      {route && route.length > 0 && <Polyline positions={route} color="#2563eb" weight={6} />} 
    </MapContainer>
  );
}
