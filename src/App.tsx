import { useState, useCallback, useEffect } from 'react';
import { UserRole } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import TasksPage from './components/TasksPage';
import ProfilePage from './components/ProfilePage';
import SOSDetailPage from './components/SOSDetailPage';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import VolunteerApplication from './components/VolunteerApplication';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setUserRole(null);
        setCurrentPage('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile from profiles table:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setUserRole(data.role as UserRole);
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    }
  };

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const handleNavigate = useCallback((page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  if (!session) {
    return (
      <>
        <LandingPage onRoleSelect={() => setShowAuthModal(true)} />
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  const renderPage = () => {
    // Check if volunteer is pending approval
    if (userRole === 'volunteer' && profile?.status === 'pending') {
      return <VolunteerApplication profile={profile} onComplete={() => fetchProfile(session.user.id)} />;
    }

    // Admin view
    if (userRole === 'admin') {
      return <AdminDashboard onNavigate={handleNavigate} />;
    }

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
        userRole={userRole}
      />
      
      <main className="animate-in fade-in duration-500">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

