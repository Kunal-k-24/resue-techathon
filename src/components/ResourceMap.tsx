import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';

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
  isHeatmap?: boolean;
}

function LocationMarker({ onLocationSelect, initialLocation }: { onLocationSelect: (lat: number, lng: number) => void, initialLocation?: [number, number] }) {
  const [position, setPosition] = useState<[number, number]>(initialLocation || [19.0760, 72.8777]);
  const map = useMap();

  useEffect(() => {
    if (!initialLocation) {
      map.locate({ setView: false }).on("locationfound", (e: L.LocationEvent) => {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        map.flyTo(e.latlng, map.getZoom());
        if (onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      });
    } else {
      setPosition(initialLocation);
      map.flyTo(initialLocation, map.getZoom());
    }
  }, [map, initialLocation]);
  
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

export default function ResourceMap({ 
  onLocationSelect, 
  initialLocation,
  resources = [],
  incidents = [],
  isHeatmap = false
}: ResourceMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.warn("Geolocation denied, defaulting to Mumbai");
          setUserLocation([19.0760, 72.8777]);
        }
      );
    }
  }, []);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border-2 border-slate-100 relative z-0 bg-slate-100">
      {!mapReady && (
        <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-slate-900/10 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}
      <MapContainer
        key={userLocation ? `${userLocation[0]}-${userLocation[1]}` : 'default'}
        center={initialLocation || userLocation || [19.0760, 72.8777]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {mapReady && onLocationSelect && (
          <LocationMarker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
        )}

        {/* Render Resources as Markers */}
        {mapReady && !isHeatmap && resources.map((res: any) => (
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
            radius={isHeatmap ? 8 : 12}
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
      </MapContainer>
      
      {mapReady && onLocationSelect && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Click or Drag to set location</span>
        </div>
      )}
    </div>
  );
}
