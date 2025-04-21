
import { FileText, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/context/UserDataContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    dashboardStats, 
    schedules, 
    refreshStats, 
    isLoading, 
    credentials,
    error
  } = useUserData();
  const navigate = useNavigate();
  
  // Refresh stats when dashboard is mounted
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);
  
  // Filter upcoming schedules
  const upcomingSchedules = schedules
    .filter(s => s.status === 'pending' && new Date(s.scheduledDate) > new Date())
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);
  
  // Filter failed schedules
  const failedSchedules = schedules
    .filter(s => s.status === 'failed')
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 5);

  // Check if credentials are set up
  const needsSetup = !credentials || 
    !credentials.wordpressSiteUrl || 
    !credentials.wordpressUsername || 
    !credentials.wordpressAppPassword || 
    !credentials.geminiApiKey;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || user?.email.split('@')[0]}
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/scheduling')}
          className="bg-primary hover:bg-primary/90"
        >
          Schedule New Posts
        </Button>
      </div>
      
      {needsSetup && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-yellow-500 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-700">Account Setup Required</h3>
                <p className="text-yellow-600 text-sm mt-1">
                  Please complete your account setup to connect your WordPress site and Gemini API.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => navigate('/account')}
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Total Posts"
          value={dashboardStats.totalPosts}
          icon={<FileText className="h-4 w-4 text-primary" />}
          description="Published on your WordPress site"
        />
        
        <StatCard
          title="Total Views"
          value={dashboardStats.totalViews}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          description="Across all your blog posts"
        />
        
        <StatCard
          title="Scheduled Posts"
          value={dashboardStats.upcomingSchedules}
          icon={<Calendar className="h-4 w-4 text-primary" />}
          description="Posts waiting to be published"
        />
        
        <StatCard
          title="Failed Posts"
          value={dashboardStats.failedPosts}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          description="Posts that failed to publish"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{schedule.topics[0]}</p>
                      {schedule.topics.length > 1 && (
                        <p className="text-sm text-muted-foreground">
                          +{schedule.topics.length - 1} more topics
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(schedule.scheduledDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(schedule.scheduledDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No upcoming scheduled posts</p>
                <Button
                  variant="link"
                  onClick={() => navigate('/scheduling')}
                  className="mt-2"
                >
                  Schedule a new post
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Failed Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Failed Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {failedSchedules.length > 0 ? (
              <div className="space-y-4">
                {failedSchedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{schedule.topics[0]}</p>
                      <p className="text-sm text-red-500">
                        {schedule.error || 'Failed to publish'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(schedule.scheduledDate).toLocaleDateString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 h-7 text-xs"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No failed posts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
