import { Home, Map, ListTodo, User, LogOut, Bell, Shield, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole: UserRole;
}

export default function Navigation({ currentPage, onNavigate, onLogout, userRole }: NavigationProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Listen for new incidents (disasters)
    const channel = supabase
      .channel('global-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload) => {
        const newIncident = payload.new;
        const notification = {
          id: Date.now(),
          title: `URGENT: ${newIncident.type.toUpperCase()} Alert`,
          message: `${newIncident.location_name}: ${newIncident.description}`,
          type: 'incident',
          timestamp: new Date().toISOString()
        };
        setNotifications(prev => [notification, ...prev]);
        
        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title, { body: notification.message });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', show: true },
    { id: 'map', icon: Map, label: 'Map', show: true },
    { id: 'tasks', icon: ListTodo, label: 'Tasks', show: userRole !== 'civilian' },
    { id: 'profile', icon: User, label: 'Profile', show: true },
  ].filter(item => item.show);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 pb-safe z-50 md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                currentPage === item.id ? 'text-red-600 scale-110' : 'text-slate-400'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Top Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onNavigate('home')}>
              <div className="bg-red-600 p-2.5 rounded-2xl shadow-lg shadow-red-200 group-hover:rotate-12 transition-transform">
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
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all ${
                    currentPage === item.id ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-[60] overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                      <h4 className="font-black text-slate-900 tracking-tight">Emergency Alerts</h4>
                      <button onClick={() => setNotifications([])} className="text-[10px] font-black text-red-600 uppercase tracking-widest">Clear</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Active Alerts</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-5 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm">{n.title}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <button onClick={onLogout} className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-red-600 font-bold hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <div className="h-20 hidden md:block"></div>
    </>
  );
}

