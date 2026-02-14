import { useState, useCallback } from 'react';
import { UserRole } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import TasksPage from './components/TasksPage';
import ProfilePage from './components/ProfilePage';
import SOSDetailPage from './components/SOSDetailPage';
import Navigation from './components/Navigation';

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentPage, setCurrentPage] = useState('home');

  const handleRoleSelect = useCallback((role: UserRole) => {
    setUserRole(role);
    setCurrentPage('home');
  }, []);

  const handleLogout = useCallback(() => {
    setUserRole(null);
    setCurrentPage('home');
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  if (!userRole) {
    return <LandingPage onRoleSelect={handleRoleSelect} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Dashboard userRole={userRole} onNavigate={handleNavigate} />;
      case 'map':
        return <MapView onNavigate={handleNavigate} />;
      case 'tasks':
        return <TasksPage />;
      case 'profile':
        return <ProfilePage userRole={userRole} />;
      case 'sos-detail':
        return <SOSDetailPage onNavigate={handleNavigate} />;
      default:
        return <Dashboard userRole={userRole} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-red-100 selection:text-red-900">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      
      <main className="animate-in fade-in duration-500">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

