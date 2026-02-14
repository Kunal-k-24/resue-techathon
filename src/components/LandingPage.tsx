import { Shield, Users, Truck } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onRoleSelect: (role: UserRole) => void;
}

export default function LandingPage({ onRoleSelect }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="bg-red-600 p-4 rounded-full shadow-lg">
              <Shield className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            DisasterLink
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
            Coordinating emergency response and connecting communities in times of crisis
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => onRoleSelect('civilian')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-500 transition-colors">
                <Users className="w-12 h-12 text-blue-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Civilian</h3>
            <p className="text-gray-600">
              Report emergencies, request help, and find nearby shelters
            </p>
          </button>

          <button
            onClick={() => onRoleSelect('volunteer')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-green-500"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full group-hover:bg-green-500 transition-colors">
                <Users className="w-12 h-12 text-green-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Volunteer</h3>
            <p className="text-gray-600">
              Join relief efforts, complete tasks, and help your community
            </p>
          </button>

          <button
            onClick={() => onRoleSelect('rescue-team')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-red-500"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full group-hover:bg-red-500 transition-colors">
                <Truck className="w-12 h-12 text-red-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Rescue Team</h3>
            <p className="text-gray-600">
              Coordinate operations, manage resources, and respond to alerts
            </p>
          </button>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Emergency Hotline: 911 | Support: 1-800-DISASTER</p>
        </div>
      </div>
    </div>
  );
}
