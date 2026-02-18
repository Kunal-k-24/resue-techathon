import { useState, useEffect, useMemo } from 'react';
import { 
  User, CheckCircle, XCircle, Loader2, Users, AlertCircle, Trash2, Edit, Save, X, 
  Clock, ArrowRight, Zap, MapPin, Info, Bell, LayoutDashboard, ClipboardList, 
  Search, Filter, Home, Cross, Image as ImageIcon, Wind, Droplets, Thermometer, 
  TrendingUp, ShieldAlert, BarChart3, Activity, Menu, LogOut, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import ResourceMap from './ResourceMap';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeIncidents, setActiveIncidents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingUserId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('civilian');
  const [weather, setWeather] = useState({ temp: 28, humidity: 65, windSpeed: 12, city: 'Mumbai' });
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'users' | 'tasks' | 'trigger' | 'resources' | 'manage-incidents'>('overview');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [assignmentLoading, setAssignmentLoading] = useState<string | null>(null);
  const [showIncidentDetail, setShowIncidentDetail] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.warn("Geolocation denied, defaulting to Mumbai");
          setUserLocation([19.0760, 72.8777]);
        }
      );
    }
  }, []);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    type: 'shelter' as 'shelter' | 'hospital' | 'storm' | 'flood' | 'earthquake',
    address: '',
    capacity: 0,
    available: 0,
    location_lat: 19.0760,
    location_lng: 72.8777
  });

  const [triggerForm, setTriggerForm] = useState({
    type: 'flood' as any,
    location: '',
    description: '',
    severity: 'high' as 'low' | 'medium' | 'high' | 'critical'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium' as any,
    assigned_to: ''
  });

  // Defined inside the component to have access to onNavigate and state
  const renderShortcuts = () => (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      <button 
        onClick={() => onNavigate('map')}
        className="group flex items-center justify-between p-8 bg-slate-900 rounded-[2rem] text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">View Network</p>
            <p className="text-lg font-black italic tracking-tighter">Incident Map</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:translate-x-2 transition-transform">
          <ArrowRight className="w-5 h-5 text-white" />
        </div>
      </button>

      <button 
        onClick={() => onNavigate('tasks')}
        className="group flex items-center justify-between p-8 bg-white rounded-[2rem] text-slate-900 border border-slate-100 hover:border-red-200 transition-all shadow-xl shadow-slate-100"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage Missions</p>
            <p className="text-lg font-black italic tracking-tighter">Active Tasks</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:translate-x-2 transition-transform">
          <ArrowRight className="w-5 h-5 text-slate-300" />
        </div>
      </button>
    </div>
  );

  useEffect(() => {
    fetchAllData();
    
    // Simulating weather update for the city
    const weatherInterval = setInterval(() => {
      setWeather(prev => ({
        ...prev,
        temp: 26 + Math.floor(Math.random() * 5),
        humidity: 60 + Math.floor(Math.random() * 10),
        windSpeed: 10 + Math.floor(Math.random() * 8)
      }));
    }, 30000);

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_applications' }, () => {
        fetchApplications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
        fetchUsers();
        fetchVolunteers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, (payload) => {
        fetchStats();
        fetchIncidents();
        if (payload.eventType === 'INSERT') {
          const newIncident = payload.new;
          const notification = {
            id: Date.now(),
            title: `New Incident: ${newIncident.type}`,
            message: `${newIncident.location_name}: ${newIncident.description}`,
            type: 'incident',
            timestamp: new Date().toISOString()
          };
          setNotifications(prev => [notification, ...prev]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, () => {
        fetchResources();
      })
      .subscribe();

    return () => {
      clearInterval(weatherInterval);
      channel.unsubscribe();
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchApplications(), 
      fetchStats(), 
      fetchUsers(), 
      fetchIncidents(), 
      fetchTasks(),
      fetchVolunteers(),
      fetchResources()
    ]);
    setLoading(false);
  };

  const fetchResources = async () => {
    const { data } = await supabase.from('shelters').select('*').order('created_at', { ascending: false });
    setResources(data || []);
  };

  const fetchVolunteers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'volunteer');
    setVolunteers(data || []);
  };

  const fetchIncidents = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*, tasks(status), profiles:assigned_volunteer_id(full_name)')
      .order('created_at', { ascending: false });
    setIncidents(data || []);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*, profiles(full_name)').order('created_at', { ascending: false });
    setTasks(data || []);
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { count } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).neq('status', 'resolved');
      setActiveIncidents(count || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (app: any) => {
    setProcessingId(app.id);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'active', role: 'volunteer' })
        .eq('id', app.profile_id);
      
      if (profileError) throw profileError;

      const { error: appError } = await supabase
        .from('volunteer_applications')
        .update({ status: 'approved' })
        .eq('id', app.id);

      if (appError) throw appError;

    } catch (error) {
      console.error('Error approving application:', error);
      alert('Approval failed.');
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setProcessingId(userId);
    try {
      // Delete from profiles (Cascade or manual triggers should handle auth.users if set up, 
      // but here we focus on public profiles for the demo)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Delete failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: editRole })
        .eq('id', userId);

      if (error) throw error;
      setEditingId(null);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Update failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: taskForm.title,
          description: taskForm.description,
          location: taskForm.location,
          priority: taskForm.priority,
          status: 'pending',
          assigned_to: taskForm.assigned_to || null
        }]);

      if (error) throw error;
      
      alert('Task Created Successfully!');
      setTaskForm({
        title: '',
        description: '',
        location: '',
        priority: 'medium',
        assigned_to: ''
      });
      setActiveTab('tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  const incidentChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    incidents.forEach(inc => {
      counts[inc.type] = (counts[inc.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [incidents]);

  const activityData = useMemo(() => {
    // Generate mock data based on real counts for better visual
    return [
      { name: 'Mon', incidents: 4, tasks: 2 },
      { name: 'Tue', incidents: 7, tasks: 5 },
      { name: 'Wed', incidents: 5, tasks: 8 },
      { name: 'Thu', incidents: activeIncidents, tasks: tasks.length },
      { name: 'Fri', incidents: 8, tasks: 6 },
      { name: 'Sat', incidents: 3, tasks: 4 },
      { name: 'Sun', incidents: 2, tasks: 1 },
    ];
  }, [activeIncidents, tasks.length]);

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-black text-white">
                {entry.value} <span className="text-[10px] font-black text-white/60 uppercase ml-1">{entry.name}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* City Dashboard Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">{weather.city} Command Console</span>
                  </div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mt-1">
                    City <span className="text-red-600 italic underline decoration-red-100 decoration-[12px] underline-offset-[12px]">Intelligence</span>
                  </h2>
                </div>
              </div>
              <p className="text-slate-500 font-medium max-w-lg text-lg leading-relaxed">
                Aggregating real-time field data and environmental patterns for comprehensive metropolitan safety management.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {[
                { icon: Thermometer, value: `${weather.temp}°`, label: 'Temp', color: 'text-orange-500', bg: 'bg-orange-50' },
                { icon: Droplets, value: `${weather.humidity}%`, label: 'Humidity', color: 'text-blue-500', bg: 'bg-blue-50' },
                { icon: Wind, value: `${weather.windSpeed}`, label: 'Wind km/h', color: 'text-slate-500', bg: 'bg-slate-50' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center min-w-[120px] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group/item">
                  <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-3 group-hover/item:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">{item.value}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-600 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10">
            <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> System Prediction
            </h4>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-6xl font-black text-white tracking-tighter italic leading-none">LOW</span>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mb-2" />
            </div>
            <p className="text-white/50 text-sm font-medium leading-relaxed italic mb-8">
              "Atmospheric conditions suggest no immediate disaster risk."
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Risk Level</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase">15% Stability</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[15%] transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Advanced Map Overview */}
          <div className="bg-white rounded-[3.5rem] p-4 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden relative h-[600px] group">
            <div className="absolute top-8 left-8 z-10 flex flex-col gap-3">
              <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-slate-100 ring-1 ring-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Live Situational Map</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[180px] leading-relaxed">
                  Real-time visualization of field reports and active resource nodes.
                </p>
              </div>
            </div>

            <div className="w-full h-full rounded-[3rem] overflow-hidden">
              <ResourceMap 
                resources={resources} 
                incidents={incidents}
                isHeatmap={false}
              />
            </div>
            
            <div className="absolute bottom-8 right-8 z-10 flex gap-3">
              <button className="px-8 py-4 bg-slate-900 rounded-2xl shadow-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-black transition-all">Satellite Mode</button>
              <button className="px-8 py-4 bg-red-600 rounded-2xl shadow-xl shadow-red-100 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-red-500 transition-all hover:scale-105 active:scale-95">Live Updates</button>
            </div>
          </div>

          {/* Detailed Activity Graph */}
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" /> Operational Throughput
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Weekly incident resolution analysis</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Threats</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Response</span>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={350}>
                <BarChart data={activityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} 
                    dy={15}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
                  <Bar dataKey="incidents" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1500} />
                  <Bar dataKey="tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1500} animationBegin={300} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Donut Chart Crisis Analytics */}
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight italic flex items-center gap-3 mb-10">
              <PieChartIcon className="w-6 h-6 text-purple-600" /> Threat Vectors
            </h3>
            <div className="h-[280px] w-full min-h-[280px] relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{activeIncidents}</span>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Active Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                <PieChart>
                  <Pie
                    data={incidentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={85}
                    outerRadius={110}
                    paddingAngle={10}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {incidentChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-10">
              {incidentChartData.map((item, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-purple-200 transition-all group/stat">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{item.value}</span>
                    <span className="text-[8px] font-bold text-slate-400 italic">Reports</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-Resolution Live Pulse */}
          <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl border border-white/5 flex flex-col h-[650px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight italic flex items-center gap-3">
                  <Activity className="w-6 h-6 text-red-500 animate-pulse" /> Live Pulse
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mt-1">Satellite field ingestion</p>
              </div>
              <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                <span className="text-[8px] font-black text-red-500 uppercase animate-pulse">Live Tracking</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar-dark min-h-0">
              {incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/10 py-10">
                  <ShieldAlert className="w-16 h-16 mb-4" />
                  <p className="font-black text-xs uppercase tracking-[0.3em]">Scanning airspace...</p>
                </div>
              ) : (
                incidents.slice(0, 8).map((incident) => (
                  <div 
                    key={incident.id} 
                    className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 group hover:bg-white/10 hover:border-red-500/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => {
                      setSelectedIncident(incident);
                      setShowIncidentDetail(true);
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-red-500/10 transition-colors" />
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                        incident.urgency === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        <span className="text-lg">{incident.type === 'fire' ? '🔥' : incident.type === 'flood' ? '🌊' : incident.type === 'earthquake' ? '🏘️' : incident.type === 'medical' ? '🚑' : incident.type === 'sos' ? '🆘' : '❓'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-black text-white text-[10px] uppercase tracking-tight truncate">{incident.type}</p>
                          <span className="text-[8px] font-black text-white/30 uppercase italic">
                            {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-2.5 h-2.5 text-red-500" />
                          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate">{incident.location_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => setActiveTab('manage-incidents')}
              className="mt-8 w-full py-4 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-[0.98] shadow-2xl shrink-0"
            >
              Master Operations <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Create Task Form */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-24">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" /> Assign New Task
          </h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Title</label>
              <input
                required
                type="text"
                value={taskForm.title}
                onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                placeholder="Rescue Mission Alpha"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
              <textarea
                required
                rows={3}
                value={taskForm.description}
                onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 resize-none"
                placeholder="Evacuation of sector 7..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Assign To</label>
              <select
                value={taskForm.assigned_to}
                onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
              >
                <option value="">Select Volunteer</option>
                {volunteers.map(v => (
                  <option key={v.id} value={v.id}>{v.full_name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Assign Personnel
            </button>
          </form>
        </div>
      </div>

      {/* Task List */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Mission <span className="text-blue-600">Log</span></h3>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-slate-50 rounded-lg text-slate-400"><Filter className="w-4 h-4" /></button>
              <button className="p-2 bg-slate-50 rounded-lg text-slate-400"><Search className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight">{task.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">{task.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-slate-600">{task.profiles?.full_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      task.priority === 'urgent' ? 'text-red-500' : 'text-slate-400'
                    }`}>{task.priority}</span>
                    <button className="p-2 text-slate-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.getUser();

      const { error } = await supabase
        .from('shelters')
        .insert([{
          name: resourceForm.name,
          type: resourceForm.type,
          address: resourceForm.address,
          capacity: resourceForm.capacity,
          available: resourceForm.available,
          location_lat: resourceForm.location_lat,
          location_lng: resourceForm.location_lng
        }]);

      if (error) {
        console.error('Detailed Supabase Error:', error);
        throw error;
      }
      
      alert(`${resourceForm.type === 'shelter' ? 'Shelter' : 'Hospital'} Created Successfully!`);
      setResourceForm({
        name: '',
        type: 'shelter',
        address: '',
        capacity: 0,
        available: 0,
        location_lat: 19.0760,
        location_lng: 72.8777
      });
      setActiveTab('resources');
    } catch (error) {
      console.error('Error creating resource:', error);
      alert('Failed to create resource. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('shelters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Resource deleted successfully!');
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource.');
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'hospital': return <Cross className="w-6 h-6" />;
      case 'storm': return <Zap className="w-6 h-6" />;
      case 'flood': return <Info className="w-6 h-6" />;
      case 'earthquake': return <AlertCircle className="w-6 h-6" />;
      default: return <Home className="w-6 h-6" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-cyan-50 text-cyan-600';
      case 'storm': return 'bg-purple-50 text-purple-600';
      case 'flood': return 'bg-blue-50 text-blue-600';
      case 'earthquake': return 'bg-orange-50 text-orange-600';
      default: return 'bg-emerald-50 text-emerald-600';
    }
  };

  const renderResources = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-24">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" /> Register Resource
          </h3>
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Type</label>
                <select
                  value={resourceForm.type}
                  onChange={e => setResourceForm({...resourceForm, type: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                >
                  <option value="shelter">Shelter</option>
                  <option value="hospital">Hospital</option>
                  <option value="storm">Storm Relief</option>
                  <option value="flood">Flood Center</option>
                  <option value="earthquake">Earthquake Camp</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Name</label>
                <input
                  required
                  type="text"
                  value={resourceForm.name}
                  onChange={e => setResourceForm({...resourceForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                  placeholder="Red Cross Center"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Physical Address</label>
              <input
                required
                type="text"
                value={resourceForm.address}
                onChange={e => setResourceForm({...resourceForm, address: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                placeholder="123 Rescue Ave, Downtown"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Capacity</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={resourceForm.capacity || ''}
                  onChange={e => setResourceForm({...resourceForm, capacity: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Available</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={resourceForm.available || ''}
                  onChange={e => setResourceForm({...resourceForm, available: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Select Location (Drag Marker)</label>
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <ResourceMap 
                  onLocationSelect={(lat, lng) => setResourceForm({...resourceForm, location_lat: lat, location_lng: lng})} 
                  initialLocation={[resourceForm.location_lat, resourceForm.location_lng]}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Resource
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 tracking-tight italic mb-8">Resource <span className="text-emerald-600">Inventory</span></h3>
          <div className="space-y-4">
            {resources.map((res) => (
              <div key={res.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-emerald-200 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getResourceColor(res.type)}`}>
                      {getResourceIcon(res.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 tracking-tight">{res.name}</h4>
                        <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400">
                          {res.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{res.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 leading-none">{res.available}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Available</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/60">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <MapPin className="w-3 h-3" />
                    {res.location_lat?.toFixed(4) || '0.0000'}, {res.location_lng?.toFixed(4) || '0.0000'}
                  </div>
                  <button 
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const handleUpdateIncidentStatus = async (incidentId: string, status: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', incidentId);

      if (error) throw error;
      
      // Update local state for immediate feedback
      setIncidents(prev => (prev || []).map(inc => inc.id === incidentId ? { ...inc, status } : inc));
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident((prev: any) => (prev ? { ...prev, status } : null));
      }
      
      alert(`Incident status updated to ${status}`);
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignVolunteer = async (incidentId: string, volunteerId: string) => {
    if (assignmentLoading) return;
    setAssignmentLoading(volunteerId);
    try {
      const incident = incidents.find(i => i.id === incidentId);
      if (!incident) throw new Error('Incident not found');

      // 1. Create the task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          title: `Mission: ${incident.type.toUpperCase()}`,
          description: `Emergency Response at ${incident.location_name}. Details: ${incident.description}`,
          location: incident.location_name,
          priority: incident.urgency === 'critical' ? 'urgent' : 'high',
          status: 'pending',
          assigned_to: volunteerId
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // 2. Update the incident status and link task/volunteer
      const { error: incError } = await supabase
        .from('incidents')
        .update({ 
          status: 'responding', 
          updated_at: new Date().toISOString(),
          assigned_volunteer_id: volunteerId,
          task_id: taskData.id
        })
        .eq('id', incidentId);

      if (incError) throw incError;

      // Update local state
      setIncidents(prev => (prev || []).map(inc => inc.id === incidentId ? { 
        ...inc, 
        status: 'responding',
        assigned_volunteer_id: volunteerId,
        task_id: taskData.id
      } : inc));
      
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident((prev: any) => (prev ? { 
          ...prev, 
          status: 'responding',
          assigned_volunteer_id: volunteerId,
          task_id: taskData.id
        } : null));
      }

      alert('Volunteer dispatched successfully!');
      fetchTasks();
      fetchIncidents(); // Refetch to get joined data if any
    } catch (error) {
      console.error('Error assigning volunteer:', error);
      alert('Assignment failed. Please check your connection.');
    } finally {
      setAssignmentLoading(null);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Simple Euclidean distance for hackathon (can use Haversine for real world)
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  };

  const renderManageIncidents = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.map((incident) => (
          <div 
            key={incident.id} 
            onClick={() => {
              setSelectedIncident(incident);
              setShowIncidentDetail(true);
            }}
            className="p-6 bg-white rounded-[2.5rem] border border-slate-100 transition-all cursor-pointer shadow-sm hover:shadow-xl group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                  incident.urgency === 'critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {incident.type === 'fire' ? '🔥' : incident.type === 'flood' ? '🌊' : incident.type === 'earthquake' ? '🏘️' : incident.type === 'medical' ? '🚑' : incident.type === 'sos' ? '🆘' : '❓'}
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{incident.type}</h4>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {incident.location_name}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                incident.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                incident.status === 'responding' ? 'bg-blue-100 text-blue-600' :
                'bg-emerald-100 text-emerald-600'
              }`}>
                {incident.status}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600 font-medium italic leading-relaxed line-clamp-2">
                "{incident.description}"
              </p>
              
              {incident.image_url && (
                <div className="relative h-40 rounded-2xl overflow-hidden border-2 border-slate-50">
                  <img src={incident.image_url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">
                  {new Date(incident.created_at).toLocaleTimeString()}
                </span>
                <button 
                  className="text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  View Intel <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Info Modal */}
      {showIncidentDetail && selectedIncident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden relative">
            <button 
              onClick={() => setShowIncidentDetail(false)}
              className="absolute top-8 right-8 p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl ${
                selectedIncident.urgency === 'critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
              }`}>
                {selectedIncident.type === 'fire' ? '🔥' : selectedIncident.type === 'flood' ? '🌊' : selectedIncident.type === 'earthquake' ? '🏘️' : selectedIncident.type === 'medical' ? '🚑' : selectedIncident.type === 'sos' ? '🆘' : '❓'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{selectedIncident.type} MISSION</h3>
                  {selectedIncident.profiles?.full_name && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3 h-3" /> Assigned: {selectedIncident.profiles.full_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-widest">
                  <MapPin className="w-4 h-4 text-red-500" /> {selectedIncident.location_name}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block">Situation Intel</label>
                  <p className="text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic">
                    "{selectedIncident.description}"
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Incident</label>
                    <span className="font-black text-slate-900 uppercase text-[10px] tracking-tighter">{selectedIncident.status}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Mission</label>
                    <span className={`font-black uppercase text-[10px] tracking-tighter ${
                      selectedIncident.tasks?.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'
                    }`}>
                      {selectedIncident.tasks?.status || 'unassigned'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Urgency</label>
                    <span className={`font-black uppercase text-[10px] tracking-tighter ${selectedIncident.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                      {selectedIncident.urgency}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-2">Dispatch Personnel (Nearest First)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {volunteers
                      .sort((a, b) => {
                        if (!selectedIncident.location_lat || !selectedIncident.location_lng) return 0;
                        const distA = calculateDistance(
                          selectedIncident.location_lat, 
                          selectedIncident.location_lng, 
                          a.location_lat || 19.0760, 
                          a.location_lng || 72.8777
                        );
                        const distB = calculateDistance(
                          selectedIncident.location_lat, 
                          selectedIncident.location_lng, 
                          b.location_lat || 19.0760, 
                          b.location_lng || 72.8777
                        );
                        return distA - distB;
                      })
                      .map((v) => (
                        <div key={v.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-[10px] leading-tight">{v.full_name}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">{v.status}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleAssignVolunteer(selectedIncident.id, v.id)}
                            disabled={assignmentLoading === v.id}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:bg-slate-200"
                          >
                            {assignmentLoading === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Assign'}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 block text-right">Field Evidence</label>
                {selectedIncident.image_url ? (
                  <div className="h-full max-h-[400px] rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-xl group relative">
                    <img src={selectedIncident.image_url} alt="Field" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                ) : (
                  <div className="h-64 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Visual Intel</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-8 border-t border-slate-100">
              <button 
                onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'responding')}
                className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                Launch Response
              </button>
              <button 
                onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'resolved')}
                className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Mark Resolved
              </button>
              <button 
                onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'closed')}
                className="px-8 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const handleTriggerDisaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Use selected coordinates if available, otherwise use detected user location
      const lat = (triggerForm as any).location_lat || (userLocation?.[0] || 19.0760);
      const lng = (triggerForm as any).location_lng || (userLocation?.[1] || 72.8777);

      const { error } = await supabase
        .from('incidents')
        .insert([{
          type: triggerForm.type,
          description: triggerForm.description,
          location_name: `Sector-${Math.floor(Math.random() * 1000)}`, // Auto-generate name since manual field is removed
          location_lat: lat,
          location_lng: lng,
          status: 'pending',
          urgency: triggerForm.severity,
          reporter_id: user?.id
        }]);

      if (error) throw error;
      
      alert('Disaster Event Triggered Successfully!');
      setTriggerForm({
        type: 'flood',
        location: '',
        description: '',
        severity: 'high'
      });
      setActiveTab('overview');
    } catch (error) {
      console.error('Error triggering disaster:', error);
      alert('Failed to trigger disaster.');
    } finally {
      setLoading(false);
    }
  };

  const renderTriggerDisaster = () => (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
          <Zap className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Trigger Alert</h2>
          <p className="text-slate-400 font-medium">Broadcast a manual disaster notification.</p>
        </div>
      </div>

      <form onSubmit={handleTriggerDisaster} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Event Type</label>
            <select
              value={triggerForm.type}
              onChange={(e) => setTriggerForm({...triggerForm, type: e.target.value})}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all appearance-none"
            >
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="earthquake">Earthquake</option>
              <option value="storm">Storm</option>
              <option value="medical">Medical Emergency</option>
              <option value="other">Other</option>
              <option value="sos">SOS</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Severity</label>
            <select
              value={triggerForm.severity}
              onChange={(e) => setTriggerForm({...triggerForm, severity: e.target.value as any})}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all appearance-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Description / Guidance</label>
          <div className="relative">
            <Info className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
            <textarea
              required
              rows={3}
              value={triggerForm.description}
              onChange={(e) => setTriggerForm({...triggerForm, description: e.target.value})}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all placeholder:text-slate-300 resize-none"
              placeholder="Provide details and safety instructions..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Incident Location (Select on Map)</label>
          <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <ResourceMap 
              onLocationSelect={(lat, lng) => setTriggerForm({...triggerForm, location_lat: lat, location_lng: lng} as any)} 
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none mt-4"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" /> Trigger Alert Now
            </>
          )}
        </button>
      </form>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Mission Log', icon: ClipboardList },
    { id: 'manage-incidents', label: 'Field Operations', icon: AlertCircle },
    { id: 'resources', label: 'Resources', icon: Home },
    { id: 'applications', label: 'Personnel Vetting', icon: Users },
    { id: 'users', label: 'Network Registry', icon: User },
    { id: 'trigger', label: 'Trigger Alert', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Premium Admin Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tighter italic leading-none">Rescue <span className="text-red-600">Sync</span></h1>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Admin Command</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.id === 'applications' && applications.length > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center animate-pulse">
                      {applications.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 border-2 border-white rounded-full"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-scale-in">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="font-black text-slate-900 tracking-tight">Intelligence Feed</h4>
                      <button onClick={() => setNotifications([])} className="text-[10px] font-black text-red-600 uppercase tracking-widest">Clear All</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center">
                          <Info className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No New Alerts</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="font-black text-slate-900 text-sm">{n.title}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">{n.message}</p>
                            <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase">{new Date(n.timestamp).toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-3 bg-slate-900 text-white rounded-xl shadow-lg"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => supabase.auth.signOut()}
                className="hidden lg:flex p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {showMobileMenu && (
          <div className="lg:hidden bg-white border-t border-slate-100 py-4 px-4 space-y-2 shadow-xl animate-in slide-in-from-top duration-300">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.id === 'applications' && applications.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-red-500 text-white text-[8px]">
                    {applications.length}
                  </span>
                )}
              </button>
            ))}
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all border-t border-slate-50 mt-4"
            >
              <LogOut className="w-5 h-5" />
              Sign Out Command
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'manage-incidents' && renderManageIncidents()}
          {activeTab === 'resources' && renderResources()}
          {activeTab === 'applications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.length === 0 && !loading && (
                <div className="md:col-span-2 py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No pending requests</p>
                </div>
              )}
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{app.full_name}</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{app.contact_number}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={!!processingId}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                        {processingId === app.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        disabled={!!processingId}
                        className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Qualifications</p>
                      <div className="flex flex-wrap gap-2">
                        {app.skills?.map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100 italic">
                            #{skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Statement of Intent</p>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed italic line-clamp-3">"{app.reason}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'users' && (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 tracking-tight">{user.full_name || 'Anonymous'}</p>
                                <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {editingUserId === user.id ? (
                              <select 
                                value={editRole || ''}
                                onChange={(e) => setEditRole(e.target.value as UserRole)}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs font-black outline-none focus:ring-2 focus:ring-red-500/20"
                              >
                                <option value="civilian">Civilian</option>
                                <option value="volunteer">Volunteer</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'volunteer' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`flex items-center gap-1.5 text-xs font-bold ${
                              user.status === 'active' ? 'text-emerald-600' :
                              user.status === 'pending' ? 'text-orange-500' :
                              'text-red-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'active' ? 'bg-emerald-500' :
                                user.status === 'pending' ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}></span>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-400 italic">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center justify-end gap-2">
                              {editingUserId === user.id ? (
                                <>
                                  <button 
                                    onClick={() => handleUpdateRole(user.id)}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 transition-all shadow-sm"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingId(user.id);
                                      setEditRole(user.role);
                                    }}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
          {activeTab === 'trigger' && renderTriggerDisaster()}
        </div>
        
        {renderShortcuts()}
      </main>
    </div>
  );
}
