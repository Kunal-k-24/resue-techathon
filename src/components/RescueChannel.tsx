import { useState, useEffect, useRef } from 'react';
import { 
  Send, MapPin, Users, AlertTriangle, X, UserPlus, UserMinus, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  type: 'text' | 'update' | 'location';
  created_at: string;
  metadata?: any;
}

interface RescueChannelProps {
  incidentId: string;
  currentUser: any;
  onClose?: () => void;
  onSelectIncident?: (id: string) => void;
}

export default function RescueChannel({ incidentId, currentUser, onClose, onSelectIncident }: RescueChannelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [incident, setIncident] = useState<any>(null);
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [assignedVolunteers, setAssignedVolunteers] = useState<any[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
  const [showAddVolunteer, setShowAddVolunteer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllIncidents();
  }, []);

  useEffect(() => {
    if (incidentId) {
      fetchIncidentDetails();
      fetchMessages();
      fetchVolunteers();
      subscribeToMessages();
      subscribeToIncident();
    }
    
    // Auto-scroll to bottom
    scrollToBottom();
  }, [incidentId]);

  const fetchAllIncidents = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });
    setAllIncidents(data || []);
  };

  const fetchVolunteers = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'volunteer');
    setAllVolunteers(data || []);
  };

  const subscribeToIncident = () => {
    const channel = supabase
      .channel(`incident-update-${incidentId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'incidents',
        filter: `id=eq.${incidentId}`
      }, () => {
        fetchIncidentDetails();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchIncidentDetails = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('*, profiles:assigned_volunteer_id(full_name)')
      .eq('id', incidentId)
      .single();
    
    if (data) {
      setIncident(data);
      // Fetch all tasks for this incident to get assigned volunteers
      const { data: tasks } = await supabase
        .from('tasks')
        .select('assigned_to, profiles(id, full_name, status)')
        .eq('incident_id', incidentId);
      
      if (tasks) {
        const volunteers = tasks
          .filter(t => t.profiles)
          .map(t => t.profiles as any);
        // De-duplicate just in case
        const uniqueVols = Array.from(new Map(volunteers.map(v => [v.id, v])).values());
        setAssignedVolunteers(uniqueVols);
      }
    }
  };

  const addVolunteer = async (volunteerId: string) => {
    if (!incident) return;
    
    const { error } = await supabase.from('tasks').insert([{
      incident_id: incidentId,
      assigned_to: volunteerId,
      title: `Reinforcement: ${incident.type.toUpperCase()}`,
      description: `Assigned as additional support for ${incident.type} at ${incident.location_name}`,
      location: incident.location_name,
      priority: 'high',
      status: 'in-progress'
    }]);

    if (!error) {
      await sendQuickUpdate(`System: ${allVolunteers.find(v => v.id === volunteerId)?.full_name} has joined the rescue team.`);
      fetchIncidentDetails();
    }
  };

  const removeVolunteer = async (volunteerId: string) => {
    if (!confirm('Are you sure you want to remove this volunteer from the mission?')) return;
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('incident_id', incidentId)
      .eq('assigned_to', volunteerId);

    if (!error) {
      await sendQuickUpdate(`System: ${assignedVolunteers.find(v => v.id === volunteerId)?.full_name} has been removed from the mission.`);
      fetchIncidentDetails();
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('rescue_messages')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  const subscribeToMessages = () => {
    console.log('Subscribing to messages for incident:', incidentId);
    const channel = supabase
      .channel(`rescue-messages-${incidentId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'rescue_messages',
        filter: `incident_id=eq.${incidentId}`
      }, (payload) => {
        console.log('New message received via realtime:', payload);
        const newMessage = payload.new as Message;
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up message subscription');
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = crypto.randomUUID();
    const messageData = {
      id: tempId,
      incident_id: incidentId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'User',
      content: newMessage,
      type: 'text' as const,
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    const { error } = await supabase.from('rescue_messages').insert([{
      incident_id: incidentId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'User',
      content: newMessage,
      type: 'text'
    }]);

    if (error) {
      console.error('Error sending message:', error);
      // Rollback optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const sendQuickUpdate = async (update: string) => {
    const tempId = crypto.randomUUID();
    const messageData = {
      id: tempId,
      incident_id: incidentId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'User',
      content: update,
      type: 'update' as const,
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    setMessages(prev => [...prev, messageData]);

    const { error } = await supabase.from('rescue_messages').insert([{
      incident_id: incidentId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'User',
      content: update,
      type: 'update'
    }]);

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const messageData = {
        incident_id: incidentId,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || 'User',
        content: `My current location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        type: 'location',
        metadata: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
      };
      await supabase.from('rescue_messages').insert([messageData]);
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl">
      {/* Header */}
      <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Rescue Team Channel</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Mission Active: {incident?.type?.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Session List */}
        <div className="w-72 bg-white border-r border-slate-50 hidden lg:flex flex-col p-6 overflow-y-auto">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 ml-1">Rescue Sessions</h4>
          <div className="space-y-3">
            {allIncidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => onSelectIncident?.(inc.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all group ${
                  incidentId === inc.id 
                    ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' 
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">
                    {inc.type === 'fire' ? '🔥' : inc.type === 'flood' ? '🌊' : inc.type === 'earthquake' ? '🏘️' : inc.type === 'medical' ? '🚑' : inc.type === 'sos' ? '🆘' : '❓'}
                  </span>
                  <p className={`text-[10px] font-black uppercase tracking-widest truncate ${
                    incidentId === inc.id ? 'text-white' : 'text-slate-900'
                  }`}>
                    {inc.type} Mission
                  </p>
                </div>
                <p className={`text-[8px] font-bold uppercase tracking-[0.2em] mb-2 truncate ${
                  incidentId === inc.id ? 'text-white/40' : 'text-slate-400'
                }`}>
                  {inc.location_name}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest ${
                    inc.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                    inc.status === 'responding' ? 'bg-blue-100 text-blue-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {inc.status}
                  </span>
                  <span className={`text-[7px] font-bold ${
                    incidentId === inc.id ? 'text-white/20' : 'text-slate-300'
                  }`}>
                    {new Date(inc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100">
          {!incidentId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest text-xs">Select a rescue session to start coordinating</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender_id === currentUser.id ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[80%] rounded-[1.5rem] p-4 ${
                  msg.type === 'update' ? 'bg-amber-100 border border-amber-200 text-amber-900 italic text-center w-full max-w-full' :
                  msg.type === 'location' ? 'bg-blue-600 text-white' :
                  msg.sender_id === currentUser.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                }`}>
                  {msg.type !== 'update' && (
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${
                        msg.sender_id === currentUser.id ? 'text-white/50' : 'text-slate-400'
                      }`}>
                        {msg.sender_name}
                      </span>
                      <span className={`text-[8px] font-bold ${
                        msg.sender_id === currentUser.id ? 'text-white/30' : 'text-slate-300'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  {msg.type === 'location' ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <p className="text-sm font-bold tracking-tight">{msg.content}</p>
                      </div>
                      <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        View on Map
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium leading-relaxed tracking-tight">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <button 
                    type="button"
                    onClick={shareLocation}
                    className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all shrink-0"
                    title="Share Location"
                  >
                    <MapPin className="w-6 h-6" />
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type updates or coordination messages..."
                      className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 transition-all"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-2 bottom-2 px-4 bg-slate-900 text-white rounded-xl hover:bg-black transition-all active:scale-95"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar: Team/Info */}
        {incidentId && (
          <div className="w-80 bg-white border-l border-slate-50 hidden xl:flex flex-col p-6 overflow-y-auto">
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Team</h4>
                <button 
                  onClick={() => setShowAddVolunteer(!showAddVolunteer)}
                  className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all"
                  title="Add Volunteer"
                >
                  <UserPlus className="w-3 h-3" />
                </button>
              </div>

              {showAddVolunteer && (
                <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Available Personnel</span>
                    <button onClick={() => setShowAddVolunteer(false)}><X className="w-3 h-3 text-slate-400" /></button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {allVolunteers
                      .filter(v => !assignedVolunteers.find(av => av.id === v.id))
                      .map(v => (
                        <button 
                          key={v.id}
                          onClick={() => addVolunteer(v.id)}
                          className="w-full p-2 text-left bg-white border border-slate-100 rounded-xl hover:border-blue-300 transition-all flex items-center justify-between group"
                        >
                          <span className="text-[10px] font-bold text-slate-700">{v.full_name}</span>
                          <UserPlus className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {assignedVolunteers.map(vol => (
                  <div key={vol.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">{vol.full_name}</p>
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">{vol.status || 'Active'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeVolunteer(vol.id)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {assignedVolunteers.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No team members assigned yet.</p>
                )}
              </div>
            </section>

            <section className="mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Incident Intel</h4>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-xs font-bold text-red-900 italic leading-relaxed">
                  "{incident?.description}"
                </p>
                <div className="mt-4 pt-4 border-t border-red-100 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">{incident?.location_name}</span>
                </div>
              </div>
            </section>

            <section className="mt-auto">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => sendQuickUpdate("Status: Arrived at location")}
                  className="p-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  Arrived
                </button>
                <button 
                  onClick={() => sendQuickUpdate("Status: Starting rescue")}
                  className="p-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all"
                >
                  Starting
                </button>
                <button 
                  onClick={() => sendQuickUpdate("Need Backup!")}
                  className="p-3 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition-all col-span-2"
                >
                  Need Backup
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
