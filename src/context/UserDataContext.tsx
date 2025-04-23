import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserCredentials, PostSchedule, DashboardStats, Weekday } from '@/types';
import { useAuth } from './AuthContext';
import { WordPressClient } from '@/lib/wordpress';
import { GeminiClient } from '@/lib/gemini';
import { startSimulator, stopSimulator, createSchedule as createScheduleInSimulator } from '@/lib/simulator';
import { getUserTimezone } from '@/utils/timezone';
import { supabase } from '@/integrations/supabase/client';

interface UserDataContextType {
  credentials: UserCredentials | null;
  schedules: PostSchedule[];
  dashboardStats: DashboardStats;
  wordpressClient: WordPressClient | null;
  geminiClient: GeminiClient | null;
  isLoading: boolean;
  error: string | null;
  updateCredentials: (credentials: UserCredentials & { local_timezone?: string }) => void;
  createSchedule: (topics: string[], time: string, days: Weekday[]) => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// Storage keys
const CREDENTIALS_KEY = 'blog_genie_credentials_';

const initialStats: DashboardStats = {
  totalPosts: 0,
  totalViews: 0,
  upcomingSchedules: 0,
  failedPosts: 0,
};

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<UserCredentials | null>(null);
  const [schedules, setSchedules] = useState<PostSchedule[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(initialStats);
  const [wordpressClient, setWordpressClient] = useState<WordPressClient | null>(null);
  const [geminiClient, setGeminiClient] = useState<GeminiClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    } else {
      // Reset data when user logs out
      setCredentials(null);
      setSchedules([]);
      setDashboardStats(initialStats);
      setWordpressClient(null);
      setGeminiClient(null);
      setIsLoading(false);
      setError(null);
    }
  }, [user]);

  // Initialize API clients when credentials change
  useEffect(() => {
    if (credentials && user) {
      const wp = new WordPressClient(
        credentials.wordpressSiteUrl,
        credentials.wordpressUsername,
        credentials.wordpressAppPassword
      );
      setWordpressClient(wp);
      
      const gemini = new GeminiClient(credentials.geminiApiKey);
      setGeminiClient(gemini);
      
      // Start the simulator
      startSimulator(user.id, credentials);
      
      // Refresh stats when clients are ready
      refreshStats();
    } else {
      setWordpressClient(null);
      setGeminiClient(null);
      stopSimulator();
    }
    
    // Clean up simulator when component unmounts
    return () => {
      stopSimulator();
    };
  }, [credentials, user]);

  // Load user's stored data
  const loadUserData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load credentials
      const storedCredentials = localStorage.getItem(`${CREDENTIALS_KEY}${userId}`);
      if (storedCredentials) {
        setCredentials(JSON.parse(storedCredentials));
      }
      
      // Load schedules from Supabase
      const { data: supabaseSchedules, error } = await supabase
        .from('post_schedules')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      if (supabaseSchedules) {
        setSchedules(supabaseSchedules.map(mapScheduleRow));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
      setIsLoading(false);
    }
  };

  // Update user credentials with local_timezone (comes from Account page)
  const updateCredentials = (newCredentials: UserCredentials & { local_timezone?: string }) => {
    if (!user) return;
    try {
      localStorage.setItem(`${CREDENTIALS_KEY}${user.id}`, JSON.stringify(newCredentials));
      setCredentials(newCredentials);
      setError(null);
    } catch (error) {
      console.error('Error updating credentials:', error);
      setError('Failed to update credentials');
    }
  };

  // Create a new post schedule (now with day-of-week recurrence)
  const createSchedule = async (
    topics: string[],
    time: string,
    days: Weekday[]
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      // Store as a new schedule with days and time
      // (Simulator will expand/trigger as needed)
      const userTimezone = credentials?.local_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const now = new Date();
      const nextDay = getNextScheduleDayUtc(days, time, userTimezone);

      // Insert one schedule row (topics, days, time, timezone, status=pending)
      const { error } = await supabase.from('post_schedules').insert({
        user_id: user.id,
        topics,
        time,
        days,
        scheduled_at: nextDay.toISOString(), // next occurence in UTC
        local_timezone: userTimezone,
        status: 'pending',
      });
      if (error) throw error;
      // Refresh schedules
      const { data: updatedSchedules } = await supabase
        .from('post_schedules')
        .select('*')
        .eq('user_id', user.id);
      if (updatedSchedules) {
        setSchedules(updatedSchedules.map(mapScheduleRow));
      }
      await refreshStats();
      return true;
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError('Failed to create schedule');
      return false;
    }
  };

  // Helper for finding the next scheduled day/time in UTC
  function getNextScheduleDayUtc(days: Weekday[], time: string, tz: string): Date {
    // Find next date from now for any of the chosen days and the given time, in the user's timezone
    const localNow = new Date();
    let soonest: Date | null = null;
    for (let addDays = 0; addDays < 7; addDays++) {
      const d = new Date(localNow);
      d.setDate(d.getDate() + addDays);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: tz }) as Weekday;
      if (days.includes(weekday)) {
        // set to desired hour/minute
        const [h, m] = time.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        const inTz = new Date(d.toLocaleString('en-US', { timeZone: tz }));
        if (inTz > localNow && (!soonest || inTz < soonest)) {
          soonest = inTz;
        }
      }
    }
    // Convert to UTC
    return soonest || localNow;
  }

  // Ensure Supabase schedule row → PostSchedule with correct field types
  function mapScheduleRow(row: any): PostSchedule {
    return {
      id: row.id,
      user_id: row.user_id,
      topics: row.topics,
      time: row.time,
      days: row.days,
      scheduled_at: row.scheduled_at,
      status: (row.status === 'pending' || row.status === 'completed' || row.status === 'failed')
        ? row.status
        : 'pending',
      error: row.error,
      local_timezone: row.local_timezone,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // Refresh dashboard stats
  const refreshStats = async () => {
    if (!user || !wordpressClient) {
      setDashboardStats(initialStats);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get WordPress stats
      const wpStats = await wordpressClient.getStats();
      
      // Count upcoming schedules
      const now = new Date();
      
      // Get counts from Supabase
      const { count: upcomingCount } = await supabase
        .from('post_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gt('scheduled_at', now.toISOString());
        
      const { count: failedCount } = await supabase
        .from('post_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'failed');
      
      setDashboardStats({
        totalPosts: wpStats.totalPosts,
        totalViews: wpStats.totalViews,
        upcomingSchedules: upcomingCount || 0,
        failedPosts: failedCount || 0,
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error refreshing stats:', error);
      setError('Failed to refresh stats');
      setIsLoading(false);
    }
  };

  return (
    <UserDataContext.Provider
      value={{
        credentials,
        schedules,
        dashboardStats,
        wordpressClient,
        geminiClient,
        isLoading,
        error,
        updateCredentials,
        createSchedule,
        refreshStats,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
