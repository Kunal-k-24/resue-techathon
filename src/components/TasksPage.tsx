import { useState } from 'react';
import { MapPin, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { mockTasks } from '../data/mockData';
import { Task, TaskStatus } from '../types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5" />;
      case 'in-progress':
        return <Loader className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-500';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-500';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-500';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'urgent':
        return 'bg-red-600 text-white';
      case 'in-progress':
        return 'bg-blue-600 text-white';
      case 'completed':
        return 'bg-green-600 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-green-600';
    }
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(task => task.status === filter);

  const taskCounts = {
    all: tasks.length,
    urgent: tasks.filter(t => t.status === 'urgent').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Tasks</h1>
          <p className="text-gray-600">
            View available missions and update task status
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Tasks ({taskCounts.all})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'urgent'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Urgent ({taskCounts.urgent})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'in-progress'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            In Progress ({taskCounts['in-progress']})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completed ({taskCounts.completed})
          </button>
        </div>

        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
                task.status === 'urgent' ? 'border-red-500' :
                task.status === 'in-progress' ? 'border-blue-500' :
                'border-green-500'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                        {task.status === 'in-progress' ? 'IN PROGRESS' : task.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{task.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()} Priority
                        </span>
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <CheckCircle className="w-4 h-4" />
                          <span>Assigned to {task.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  {task.status === 'urgent' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'in-progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Start Task
                    </button>
                  )}
                  {task.status === 'in-progress' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Task Completed</span>
                    </div>
                  )}
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              There are no tasks matching the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
