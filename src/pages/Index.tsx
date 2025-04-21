
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Redirect to appropriate page based on auth status
export default function Index() {
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    document.title = 'Blog Genie Automator Pro';
  }, []);
  
  if (isLoading) {
    // Show loading state
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <h1 className="text-xl font-medium text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }
  
  // Redirect based on auth status
  if (user) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
}
