import { useState, useEffect } from 'react';
import { Flame, Droplets, Home, Cross, AlertCircle, X, Navigation, Filter, MapPin, Compass, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MapMarker, MarkerType } from '../types';

interface MapViewProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function MapView({ onNavigate }: MapViewProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [filterType, setFilterType] = useState<MarkerType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarkers();

    const subscription = supabase
      .channel('map-markers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => fetchMarkers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, () => fetchMarkers())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
          coordinates: { lat: i.location_lat || 40.7128, lng: i.location_lng || -74.0060 }
        })),
        ...(shelters || []).map(s => ({
          id: s.id,
          type: 'shelter' as MarkerType,
          name: s.name,
          location: s.address,
          description: `Capacity: ${s.capacity}, Available: ${s.available}`,
          capacity: s.capacity,
          coordinates: { lat: s.location_lat || 40.7300, lng: s.location_lng || -73.9352 }
        }))
      ];

      setMarkers(mapMarkers);
    } catch (error) {
      console.error('Error fetching map markers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (type: MarkerType) => {
    switch (type) {
      case 'fire': return <Flame className="w-5 h-5" />;
      case 'flood': return <Droplets className="w-5 h-5" />;
      case 'shelter': return <Home className="w-5 h-5" />;
      case 'hospital': return <Cross className="w-5 h-5" />;
      case 'sos': return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getMarkerColor = (type: MarkerType) => {
    switch (type) {
      case 'fire': return 'bg-red-500 text-white ring-4 ring-red-500/20 animate-pulse';
      case 'flood': return 'bg-blue-500 text-white ring-4 ring-blue-500/20';
      case 'shelter': return 'bg-emerald-500 text-white ring-4 ring-emerald-500/20';
      case 'hospital': return 'bg-teal-500 text-white ring-4 ring-teal-500/20';
      case 'sos': return 'bg-orange-500 text-white ring-4 ring-orange-500/20 animate-pulse';
    }
  };

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
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Live Map</h1>
          <p className="text-slate-500 font-medium">Real-time situational awareness and resource tracking.</p>
        </div>

        {/* Filters Sticky Bar */}
        <div className="sticky top-20 z-30 bg-slate-50/80 backdrop-blur-md py-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterType(option.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                  filterType === option.value
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Map Area */}
        <div className="relative bg-white rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-200 overflow-hidden h-[500px] md:h-[700px]">
          {/* Mock Map Background with Grid */}
          <div className="absolute inset-0 bg-slate-100">
             <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
             {/* Simulated roads/areas */}
             <div className="absolute top-1/4 left-0 w-full h-1 bg-white/50 skew-y-1"></div>
             <div className="absolute top-0 left-1/3 h-full w-1 bg-white/50 -skew-x-1"></div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
             <button className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 text-slate-600 transition-colors">
                <Compass className="w-6 h-6" />
             </button>
             <button className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 text-slate-600 transition-colors">
                <Navigation className="w-6 h-6" />
             </button>
          </div>

          <div className="absolute top-6 right-6 z-20">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-slate-900 tracking-wider uppercase">Live Sync</span>
            </div>
          </div>

          {/* Markers */}
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-30">
              <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
            </div>
          ) : filteredMarkers.map((marker, index) => (
            <button
              key={marker.id}
              onClick={() => setSelectedMarker(marker)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-[1.5rem] shadow-2xl transition-all hover:scale-125 z-10 ${getMarkerColor(
                marker.type
              )}`}
              style={{
                left: `${25 + (index * 12) % 60}%`,
                top: `${20 + (index * 15) % 65}%`,
              }}
            >
              {getMarkerIcon(marker.type)}
            </button>
          ))}
          
          {/* Legend - Desktop Only Overlay */}
          <div className="hidden md:flex absolute bottom-8 left-8 right-8 justify-center z-20 pointer-events-none">
             <div className="bg-slate-900/90 backdrop-blur-md px-8 py-4 rounded-[2rem] shadow-2xl pointer-events-auto border border-white/10 flex items-center gap-8">
                {[
                  { color: 'bg-red-500', label: 'Active Emergency' },
                  { color: 'bg-emerald-500', label: 'Safe Shelter' },
                  { color: 'bg-teal-500', label: 'Medical Facility' },
                  { color: 'bg-orange-500', label: 'Distress Signal' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color} ${item.color.includes('red') || item.color.includes('orange') ? 'animate-pulse' : ''}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Selected Marker Detail Card (Mobile Persistent View) */}
        {selectedMarker && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4 z-[100]">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-scale-in">
              <div className="flex items-start justify-between mb-8">
                <div className={`p-4 rounded-2xl shadow-lg ${getMarkerColor(selectedMarker.type).split('animate-pulse')[0]}`}>
                  {getMarkerIcon(selectedMarker.type)}
                </div>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                {selectedMarker.name}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {selectedMarker.description}
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    <MapPin className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Location</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMarker.location}</p>
                  </div>
                </div>
                {selectedMarker.capacity !== undefined && (
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                      <Home className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Availability</p>
                      <p className="text-sm font-bold text-slate-700">{selectedMarker.capacity} Spaces Total</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                >
                  Navigate Now
                </button>
                {selectedMarker.type === 'sos' && (
                  <button
                    onClick={() => {
                      onNavigate('sos-detail', selectedMarker);
                      setSelectedMarker(null);
                    }}
                    className="px-6 bg-red-100 text-red-600 py-4 rounded-2xl font-black hover:bg-red-200 transition-all"
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

