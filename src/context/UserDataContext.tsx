
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserCredentials, PostSchedule, DashboardStats } from '@/types';
import { useAuth } from './AuthContext';
import { WordPressClient } from '@/lib/wordpress';
import { GeminiClient } from '@/lib/gemini';
import { startSimulator, stopSimulator } from '@/lib/simulator';

interface UserDataContextType {
  credentials: UserCredentials | null;
  schedules: PostSchedule[];
  dashboardStats: DashboardStats;
  wordpressClient: WordPressClient | null;
  geminiClient: GeminiClient | null;
  isLoading: boolean;
  error: string | null;
  updateCredentials: (credentials: UserCredentials) => void;
  createSchedule: (topics: string[], scheduledDate: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// Storage keys
const CREDENTIALS_KEY = 'blog_genie_credentials_';
const SCHEDULES_KEY = 'blog_genie_schedules_';

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
      
      // Load schedules
      const storedSchedules = localStorage.getItem(`${SCHEDULES_KEY}${userId}`);
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
      setIsLoading(false);
    }
  };

  // Update user credentials
  const updateCredentials = (newCredentials: UserCredentials) => {
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

  // Create a new post schedule
  const createSchedule = async (topics: string[], scheduledDate: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const newSchedule: PostSchedule = {
        id: Date.now().toString(),
        userId: user.id,
        topics,
        scheduledDate,
        status: 'pending',
      };
      
      const updatedSchedules = [...schedules, newSchedule];
      localStorage.setItem(`${SCHEDULES_KEY}${user.id}`, JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);
      
      // Update dashboard stats
      await refreshStats();
      
      return true;
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError('Failed to create schedule');
      return false;
    }
  };

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
      const upcoming = schedules.filter(s => 
        s.status === 'pending' && new Date(s.scheduledDate) > now
      ).length;
      
      // Count failed posts
      const failed = schedules.filter(s => s.status === 'failed').length;
      
      setDashboardStats({
        totalPosts: wpStats.totalPosts,
        totalViews: wpStats.totalViews,
        upcomingSchedules: upcoming,
        failedPosts: failed,
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
