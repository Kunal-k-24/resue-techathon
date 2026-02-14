import { useState } from 'react';
import { AlertCircle, Plus, MapPin, Activity } from 'lucide-react';
import { UserRole } from '../types';
import ReportIncidentForm from './ReportIncidentForm';
import { mockShelters, mockTasks } from '../data/mockData';

interface DashboardProps {
  userRole: UserRole;
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  const handleSOSClick = () => {
    setShowSOSConfirm(true);
  };

  const confirmSOS = () => {
    setSosTriggered(true);
    setShowSOSConfirm(false);
    setTimeout(() => setSosTriggered(false), 5000);
  };

  const urgentTasks = mockTasks.filter(t => t.status === 'urgent');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === 'civilian' && 'Emergency Dashboard'}
            {userRole === 'volunteer' && 'Volunteer Dashboard'}
            {userRole === 'rescue-team' && 'Rescue Command Center'}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'civilian' && 'Get help and report emergencies'}
            {userRole === 'volunteer' && 'View and complete relief tasks'}
            {userRole === 'rescue-team' && 'Coordinate emergency response operations'}
          </p>
        </div>

        {sosTriggered && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-bold text-red-900">SOS Alert Sent!</p>
                <p className="text-red-700 text-sm">Emergency teams have been notified of your location</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <button
            onClick={handleSOSClick}
            className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">SOS EMERGENCY</h3>
            <p className="text-red-100">Tap to send immediate distress signal</p>
          </button>

          <button
            onClick={() => setShowReportForm(true)}
            className="bg-white border-2 border-orange-500 hover:bg-orange-50 rounded-2xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-16 h-16 mx-auto mb-4 text-orange-600" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Incident</h3>
            <p className="text-gray-600">Submit details about an emergency situation</p>
          </button>

          <button
            onClick={() => onNavigate('map')}
            className="bg-white border-2 border-green-500 hover:bg-green-50 rounded-2xl p-8 shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            <MapPin className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Find Help</h3>
            <p className="text-gray-600">Locate nearby shelters and hospitals</p>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nearby Shelters</h2>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {mockShelters.map((shelter) => (
                <div
                  key={shelter.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('map')}
                >
                  <h3 className="font-semibold text-gray-900">{shelter.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{shelter.address}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {shelter.available} / {shelter.capacity} available
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      shelter.available > 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {shelter.available > 100 ? 'Available' : 'Limited'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(userRole === 'volunteer' || userRole === 'rescue-team') && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Urgent Tasks</h2>
                <Activity className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => onNavigate('tasks')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {task.location}
                        </p>
                      </div>
                      <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ml-2">
                        URGENT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                View All Tasks
              </button>
            </div>
          )}
        </div>
      </div>

      {showSOSConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Send SOS Alert?
            </h3>
            <p className="text-center text-gray-600 mb-6">
              This will immediately notify all nearby rescue teams and send your location. Only use in real emergencies.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSOSConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSOS}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportForm && (
        <ReportIncidentForm onClose={() => setShowReportForm(false)} />
      )}
    </div>
  );
}
