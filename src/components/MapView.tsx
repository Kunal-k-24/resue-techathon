import { useState, useEffect } from 'react';
import { Flame, Droplets, Home, Cross, AlertCircle, Filter, MapPin, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { MapMarker, MarkerType } from '../types';

// Standard Leaflet Icon fix for React
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

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const center: [number, number] = [19.0760, 72.8777];

// Optimized circular icon generator using SVG strings
const createCustomIcon = (type: MarkerType | 'user') => {
  let color = '#ef4444';
  switch (type) {
    case 'fire': color = '#ef4444'; break;
    case 'flood': color = '#3b82f6'; break;
    case 'shelter': color = '#10b981'; break;
    case 'hospital': color = '#06b6d4'; break;
    case 'sos': color = '#f97316'; break;
    case 'user': color = '#1d4ed8'; break;
  }

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg style="margin: auto;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}


export default function MapView({ onNavigate }: MapViewProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [filterType, setFilterType] = useState<MarkerType | 'all'>('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  const fetchMarkers = async () => {
    try {
      const { data: incidents } = await supabase.from('incidents').select('*');
      const { data: shelters } = await supabase.from('shelters').select('*');

      const mapMarkers: MapMarker[] = [
        ...(incidents || []).map(i => ({
          id: i.id,
          type: i.type as MarkerType,
          name: i.type.toUpperCase() + ' Incident',
          location: i.location_name,
          description: i.description,
          coordinates: { lat: i.location_lat || 19.0760, lng: i.location_lng || 72.8777 }
        })),
        ...(shelters || []).map(s => ({
          id: s.id,
          type: 'shelter' as MarkerType,
          name: s.name,
          location: s.address,
          description: `Capacity: ${s.capacity}, Available: ${s.available}`,
          capacity: s.capacity,
          coordinates: { lat: s.location_lat || 19.0800, lng: s.location_lng || 72.8800 }
        }))
      ];
      setMarkers(mapMarkers);
    } catch (error) {
      console.error('Error fetching map markers:', error);
    }
  };

  useEffect(() => {
    fetchMarkers();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true }
      );
    }

    const subscription = supabase
      .channel('map-markers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchMarkers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, () => fetchMarkers())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredMarkers = filterType === 'all'
    ? markers
    : markers.filter(m => m.type === filterType);

  const filterOptions: { value: MarkerType | 'all'; label: string; icon: any }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'fire', label: 'Fires', icon: Flame },
    { value: 'flood', label: 'Floods', icon: Droplets },
    { value: 'shelter', label: 'Shelters', icon: Home },
    { value: 'hospital', label: 'Hospitals', icon: Cross },
    { value: 'sos', label: 'SOS', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Live Mission Map</h1>
            <p className="text-slate-500 font-medium text-sm">Open-source situational awareness and resource tracking.</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-900 tracking-wider uppercase">Live OSM Sync</span>
          </div>
        </div>

        <div className="sticky top-20 z-[400] bg-slate-50/80 backdrop-blur-md py-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                  filterType === option.value
                    ? 'bg-red-600 text-white shadow-xl shadow-red-200 scale-105'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border-4 border-white overflow-hidden h-[500px] md:h-[700px] z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ChangeView center={mapCenter} />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {userLocation && (
              <Marker position={userLocation} icon={createCustomIcon('user')}>
                <Popup>
                  <div style={{ padding: '4px', minWidth: '100px' }}>
                    <p style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Your Location</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Current Position</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {filteredMarkers.map((marker) => (
              <Marker key={marker.id} position={[marker.coordinates.lat, marker.coordinates.lng]} icon={createCustomIcon(marker.type)}>
                <Popup>
                  <div style={{ padding: '4px', minWidth: '200px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '8px', 
                        fontSize: '10px', 
                        fontWeight: 900, 
                        textTransform: 'uppercase',
                        backgroundColor: marker.type === 'fire' ? '#fee2e2' : marker.type === 'flood' ? '#dbeafe' : '#d1fae5',
                        color: marker.type === 'fire' ? '#dc2626' : marker.type === 'flood' ? '#2563eb' : '#059669'
                      }}>
                        {marker.type}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontWeight: 900, color: '#0f172a' }}>{marker.name}</h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>{marker.description}</p>
                    
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>
                      <MapPin size={12} /> {marker.location}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${marker.coordinates.lat},${marker.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          flex: 1, 
                          backgroundColor: '#0f172a', 
                          color: 'white', 
                          fontSize: '10px', 
                          fontWeight: 900, 
                          padding: '8px', 
                          borderRadius: '8px', 
                          textAlign: 'center', 
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <ExternalLink size={12} /> DIRECTIONS
                      </a>
                      {marker.type === 'sos' && (
                        <button
                          onClick={() => onNavigate('sos-detail', marker)}
                          style={{ 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626', 
                            fontSize: '10px', 
                            fontWeight: 900, 
                            padding: '0 12px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            cursor: 'pointer' 
                          }}
                        >
                          HELP
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute bottom-8 left-8 right-8 flex justify-center z-[1000] pointer-events-none">
             <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 flex flex-wrap justify-center items-center gap-6">
                {[
                  { color: 'bg-red-500', label: 'Fire' },
                  { color: 'bg-blue-500', label: 'Flood' },
                  { color: 'bg-emerald-500', label: 'Shelter' },
                  { color: 'bg-orange-500', label: 'SOS' },
                  { color: 'bg-blue-700', label: 'You' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

