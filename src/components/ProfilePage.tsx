import { User, Mail, Phone, MapPin, Award, Calendar, Shield } from 'lucide-react';
import { UserRole } from '../types';

interface ProfilePageProps {
  userRole: UserRole;
}

export default function ProfilePage({ userRole }: ProfilePageProps) {
  const profiles = {
    civilian: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'Downtown District',
      joinDate: 'January 2024',
      stats: [
        { label: 'Reports Submitted', value: '3' },
        { label: 'Shelters Visited', value: '1' },
        { label: 'Alerts Received', value: '12' },
      ],
    },
    volunteer: {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 234-5678',
      location: 'Central Zone',
      joinDate: 'November 2023',
      stats: [
        { label: 'Tasks Completed', value: '27' },
        { label: 'Hours Volunteered', value: '156' },
        { label: 'People Helped', value: '89' },
      ],
    },
    'rescue-team': {
      name: 'Captain Mike Roberts',
      email: 'mike.roberts@rescue.org',
      phone: '+1 (555) 345-6789',
      location: 'Emergency HQ',
      joinDate: 'March 2020',
      stats: [
        { label: 'Missions Completed', value: '143' },
        { label: 'Lives Saved', value: '312' },
        { label: 'Team Members', value: '8' },
      ],
    },
  };

  const profile = profiles[userRole as keyof typeof profiles];

  const getRoleBadge = () => {
    switch (userRole) {
      case 'civilian':
        return { color: 'bg-blue-100 text-blue-700', label: 'Civilian' };
      case 'volunteer':
        return { color: 'bg-green-100 text-green-700', label: 'Volunteer' };
      case 'rescue-team':
        return { color: 'bg-red-100 text-red-700', label: 'Rescue Team' };
      default:
        return { color: 'bg-gray-100 text-gray-700', label: 'User' };
    }
  };

  const badge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 md:pt-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 h-32"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="mt-4 md:mt-0 md:flex-1 md:mb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">{profile.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900 font-medium">{profile.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-gray-900 font-medium">{profile.joinDate}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Statistics</h2>

                {profile.stats.map((stat, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <Award className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Contacts</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <Phone className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Emergency</p>
                  <p className="text-xl font-bold text-gray-900">911</p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                  <Phone className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Disaster Hotline</p>
                  <p className="text-lg font-bold text-gray-900">1-800-DISASTER</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Support</p>
                  <p className="text-sm font-bold text-gray-900">help@disasterlink.org</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
