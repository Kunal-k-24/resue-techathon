import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, User, Activity, Navigation, Users, CheckCircle, AlertCircle, Shield, ChevronRight, Share2 } from 'lucide-react';
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
        return 'bg-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-700';
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'rescued':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const timeSince = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('map')}
            className="group flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 transition-all hover:-translate-x-1"
          >
            <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-black text-xs uppercase tracking-widest">Back to Map</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Live Transmission</span>
          </div>
        </div>

        {actionTaken && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-md animate-slide-up">
            <div className="bg-emerald-600 text-white rounded-[2rem] p-4 shadow-2xl flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm">{actionTaken}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Detail Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
              {/* Alert Status Banner */}
              <div className={`${getUrgencyColor(alert.urgency)} p-8 md:p-10 text-white relative`}>
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <Activity className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white ${getStatusBadge(alert.status).split(' ')[1]}`}>
                      {alert.status}
                    </span>
                    <span className="px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/20">
                      {alert.urgency} Priority
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-4">SOS DISTRESS</h1>
                  <div className="flex items-center gap-2 text-white/80 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    Broadcasted {timeSince(alert.timestamp)}
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Victim Info */}
                  <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <User className="w-4 h-4" /> Subject Details
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-slate-200 transition-all">
                        <div className="bg-white p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Name</p>
                          <p className="text-xl font-black text-slate-900 tracking-tight">{alert.victimName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-slate-200 transition-all">
                        <div className="bg-white p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform text-blue-500">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Vitals / Age</p>
                          <p className="text-xl font-black text-slate-900 tracking-tight">{alert.age}y • Stable</p>
                        </div>
                      </div>
                      <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Reported Condition
                        </p>
                        <p className="text-slate-800 font-bold leading-relaxed">{alert.condition}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Geodata
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-emerald-500">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Address</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{alert.location}</p>
                        </div>
                      </div>
                      <div className="relative rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-xl h-48 group">
                         <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                            <MapPin className="w-12 h-12 text-blue-500 animate-bounce" />
                         </div>
                         <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-white/50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                               {alert.coordinates.lat.toFixed(4)}, {alert.coordinates.lng.toFixed(4)}
                            </span>
                            <Navigation className="w-4 h-4 text-blue-500" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Timeline Area */}
            <div className="bg-white rounded-[3rem] p-10 shadow-lg border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8">Mission Timeline</h2>
              <div className="space-y-8 relative">
                <div className="absolute left-3 top-3 bottom-3 w-[2px] bg-slate-100"></div>
                
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-md mt-1"></div>
                  <div>
                    <p className="font-black text-slate-900 tracking-tight">SOS Received</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{timeSince(alert.timestamp)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md mt-1"></div>
                  <div>
                    <p className="font-black text-slate-900 tracking-tight">Units Mobilized</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Automatic Dispatch Initialized</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-6 h-6 bg-slate-200 rounded-full border-4 border-white shadow-md mt-1"></div>
                  <div className="opacity-40">
                    <p className="font-black text-slate-900 tracking-tight">Rescue Operation Finalized</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Awaiting Field Confirmation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Response Controls Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white shadow-2xl shadow-slate-300">
              <h2 className="text-2xl font-black italic tracking-tighter mb-8 border-b border-white/10 pb-4">Command</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleAction('Dispatching nearest units...')}
                  className="group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-red-600 hover:border-red-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20">
                      <Navigation className="w-6 h-6 text-red-500 group-hover:text-white" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Share Location</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleAction('Assigning Rescue Team Alpha...')}
                  className="group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-blue-600 hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20">
                      <Users className="w-6 h-6 text-blue-500 group-hover:text-white" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Assign Team</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleAction('EMS notified for immediate support...')}
                  className="group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-emerald-600 hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20">
                      <Shield className="w-6 h-6 text-emerald-500 group-hover:text-white" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Med-Aid Call</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </button>

                <button
                  onClick={() => handleAction('Mission status updated to in-progress...')}
                  className="group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-slate-700 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20">
                      <Share2 className="w-6 h-6 text-slate-400 group-hover:text-white" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest">Broadcast Log</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </button>
              </div>
              
              <button
                className="w-full mt-10 py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-900/50 hover:bg-red-700 transition-all active:scale-95"
              >
                FINALIZE RESCUE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

