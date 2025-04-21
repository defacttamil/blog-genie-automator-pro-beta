
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
}

// Schedule Types
export interface PostSchedule {
  id: string;
  userId: string;
  topics: string[];
  scheduledDate: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  upcomingSchedules: number;
  failedPosts: number;
}
