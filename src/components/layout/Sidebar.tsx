
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  const { user, logout } = useAuth();
  
  return (
    <aside className="bg-white w-64 h-full shadow-md">
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-primary">Blog Genie</h1>
        <p className="text-sm text-muted-foreground">Automation Pro</p>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink
              to="/posts"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <FileText size={20} />
              <span>Posts</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink
              to="/scheduling"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Calendar size={20} />
              <span>Scheduling</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <User size={20} />
              <span>Account</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-64 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            {user?.name ? user.name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium truncate">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={logout}
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </Button>
      </div>
    </aside>
  );
}
