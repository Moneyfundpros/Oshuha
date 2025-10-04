import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, GraduationCap, UserCheck, TrendingUp } from 'lucide-react';

interface Analytics {
  totalUsers: number;
  students: number;
  supervisors: number;
  coordinators: number;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    students: 0,
    supervisors: 0,
    coordinators: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      const students = users.filter(u => u.role === 'student').length;
      const supervisors = users.filter(u => u.role === 'supervisor').length;
      const coordinators = users.filter(u => u.role === 'coordinator').length;

      setAnalytics({
        totalUsers: users.length,
        students,
        supervisors,
        coordinators,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const getPercentage = (value: number) => {
    return analytics.totalUsers > 0 ? (value / analytics.totalUsers) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Analytics Overview</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold mt-2">{analytics.totalUsers}</p>
            </div>
            <Users className="h-12 w-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Students</p>
              <p className="text-3xl font-bold mt-2 text-blue-500">{analytics.students}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPercentage(analytics.students).toFixed(1)}% of total
              </p>
            </div>
            <GraduationCap className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Supervisors</p>
              <p className="text-3xl font-bold mt-2 text-green-500">{analytics.supervisors}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPercentage(analytics.supervisors).toFixed(1)}% of total
              </p>
            </div>
            <UserCheck className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coordinators</p>
              <p className="text-3xl font-bold mt-2 text-red-500">{analytics.coordinators}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPercentage(analytics.coordinators).toFixed(1)}% of total
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6">User Distribution</h3>
        <div className="relative flex items-center justify-center">
          <svg className="w-64 h-64" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="40"
            />
            
            {/* Students - Blue */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="40"
              strokeDasharray={`${(getPercentage(analytics.students) / 100) * 502.65} 502.65`}
              strokeDashoffset="0"
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000"
            />
            
            {/* Supervisors - Green */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#22c55e"
              strokeWidth="40"
              strokeDasharray={`${(getPercentage(analytics.supervisors) / 100) * 502.65} 502.65`}
              strokeDashoffset={`-${(getPercentage(analytics.students) / 100) * 502.65}`}
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000"
            />
            
            {/* Coordinators - Red */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#ef4444"
              strokeWidth="40"
              strokeDasharray={`${(getPercentage(analytics.coordinators) / 100) * 502.65} 502.65`}
              strokeDashoffset={`-${((getPercentage(analytics.students) + getPercentage(analytics.supervisors)) / 100) * 502.65}`}
              transform="rotate(-90 100 100)"
              className="transition-all duration-1000"
            />
            
            <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-current">
              {analytics.totalUsers}
            </text>
            <text x="100" y="115" textAnchor="middle" className="text-sm fill-current opacity-60">
              Total Users
            </text>
          </svg>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">Students</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{analytics.students}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Supervisors</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{analytics.supervisors}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium">Coordinators</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{analytics.coordinators}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
