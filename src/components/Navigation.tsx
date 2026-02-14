import { Home, Map, ListTodo, User, LogOut, Bell, Shield } from 'lucide-react';
import { UserRole } from '../types';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole: UserRole;
}

export default function Navigation({ currentPage, onNavigate, onLogout, userRole }: NavigationProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', show: true },
    { id: 'map', icon: Map, label: 'Map', show: true },
    { id: 'tasks', icon: ListTodo, label: 'Tasks', show: userRole !== 'civilian' },
    { id: 'profile', icon: User, label: 'Profile', show: true },
  ].filter(item => item.show);

  return (
    <>
      {/* Mobile Bottom Navigation - iOS/Android style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 pb-safe z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                currentPage === item.id
                  ? 'text-red-600 scale-110'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className={`w-6 h-6 ${currentPage === item.id ? 'fill-red-50/50' : ''}`} />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Top Navigation - Modern Minimalist */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            <div 
              className="flex items-center space-x-3 cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-200 group-hover:rotate-12 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Rescue<span className="text-red-600">Sync</span>
              </span>
            </div>

            <div className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${
                    currentPage === item.id
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-red-600 font-bold hover:bg-red-50 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for content */}
      <div className="h-20 hidden md:block"></div>
    </>
  );
}

