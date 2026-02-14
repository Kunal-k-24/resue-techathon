import { useState } from 'react';
import { MapPin, Clock, CheckCircle, Info, Loader2, ArrowRight, Filter, Search } from 'lucide-react';
import { mockTasks } from '../data/mockData';
import { Task, TaskStatus } from '../types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const taskCounts = {
    all: tasks.length,
    urgent: tasks.filter(t => t.status === 'urgent').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Area */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Missions</h1>
          <p className="text-slate-500 font-medium">Coordinate and manage active relief tasks in your area.</p>
        </div>

        {/* Search and Filters */}
        <div className="sticky top-20 z-30 bg-slate-50/80 backdrop-blur-md py-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none font-medium"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <Filter className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
              {(['all', 'urgent', 'in-progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                    filter === s
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${
                    filter === s ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {taskCounts[s as keyof typeof taskCounts]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="group bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                  task.status === 'urgent' ? 'bg-red-100 text-red-600' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {task.status}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${
                  task.priority === 'high' ? 'text-red-500' : 
                  task.priority === 'medium' ? 'text-orange-500' : 'text-emerald-500'
                }`}>
                  {task.priority} Priority
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-red-600 transition-colors">
                {task.title}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3">
                {task.description}
              </p>

              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                  <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  {task.location}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                  Last updated: 5 mins ago
                </div>
              </div>

              <div className="flex items-center gap-3">
                {task.status === 'urgent' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'in-progress')}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Accept Mission <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {task.status === 'in-progress' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'completed')}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    Mark Complete <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {task.status === 'completed' && (
                  <div className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Finished
                  </div>
                )}
                <button className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Scanning for Missions...</h3>
            <p className="text-slate-500 font-medium">No active tasks match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

