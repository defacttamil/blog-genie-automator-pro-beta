
// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// WordPress Types
export interface WordPressPost {
  id: number;
  date: string;
  title: {
    rendered: string;
  };
  status: string;
  link: string;
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
  view_count?: number;
}

export interface WordPressStats {
  totalPosts: number;
  totalViews: number;
}

// Credentials Types
export interface UserCredentials {
  wordpressSiteUrl: string;
  wordpressUsername: string;
  wordpressAppPassword: string;
  geminiApiKey: string;
  local_timezone?: string;
}

// Days of the week for scheduling options
export type Weekday = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

// Schedule Types
export interface PostSchedule {
  id: string;
  user_id: string;
  topics: string[];
  time: string; // in "HH:mm" format (e.g. "09:00")
  days: Weekday[]; // e.g. ["Monday", "Wednesday", "Friday"]
  scheduled_at: string; // original creation or next post time (UTC ISO string)
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  local_timezone?: string;
  created_at?: string;
  updated_at?: string;
}

// Extend the Supabase database types to add missing fields to post_schedules
declare module '@/integrations/supabase/types' {
  interface Tables {
    post_schedules: {
      Row: {
        time?: string;
        days?: Weekday[];
      }
    }
  }
}

export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  upcomingSchedules: number;
  failedPosts: number;
}
