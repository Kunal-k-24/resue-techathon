import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, User, Activity, Navigation, Users, CheckCircle } from 'lucide-react';
import { mockSOSAlerts } from '../data/mockData';

interface SOSDetailPageProps {
  onNavigate: (page: string) => void;
}

export default function SOSDetailPage({ onNavigate }: SOSDetailPageProps) {
  const [alert] = useState(mockSOSAlerts[0]);
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setActionTaken(action);
    setTimeout(() => setActionTaken(null), 3000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-600';
      case 'medium':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-700';
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'rescued':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const timeSince = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 md:pt-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => onNavigate('map')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Map</span>
        </button>

        {actionTaken && (
          <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 animate-scale-in">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold text-green-900">Action Confirmed</p>
                <p className="text-green-700 text-sm">{actionTaken}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className={`${getUrgencyColor(alert.urgency)} p-6 text-white`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">SOS Emergency Alert</h1>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alert.status)} bg-white`}>
                    {alert.status.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20">
                    {alert.urgency.toUpperCase()} PRIORITY
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-white text-opacity-90">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{timeSince(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Victim Information</h2>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{alert.victimName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Activity className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Age</p>
                    <p className="text-lg font-semibold text-gray-900">{alert.age} years old</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Activity className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-orange-600">Condition</p>
                    <p className="text-gray-900 font-medium">{alert.condition}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Location Details</h2>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">{alert.location}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Navigation className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Coordinates</p>
                    <p className="text-gray-900 font-mono text-sm">
                      {alert.coordinates.lat.toFixed(4)}, {alert.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 rounded-lg flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-blue-600" />
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-2">Map view simulation</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Response Actions</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAction('Location shared with all rescue teams')}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                  <span>Share Location</span>
                </button>

                <button
                  onClick={() => handleAction('Rescue team Alpha assigned to this emergency')}
                  className="flex items-center justify-center space-x-2 bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Assign Team</span>
                </button>

                <button
                  onClick={() => handleAction('Emergency medical services notified')}
                  className="flex items-center justify-center space-x-2 bg-red-600 text-white py-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <Activity className="w-5 h-5" />
                  <span>Request Medical Aid</span>
                </button>

                <button
                  onClick={() => handleAction('Updated victim status in system')}
                  className="flex items-center justify-center space-x-2 bg-gray-700 text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Update Status</span>
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">SOS Alert Received</p>
                    <p className="text-sm text-gray-500">{timeSince(alert.timestamp)}</p>
                  </div>
                </div>
                {alert.status !== 'pending' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Team Assigned</p>
                      <p className="text-sm text-gray-500">
                        {timeSince(new Date(alert.timestamp.getTime() + 5 * 60000))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
