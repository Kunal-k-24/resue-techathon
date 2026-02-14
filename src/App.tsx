import { useState } from 'react';
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

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage('home');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (!userRole) {
    return <LandingPage onRoleSelect={handleRoleSelect} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {currentPage === 'home' && (
        <Dashboard userRole={userRole} onNavigate={handleNavigate} />
      )}
      {currentPage === 'map' && <MapView onNavigate={handleNavigate} />}
      {currentPage === 'tasks' && <TasksPage />}
      {currentPage === 'profile' && <ProfilePage userRole={userRole} />}
      {currentPage === 'sos-detail' && <SOSDetailPage onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;
