import { useState, useRef, useEffect } from 'react';
import RouteMap from '../components/RouteMap';
import api from '../services/api';

export default function DriversPage() {
	const [isFullScreen, setIsFullScreen] = useState(false);
	const mapRef = useRef();
	const [code, setCode] = useState('');
	const [destination, setDestination] = useState(null);
	const [driverLat, setDriverLat] = useState(null);
	const [driverLng, setDriverLng] = useState(null);
	const [driverLocationError, setDriverLocationError] = useState(null);
	const [searchError, setSearchError] = useState(null);
	const [route, setRoute] = useState([]);
	const [routeInfo, setRouteInfo] = useState(null);
	const [routeError, setRouteError] = useState(null);

	// Handler for geolocation
	const detectLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					setDriverLat(pos.coords.latitude);
					setDriverLng(pos.coords.longitude);
					setDriverLocationError(null);
				},
				() => {
					setDriverLocationError('Unable to detect location');
				},
				{ enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
			);
		} else {
			setDriverLocationError('Geolocation not supported');
		}
	};

	// Auto-follow route: recenter map on driver location change
	useEffect(() => {
		if (mapRef.current && driverLat && driverLng) {
			mapRef.current.setView([driverLat, driverLng], 15, { animate: true });
		}
	}, [driverLat, driverLng, isFullScreen]);

	// Handler for PPOINNT code search
	const searchCode = async () => {
		setSearchError(null);
		setDestination(null);
		setRoute([]);
		setRouteInfo(null);
		setRouteError(null);
		try {
			const response = await api.get(`/address/${code}`);
			const data = response.data.data;
			setDestination({ lat: data.latitude, lng: data.longitude, code: data.code });
			// If driver location is available, calculate route
			if (driverLat && driverLng) {
				await calculateRoute(driverLat, driverLng, data.latitude, data.longitude);
			}
		} catch (err) {
			setSearchError('Destination not found');
		}
	};

	// Handler for route calculation using OpenRouteService
	const calculateRoute = async (startLat, startLng, endLat, endLng) => {
		setRoute([]);
		setRouteInfo(null);
		setRouteError(null);
		try {
			const response = await api.post('/route', {
				start_lat: startLat,
				start_lng: startLng,
				end_lat: endLat,
				end_lng: endLng
			});
			const data = response.data;
			setRoute(data.polyline);
			setRouteInfo({
				distance: data.distance,
				duration: data.duration,
				steps: data.steps
			});
		} catch (err) {
			setRouteError('Route calculation failed');
		}
	};

	return (
		<div className={`max-w-xl mx-auto p-2 sm:p-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-black' : ''} transition-all duration-300`} style={{ touchAction: 'manipulation' }}>
			<h1 className="text-2xl font-bold mb-4">Driver Navigation</h1>
			<div className="mb-4">
				<input
					type="text"
					value={code}
					onChange={e => setCode(e.target.value)}
					placeholder="Enter PPOINNT Code"
					className="border rounded px-3 py-2 w-full"
				/>
				<button
					className="mt-2 w-full bg-blue-600 text-white rounded px-3 py-2 font-semibold"
					onClick={searchCode}
				>
					Search Code
				</button>
				{searchError && <div className="text-red-600 mt-2">{searchError}</div>}
			</div>
			<div className="mb-4">
				<button
					className="bg-green-600 text-white rounded px-3 py-2 font-semibold w-full"
					onClick={detectLocation}
				>
					Detect My Location
				</button>
				{driverLat && driverLng && (
					<div className="mt-2 text-sm text-stone-700">Lat: {driverLat.toFixed(6)}, Lng: {driverLng.toFixed(6)}</div>
				)}
				{driverLocationError && (
					<div className="mt-2 text-sm text-red-600">{driverLocationError}</div>
				)}
			</div>
			<div className={`relative ${isFullScreen ? 'h-[80vh]' : 'h-64'} rounded overflow-hidden border shadow-lg`}>
				<RouteMap
					driverLat={driverLat}
					driverLng={driverLng}
					destination={destination}
					route={route}
					mapRef={mapRef}
					isFullScreen={isFullScreen}
				/>
				<button
					className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-2 text-xl shadow-md focus:outline-none"
					onClick={() => setIsFullScreen(f => !f)}
					aria-label={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
				>
					{isFullScreen ? '⤢' : '⤢'}
				</button>
			</div>
			{routeInfo && (
				<div className="mt-4 p-4 bg-stone-900 text-white rounded sticky bottom-0 z-10 shadow-lg dark:bg-stone-900 dark:text-white">
					  <div className="font-semibold text-lg mb-2">Distance: {(routeInfo.distance / 1000).toFixed(2)} km</div>
					  <div className="font-semibold text-lg mb-2">Estimated Time: {(routeInfo.duration / 60).toFixed(0)} min</div>
					{routeInfo.steps && routeInfo.steps.length > 0 && (
						<div className="mt-4 max-h-48 overflow-y-auto">
							<div className="font-bold mb-2 text-lg">Directions:</div>
							<ol className="list-decimal pl-5 space-y-2">
								{routeInfo.steps.map((step, idx) => (
									<li key={idx} className="text-base font-semibold">
										{step.instruction} <span className="text-xs text-stone-400">({(step.distance / 1000).toFixed(2)} km, {(step.duration / 60).toFixed(0)} min)</span>
									</li>
								))}
							</ol>
						</div>
					)}
					{/* Navigation Buttons */}
					<div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
						{/* PPOINNT Navigation deep link */}
						<a
							href={destination ? `/driver-navigation?code=${destination.code}` : '#'}
							className="rounded-2xl bg-stone-800 px-5 py-4 text-center font-bold text-white text-lg shadow-md"
						>
							Open in PPOINNT Navigation
						</a>
						{/* Google Maps deep link */}
						<a
							href={destination ? `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}` : '#'}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-2xl bg-blue-600 px-5 py-4 text-center font-bold text-white text-lg shadow-md"
						>
							Open in Google Maps
						</a>
						{/* Waze deep link */}
						<a
							href={destination ? `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes` : '#'}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-2xl bg-purple-600 px-5 py-4 text-center font-bold text-white text-lg shadow-md"
						>
							Open in Waze
						</a>
					</div>
				</div>
			)}
			{routeError && <div className="mt-2 text-red-600">{routeError}</div>}
		</div>
	);
}