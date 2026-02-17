import { Shield, Users, ArrowRight, HeartPulse, Activity } from 'lucide-react';
import { UserRole } from '../types';

interface LandingPageProps {
  onRoleSelect: (role: UserRole) => void;
}

export default function LandingPage({ onRoleSelect }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-50 pt-16 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 mb-8 animate-bounce">
              <Activity className="w-4 h-4 mr-2" />
              Live Emergency Response System
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
              Rescue<span className="text-red-600">Sync</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              The ultimate bridge between those in need and those who can help. 
              Real-time coordination for a faster, safer community response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* Civilian Card */}
            <div 
              onClick={() => onRoleSelect('civilian')}
              className="group cursor-pointer relative bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-24 h-24 text-blue-600" />
              </div>
              <div className="relative">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                  <Users className="w-7 h-7 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Civilian</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  I need help or want to report an emergency in my area.
                </p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Volunteer Card */}
            <div 
              onClick={() => onRoleSelect('volunteer')}
              className="group cursor-pointer relative bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="relative">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                  <HeartPulse className="w-7 h-7 text-emerald-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Volunteer</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  I want to contribute my time and help with local relief efforts.
                </p>
                <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                  Join Efforts <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Contact */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2 text-slate-400">
            <Shield className="w-5 h-5" />
            <span className="font-medium">RescueSync v1.0</span>
          </div>
          <div className="flex space-x-8 text-sm font-semibold text-slate-600">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Emergency: 911
            </span>
            <span className="hover:text-red-600 cursor-pointer">Support</span>
            <span className="hover:text-red-600 cursor-pointer">Privacy</span>
          </div>
        </div>
      </div>
    </div>
  );
}

