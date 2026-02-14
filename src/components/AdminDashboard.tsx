import { useState, useEffect } from 'react';
import { Shield, User, CheckCircle, XCircle, Loader2, ArrowRight, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [activeIncidents, setActiveIncidents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();

    // Comprehensive real-time subscription for ALL relevant tables
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_applications' }, () => {
        fetchApplications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchApplications(), fetchStats()]);
    setLoading(false);
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [profilesRes, incidentsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).neq('status', 'resolved')
      ]);

      setVerifiedCount(profilesRes.count || 0);
      setActiveIncidents(incidentsRes.count || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (app: any) => {
    setProcessingId(app.id);
    try {
      // Use a single RPC call or sequential calls wrapped in client logic
      // 1. Update user profile status to active and roles if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', app.profile_id);
      
      if (profileError) throw profileError;

      // 2. Update application status
      const { error: appError } = await supabase
        .from('volunteer_applications')
        .update({ status: 'approved' })
        .eq('id', app.id);

      if (appError) throw appError;

    } catch (error) {
      console.error('Error approving application:', error);
      alert('Approval failed. Check database permissions.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app: any) => {
    setProcessingId(app.id);
    try {
      await supabase
        .from('volunteer_applications')
        .update({ status: 'rejected' })
        .eq('id', app.id);

      await supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', app.profile_id);
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-red-100 text-red-600 shadow-sm">
                Control Center
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">Admin <span className="text-red-600">Console</span></h1>
            <p className="text-slate-400 font-medium mt-2">Manage volunteer approvals and network status.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100">
             <div className="px-6 py-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Strength</p>
                   <p className="text-xl font-black text-slate-900 tracking-tighter">{verifiedCount} Verified</p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
             </div>
             <div className="px-6 py-4 bg-red-50 rounded-2xl flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Active Incidents</p>
                   <p className="text-xl font-black text-red-600 tracking-tighter">{activeIncidents}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pending Applications</h2>
               <div className="flex items-center gap-2 bg-slate-200/50 p-1.5 rounded-xl">
                  <span className="px-3 py-1 bg-white rounded-lg text-xs font-bold text-slate-600 shadow-sm">{applications.length} New</span>
               </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <Loader2 className="w-12 h-12 text-slate-200 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                 <Shield className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">Queue is Clear</p>
                 <p className="text-slate-300 text-sm mt-1">No pending volunteer applications.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200 border border-slate-100 hover:shadow-2xl transition-all group">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                            <User className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{app.full_name}</h3>
                            <p className="text-sm font-bold text-slate-400">{app.contact_number}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="p-4 bg-slate-50 rounded-2xl">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Capabilities</p>
                              <div className="flex flex-wrap gap-2">
                                 {app.skills.map((skill: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-white rounded-lg text-xs font-black uppercase text-slate-600 border border-slate-100">
                                       {skill}
                                    </span>
                                 ))}
                              </div>
                           </div>
                           
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Motivation</p>
                              <p className="text-slate-600 font-medium text-sm leading-relaxed">{app.reason}</p>
                           </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col gap-4 justify-center">
                        <button
                          onClick={() => handleApprove(app)}
                          disabled={processingId === app.id}
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app)}
                          disabled={processingId === app.id}
                          className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {processingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-300">
                <h2 className="text-2xl font-black italic tracking-tighter mb-8 border-b border-white/10 pb-4">Shortcuts</h2>
                <div className="space-y-4">
                   <button onClick={() => onNavigate('map')} className="w-full group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-600 hover:border-red-500 transition-all">
                      <span className="font-black text-xs uppercase tracking-widest">Incident Map</span>
                      <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                   </button>
                   <button onClick={() => onNavigate('tasks')} className="w-full group flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:border-blue-500 transition-all">
                      <span className="font-black text-xs uppercase tracking-widest">Active Tasks</span>
                      <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                   </button>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Recent Activity</h2>
                <div className="space-y-6">
                   {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">Volunteer Approved</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">14 minutes ago</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
