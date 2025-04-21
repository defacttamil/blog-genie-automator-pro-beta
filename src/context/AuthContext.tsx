
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user storage - in a real app, this would be handled by a backend
const USERS_STORAGE_KEY = 'blog_genie_users';
const CURRENT_USER_KEY = 'blog_genie_current_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  // Initialize - check for logged in user
  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        setState({
          user: JSON.parse(storedUser),
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(CURRENT_USER_KEY);
        setState({ user: null, isLoading: false, error: null });
      }
    } else {
      setState({ user: null, isLoading: false, error: null });
    }
  }, []);

  // Register a new user
  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    setState({ ...state, isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      const existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      // Check if user exists
      if (existingUsers.some((u: any) => u.email === email)) {
        setState({ ...state, isLoading: false, error: 'User already exists' });
        return false;
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
      };
      
      // Store user with password (in a real app, password would be hashed and stored on server)
      const updatedUsers = [...existingUsers, { ...newUser, password }];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      // Log in the user
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      setState({ user: newUser, isLoading: false, error: null });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setState({ ...state, isLoading: false, error: 'Registration failed' });
      return false;
    }
  };

  // Log in an existing user
  const login = async (email: string, password: string): Promise<boolean> => {
    setState({ ...state, isLoading: true, error: null });
    
    try {
      // In a real app, this would be an API call
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        // Store user without password
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
        setState({ user: userWithoutPassword, isLoading: false, error: null });
        return true;
      } else {
        setState({ ...state, isLoading: false, error: 'Invalid email or password' });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState({ ...state, isLoading: false, error: 'Login failed' });
      return false;
    }
  };

  // Log out the current user
  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setState({ user: null, isLoading: false, error: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
