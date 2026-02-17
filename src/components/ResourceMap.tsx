import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Heatmap Layer Component
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!(L as any).heatLayer || !map || points.length === 0) return;
    
    // Ensure map is fully loaded and container has dimensions
    const container = map.getContainer();
    
    const initHeatLayer = () => {
      if (container.clientHeight > 0 && container.clientWidth > 0) {
        map.invalidateSize();
        // Increased intensity and radius for better visibility
        const heat = (L as any).heatLayer(points, {
          radius: 35,
          blur: 20,
          maxZoom: 10,
          max: 1.0,
          gradient: {
            0.2: '#3b82f6', // Blue (Low)
            0.4: '#10b981', // Emerald (Medium)
            0.6: '#fbbf24', // Yellow (High)
            0.8: '#f97316', // Orange (Critical)
            1.0: '#ef4444'  // Red (Danger)
          }
        }).addTo(map);
        return heat;
      }
      return null;
    };

    let heatInstance: any = initHeatLayer();

    if (!heatInstance) {
      const resizeObserver = new ResizeObserver(() => {
        if (container.clientHeight > 0 && container.clientWidth > 0) {
          heatInstance = initHeatLayer();
          if (heatInstance) resizeObserver.disconnect();
        }
      });
      resizeObserver.observe(container);
      return () => {
        resizeObserver.disconnect();
        if (heatInstance) map.removeLayer(heatInstance);
      };
    }

    return () => {
      if (map && heatInstance) {
        map.removeLayer(heatInstance);
      }
    };
  }, [map, points]);

  return null;
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
  isHeatmap?: boolean;
}

function LocationMarker({ onLocationSelect, initialLocation }: { onLocationSelect: (lat: number, lng: number) => void, initialLocation?: [number, number] }) {
  const [position, setPosition] = useState<[number, number]>(initialLocation || [19.0760, 72.8777]);
  
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
  const heatPoints = useMemo(() => {
    return incidents.map(inc => [
      inc.location_lat || 19.0760,
      inc.location_lng || 72.8777,
      inc.urgency === 'critical' ? 1.0 : 0.5
    ] as [number, number, number]);
  }, [incidents]);

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border-2 border-slate-100 relative z-0">
      <MapContainer
        center={initialLocation || [19.0760, 72.8777]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {isHeatmap && <HeatLayer points={heatPoints} />}

        {onLocationSelect && (
          <LocationMarker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
        )}

        {/* Render Resources as Markers */}
        {!isHeatmap && resources.map((res: any) => (
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

        {/* Render Incidents as Heatmap Circles */}
        {incidents.map((inc: any) => (
          <CircleMarker
            key={inc.id}
            center={[inc.location_lat || 19.0760, inc.location_lng || 72.8777]}
            radius={isHeatmap ? 30 : 15}
            pathOptions={{
              fillColor: inc.urgency === 'critical' ? '#ef4444' : '#f97316',
              color: inc.urgency === 'critical' ? '#ef4444' : '#f97316',
              weight: 2,
              opacity: 0.8,
              fillOpacity: isHeatmap ? 0.3 : 0.6
            }}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold text-red-600 uppercase text-[10px] tracking-widest">{inc.type}</p>
                <p className="text-xs font-medium text-slate-600 italic">"{inc.description}"</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {onLocationSelect && (
        <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
          <MapPin className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Click or Drag to set location</span>
        </div>
      )}
    </div>
  );
}
