import { useState, useEffect } from 'react';
import { AlertCircle, Plus, MapPin, Shield, ArrowRight, Info, HeartPulse } from 'lucide-react';
import { UserRole } from '../types';
import ReportIncidentForm from './ReportIncidentForm';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  userRole: UserRole;
  onNavigate: (page: string, data?: unknown) => void;
}

export default function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [shelters, setShelters] = useState<any[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const sheltersSubscription = supabase
      .channel('shelters-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, () => fetchData())
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();

    return () => {
      sheltersSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: sheltersData } = await supabase
        .from('shelters')
        .select('*')
        .limit(4);
      
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'urgent')
        .limit(3);

      if (sheltersData) setShelters(sheltersData);
      if (tasksData) setUrgentTasks(tasksData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSOSClick = () => {
    setShowSOSConfirm(true);
  };

  const confirmSOS = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Create an incident record for the SOS
      await supabase.from('incidents').insert({
        type: 'sos',
        description: 'Emergency SOS triggered from dashboard',
        location_name: 'User Current Location',
        urgency: 'critical',
        status: 'pending',
        reporter_id: user?.id
      });

      setSosTriggered(true);
      setShowSOSConfirm(false);
      setTimeout(() => setSosTriggered(false), 8000);
    } catch (error) {
      console.error('Error triggering SOS:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-600">
                Live Status
              </span>
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              {userRole === 'civilian' && 'Emergency Dashboard'}
              {userRole === 'volunteer' && 'Volunteer Hub'}
            </h1>
            <p className="text-slate-500 mt-2 max-w-xl">
              {userRole === 'civilian' && 'Immediate assistance and incident reporting at your fingertips.'}
              {userRole === 'volunteer' && 'Contribute to active relief efforts and coordinate with your team.'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
             <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-sm font-medium text-slate-500">Active SOS</span>
                <p className="text-xl font-bold text-red-600">12</p>
             </div>
             <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-sm font-medium text-slate-500">Responders</span>
                <p className="text-xl font-bold text-blue-600">48</p>
             </div>
          </div>
        </div>

        {sosTriggered && (
          <div className="mb-8 bg-red-600 rounded-3xl p-6 shadow-xl shadow-red-200 animate-bounce">
            <div className="flex items-center gap-4 text-white">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xl font-black italic uppercase tracking-tighter">SOS Alert Active!</p>
                <p className="text-red-100 font-medium">Your GPS coordinates have been broadcasted to all rescue units.</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* SOS Button - Massive & Primary */}
          <button
            onClick={handleSOSClick}
            className="group relative bg-red-600 rounded-[2.5rem] p-8 shadow-2xl shadow-red-200 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Shield className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10">
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-black text-white mb-2 italic">SOS</h3>
              <p className="text-red-100 font-medium text-lg leading-tight">
                Emergency broadcast to all units
              </p>
            </div>
          </button>

          {/* Secondary Actions */}
          <button
            onClick={() => setShowReportForm(true)}
            className="group bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
          >
            <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-500 transition-colors duration-300">
              <Plus className="w-8 h-8 text-orange-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Report Incident</h3>
            <p className="text-slate-500 font-medium">Add details about an active crisis</p>
          </button>

          <button
            onClick={() => onNavigate('map')}
            className="group bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left lg:col-span-1 md:col-span-2 lg:col-auto"
          >
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-500 transition-colors duration-300">
              <MapPin className="w-8 h-8 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Find Services</h3>
            <p className="text-slate-500 font-medium">Locate shelters and aid stations</p>
          </button>
        </div>

        {/* Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shelters List */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shelter Status</h2>
                <p className="text-slate-400 text-sm font-medium">Real-time availability</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl">
                <Info className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
              ) : shelters.map((shelter) => (
                <div
                  key={shelter.id}
                  className="group flex items-center justify-between p-4 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => onNavigate('map')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{shelter.name}</h3>
                      <p className="text-xs font-medium text-slate-400">{shelter.address.split(',')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      shelter.available > 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {shelter.available} Left
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
               onClick={() => onNavigate('map')}
               className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              Open Full Map <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tasks or Updates Section */}
          {userRole === 'volunteer' ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Priority Tasks</h2>
                  <p className="text-slate-400 text-sm font-medium">Needs immediate attention</p>
                </div>
                <div className="bg-red-50 p-3 rounded-2xl">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                  </div>
                ) : urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-red-200 transition-all cursor-pointer"
                    onClick={() => onNavigate('tasks')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                           <h3 className="font-bold text-slate-900">{task.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{task.description}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <MapPin className="w-3 h-3" />
                           {task.location}
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded-xl shadow-sm">
                         <ArrowRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="w-full mt-8 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                View All Missions
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white flex flex-col justify-between">
               <div>
                  <h2 className="text-3xl font-black italic mb-4 tracking-tight">Stay Safe.</h2>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    If you are in immediate danger, use the SOS button. 
                    Official responders are active in your area.
                  </p>
               </div>
               <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                     <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <HeartPulse className="w-5 h-5 text-blue-400" />
                     </div>
                     <div>
                        <p className="text-sm font-bold">Nearest Med-Unit</p>
                        <p className="text-xs text-slate-400">2.4 miles • Hospital General</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* SOS Confirmation Modal */}
      {showSOSConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full animate-scale-in shadow-2xl">
            <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-3xl font-black text-center text-slate-900 mb-2 tracking-tight">
              Confirm SOS?
            </h3>
            <p className="text-center text-slate-500 mb-8 font-medium">
              This will send your exact location to emergency services. Do not use for non-emergencies.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmSOS}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
              >
                SEND SOS NOW
              </button>
              <button
                onClick={() => setShowSOSConfirm(false)}
                className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Go Back
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

