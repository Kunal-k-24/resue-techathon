import { useState } from 'react';
import { Flame, Droplets, Home, Cross, AlertCircle, X, Navigation } from 'lucide-react';
import { mockMapMarkers } from '../data/mockData';
import { MapMarker, MarkerType } from '../types';

interface MapViewProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function MapView({ onNavigate }: MapViewProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [filterType, setFilterType] = useState<MarkerType | 'all'>('all');

  const getMarkerIcon = (type: MarkerType) => {
    switch (type) {
      case 'fire':
        return <Flame className="w-6 h-6" />;
      case 'flood':
        return <Droplets className="w-6 h-6" />;
      case 'shelter':
        return <Home className="w-6 h-6" />;
      case 'hospital':
        return <Cross className="w-6 h-6" />;
      case 'sos':
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const getMarkerColor = (type: MarkerType) => {
    switch (type) {
      case 'fire':
        return 'bg-red-500 text-white animate-pulse';
      case 'flood':
        return 'bg-blue-500 text-white';
      case 'shelter':
        return 'bg-green-500 text-white';
      case 'hospital':
        return 'bg-teal-500 text-white';
      case 'sos':
        return 'bg-orange-500 text-white animate-pulse';
    }
  };

  const filteredMarkers = filterType === 'all'
    ? mockMapMarkers
    : mockMapMarkers.filter(m => m.type === filterType);

  const filterOptions: { value: MarkerType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'fire', label: 'Fires' },
    { value: 'flood', label: 'Floods' },
    { value: 'shelter', label: 'Shelters' },
    { value: 'hospital', label: 'Hospitals' },
    { value: 'sos', label: 'SOS' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Map</h1>
          <p className="text-gray-600">
            Real-time view of active incidents, shelters, and emergency facilities
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterType(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === option.value
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-96 md:h-[600px]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UwZTBlMCIgb3BhY2l0eT0iMC40IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-50"></div>

            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Live Map</span>
            </div>

            {filteredMarkers.map((marker, index) => (
              <button
                key={marker.id}
                onClick={() => setSelectedMarker(marker)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-3 rounded-full shadow-lg hover:scale-110 transition-all ${getMarkerColor(
                  marker.type
                )}`}
                style={{
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${30 + (index * 20) % 40}%`,
                }}
              >
                {getMarkerIcon(marker.type)}
              </button>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">Active Emergency</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Shelter</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Hospital</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">SOS Signal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {filteredMarkers.slice(0, 6).map((marker) => (
            <div
              key={marker.id}
              onClick={() => setSelectedMarker(marker)}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getMarkerColor(marker.type).replace('animate-pulse', '')}`}>
                  {getMarkerIcon(marker.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{marker.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{marker.location}</p>
                  {marker.capacity !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      Capacity: {marker.capacity}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedMarker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${getMarkerColor(selectedMarker.type).replace('animate-pulse', '')}`}>
                {getMarkerIcon(selectedMarker.type)}
              </div>
              <button
                onClick={() => setSelectedMarker(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedMarker.name}
            </h3>
            <p className="text-gray-600 mb-4">{selectedMarker.description}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-start space-x-2">
                <Navigation className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-600">{selectedMarker.location}</p>
                </div>
              </div>
              {selectedMarker.capacity !== undefined && (
                <div className="flex items-start space-x-2">
                  <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Capacity</p>
                    <p className="text-sm text-gray-600">{selectedMarker.capacity} people</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (selectedMarker.type === 'sos') {
                    onNavigate('sos-detail', selectedMarker);
                  }
                  setSelectedMarker(null);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Directions
              </button>
              {selectedMarker.type === 'sos' && (
                <button
                  onClick={() => {
                    onNavigate('sos-detail', selectedMarker);
                    setSelectedMarker(null);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  View Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
