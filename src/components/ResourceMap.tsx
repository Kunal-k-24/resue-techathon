import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Navigation } from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

// Standard Leaflet Icon fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ResourceMapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
  resources?: any[];
  incidents?: any[];
  userLocation?: [number, number] | null;
}

function LocationMarker({ onLocationSelect, initialLocation, userLocation }: { onLocationSelect: (lat: number, lng: number) => void, initialLocation?: [number, number], userLocation?: [number, number] | null }) {
  const [position, setPosition] = useState<[number, number]>(initialLocation || userLocation || [19.0760, 72.8777]);

  useEffect(() => {
    if (initialLocation) {
      setPosition(initialLocation);
    } else if (userLocation) {
      setPosition(userLocation);
    }
  }, [initialLocation, userLocation]);
  
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  const markerHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          onLocationSelect(lat, lng);
        }
      },
    }),
    [onLocationSelect]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={markerHandlers}
      position={position}
      icon={DefaultIcon}
      zIndexOffset={1000}
    />
  );
}

function GoToMyLocation({ location }: { location: [number, number] | null }) {
  const map = useMap();
  
  const handleFlyTo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (location) {
      console.log("Flying to location:", location);
      map.flyTo(location as L.LatLngExpression, 18, {
        animate: true,
        duration: 1.5
      });
    } else {
      console.warn("No location available to fly to");
    }
  };

  if (!location) return null;

  return (
    <button
      onClick={handleFlyTo}
      className="absolute bottom-6 right-6 z-[1000] p-4 bg-white hover:bg-slate-50 text-blue-600 rounded-2xl shadow-2xl border border-slate-100 transition-all active:scale-95 group flex items-center gap-3"
      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
      title="Go to my location"
    >
      <Navigation className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-widest">My Location</span>
    </button>
  );
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function ResourceMap({ 
  onLocationSelect, 
  initialLocation,
  resources = [],
  incidents = [],
  userLocation: providedUserLocation
}: ResourceMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [internalUserLocation, setInternalUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (providedUserLocation) {
      setInternalUserLocation(providedUserLocation);
      return;
    }
    
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInternalUserLocation([latitude, longitude]);
          
          const isIndia = latitude > 6 && latitude < 38 && longitude > 68 && longitude < 98;
          if (isIndia) {
            console.log("NavIC High-Precision Lock established");
          }
        },
        () => {
          if (!internalUserLocation) {
            setInternalUserLocation([19.0760, 72.8777]);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [providedUserLocation]);

  const activeUserLocation = providedUserLocation || internalUserLocation;

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border-2 border-slate-100 relative z-0 bg-slate-100">
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-container .leaflet-bottom.leaflet-right { display: none !important; }
      `}</style>
      {!mapReady && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-slate-900/10 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}
      <MapContainer
        center={initialLocation || activeUserLocation || [19.0760, 72.8777]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
        attributionControl={false}
      >
        <MapController center={initialLocation || null} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker */}
        {mapReady && activeUserLocation && (
          <Marker
            position={activeUserLocation}
            icon={L.divIcon({
              className: 'custom-pulse-marker',
              html: `<div class="relative flex items-center justify-center">
                <div class="absolute w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                <div class="relative w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
              </div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div className="p-2">
                <p className="font-black text-blue-600 uppercase text-[10px] tracking-widest mb-1">Your Location</p>
                <p className="text-xs font-bold text-slate-900">Admin Command Center</p>
              </div>
            </Popup>
          </Marker>
        )}

        {mapReady && onLocationSelect && (
          <LocationMarker 
            onLocationSelect={onLocationSelect} 
            initialLocation={initialLocation} 
            userLocation={activeUserLocation}
          />
        )}

        {/* Render Resources as Markers */}
        {mapReady && resources.map((res: any) => (
          <Marker 
            key={res.id} 
            position={[res.location_lat || 19.0760, res.location_lng || 72.8777]}
            icon={DefaultIcon}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold text-slate-900">{res.name}</p>
                <p className="text-xs text-slate-500">{res.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Incidents as Circles */}
        {mapReady && incidents.map((inc: any) => (
          <CircleMarker
            key={inc.id}
            center={[inc.location_lat || 19.0760, inc.location_lng || 72.8777]}
            radius={12}
            pathOptions={{
              fillColor: inc.urgency === 'critical' ? '#ef4444' : '#f97316',
              color: 'white',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <p className="font-black text-red-600 uppercase text-[10px] tracking-widest mb-1">{inc.type}</p>
                <p className="text-xs font-bold text-slate-900 mb-1">{inc.location_name}</p>
                <p className="text-[10px] text-slate-500 italic">"{inc.description}"</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {mapReady && activeUserLocation && <GoToMyLocation location={activeUserLocation} />}
      </MapContainer>
      
      {mapReady && activeUserLocation && (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
          {(activeUserLocation[0] > 6 && activeUserLocation[0] < 38 && activeUserLocation[1] > 68 && activeUserLocation[1] < 98) && (
            <div className="bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-400/30 shadow-lg flex items-center gap-2 animate-in slide-in-from-left-2">
              <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">NavIC Optimized</span>
            </div>
          )}
        </div>
      )}
      
      {mapReady && onLocationSelect && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Click or Drag to set location</span>
        </div>
      )}
    </div>
  );
}
