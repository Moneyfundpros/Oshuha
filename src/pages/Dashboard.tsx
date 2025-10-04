import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader as Loader2 } from 'lucide-react';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import SupervisorDashboard from '@/components/dashboard/SupervisorDashboard';
import CoordinatorDashboard from '@/components/dashboard/CoordinatorDashboard';

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  console.log('[Dashboard] Render:', { user: user?.email, userRole, loading });

  useEffect(() => {
    console.log('[Dashboard] useEffect triggered:', { user: user?.email, userRole, loading });
    if (!loading && !user) {
      console.log('[Dashboard] No user, redirecting to signin');
      navigate('/signin');
    } else if (!loading && user && userRole === 'admin') {
      console.log('[Dashboard] Admin user, redirecting to admin panel');
      navigate('/admin');
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    console.log('[Dashboard] Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    console.log('[Dashboard] No user, returning null');
    return null;
  }

  if (userRole === 'admin') {
    console.log('[Dashboard] Admin role, returning null');
    return null;
  }

  console.log('[Dashboard] Rendering dashboard for role:', userRole);

  return (
    <div className="min-h-screen bg-background">
      {userRole === 'student' && <StudentDashboard />}
      {userRole === 'supervisor' && <SupervisorDashboard />}
      {userRole === 'coordinator' && <CoordinatorDashboard />}
      {!userRole && (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      )}
    </div>
  );
}
