import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Award, Calendar, Shield, Edit3, Heart, Activity, Info, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface ProfilePageProps {
  userRole: UserRole;
}

export default function ProfilePage({ userRole }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userRole]);

  const fetchProfile = async () => {
    try {
      // In a real app, we'd use the authenticated user ID.
      // For this hackathon project, we'll fetch the first profile matching the role
      // or create one if it doesn't exist.
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', userRole)
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // No profile found, create a mock one
        const newProfile = {
          role: userRole,
          full_name: userRole === 'volunteer' ? 'Sarah Johnson' : userRole === 'rescue-team' ? 'Captain Mike Roberts' : 'John Doe',
          email: `${userRole}@example.com`,
          phone: '+1 (555) 000-0000',
          location: 'City Center',
          join_date: new Date().toISOString()
        };
        const { data: createdData } = await supabase.from('profiles').insert(newProfile).select().single();
        data = createdData;
      }

      // Fetch dynamic stats
      const stats = await fetchDynamicStats(data?.id);
      setProfile({ ...data, dynamicStats: stats });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicStats = async (profileId: string) => {
    if (!profileId) return [];
    
    if (userRole === 'civilian') {
      const { count: reportCount } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('reporter_id', profileId);
      return [
        { label: 'Reports Submitted', value: reportCount || 0, icon: <Activity className="w-5 h-5" /> },
        { label: 'Shelters Nearby', value: '12', icon: <MapPin className="w-5 h-5" /> },
        { label: 'Alerts Received', value: '5', icon: <Shield className="w-5 h-5" /> },
      ];
    } else if (userRole === 'volunteer') {
      const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assigned_to', profileId).eq('status', 'completed');
      return [
        { label: 'Missions Finished', value: taskCount || 0, icon: <Award className="w-5 h-5" /> },
        { label: 'Community Rating', value: '4.9', icon: <Heart className="w-5 h-5" /> },
        { label: 'Active Hours', value: '24', icon: <Calendar className="w-5 h-5" /> },
      ];
    } else {
      const { count: rescueCount } = await supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      return [
        { label: 'Team Operations', value: rescueCount || 0, icon: <Award className="w-5 h-5" /> },
        { label: 'Lives Impacted', value: '150+', icon: <Heart className="w-5 h-5" /> },
        { label: 'Active Personnel', value: '12', icon: <User className="w-5 h-5" /> },
      ];
    }
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'civilian':
        return { color: 'bg-blue-100 text-blue-700', label: 'Civilian' };
      case 'volunteer':
        return { color: 'bg-emerald-100 text-emerald-700', label: 'Volunteer' };
      case 'rescue-team':
        return { color: 'bg-red-100 text-red-700', label: 'Rescue Team' };
      default:
        return { color: 'bg-slate-100 text-slate-700', label: 'User' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-slate-800 animate-spin" />
      </div>
    );
  }

  const badge = getRoleBadge();

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
          {/* Cover Area */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-900 h-40 md:h-48 relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </div>

          <div className="px-6 md:px-10 pb-10">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-24 mb-10">
              <div className="relative inline-block mx-auto md:mx-0">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] border-[6px] border-white shadow-2xl flex items-center justify-center overflow-hidden">
                  <User className="w-16 h-16 md:w-20 md:h-20 text-slate-200" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-600 rounded-2xl p-3 shadow-xl border-4 border-white">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{profile.full_name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                      <span className={`px-4 py-1 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="px-4 py-1 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-500 shadow-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Joined {new Date(profile.join_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                  <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Info */}
              <div className="lg:col-span-7 space-y-8">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Personal Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon: Mail, label: 'Email', value: profile.email, color: 'text-blue-500' },
                      { icon: Phone, label: 'Phone', value: profile.phone, color: 'text-emerald-500' },
                      { icon: MapPin, label: 'Location', value: profile.location, color: 'text-orange-500' },
                      { icon: Shield, label: 'ID Verified', value: 'Active', color: 'text-red-500' }
                    ].map((item, i) => (
                      <div key={i} className="group p-5 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform ${item.color}`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                            <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{item.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Emergency Contacts</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] text-center group hover:bg-red-600 transition-all duration-300">
                      <Phone className="w-6 h-6 text-red-600 mx-auto mb-3 group-hover:text-white transition-colors" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400 group-hover:text-red-100">Rescue</p>
                      <p className="text-2xl font-black text-slate-900 group-hover:text-white tracking-tighter">911</p>
                    </div>
                    <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] text-center group hover:bg-orange-600 transition-all duration-300">
                      <Shield className="w-6 h-6 text-orange-600 mx-auto mb-3 group-hover:text-white transition-colors" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 group-hover:text-orange-100">Hotline</p>
                      <p className="text-lg font-black text-slate-900 group-hover:text-white tracking-tighter uppercase">1-800</p>
                    </div>
                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] text-center group hover:bg-blue-600 transition-all duration-300">
                      <Mail className="w-6 h-6 text-blue-600 mx-auto mb-3 group-hover:text-white transition-colors" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-100">Support</p>
                      <p className="text-xs font-black text-slate-900 group-hover:text-white truncate uppercase tracking-tighter">Help Desk</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Stats */}
              <div className="lg:col-span-5 space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Your Impact</h2>
                {profile.dynamicStats.map((stat: any, index: number) => (
                  <div key={index} className="relative group overflow-hidden p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
                      {stat.icon}
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                        <p className="text-5xl font-black text-slate-900 italic tracking-tighter">{stat.value}</p>
                      </div>
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                        {stat.icon}
                      </div>
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

