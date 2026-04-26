import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

const Sidebar = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState(location.pathname);

  // Menu items based on role
  const getMenuItems = () => {
    const commonItems = [
      { path: '/home', label: 'Dashboard', icon: '📊' },
      { path: '/facilities', label: 'Facilities', icon: '🏛️' },
      { path: '/bookings/my', label: 'My Bookings', icon: '📅' },
      { path: '/tickets', label: 'My Tickets', icon: '🎫' },
      { path: '/notifications', label: 'Notifications', icon: '🔔' },
      { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    const studentItems = [
      ...commonItems,
      { path: '/courses', label: 'My Courses', icon: '📚' },
    ];

    const lecturerItems = [
      ...commonItems,
      { path: '/schedule', label: 'My Schedule', icon: '📆' },
      { path: '/students', label: 'Students', icon: '👨‍' },
    ];

    const managerItems = [
      ...commonItems,
      { path: '/resources', label: 'Resource Management', icon: '🔧' },
      { path: '/reports', label: 'Reports', icon: '📈' },
      { path: '/staff', label: 'Staff', icon: '👥' },
    ];

    switch (userRole) {
      case 'STUDENT':
        return studentItems;
      case 'LECTURER':
        return lecturerItems;
      case 'MANAGER':
        return managerItems;
      default:
        return commonItems;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-black text-white flex flex-col shadow-2xl">
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-yellow-500 bg-black">
        <div className="flex items-center gap-2">
          <div className="text-yellow-400 text-2xl font-bold">NEXUS</div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
            {userRole?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {userRole || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {userRole?.toLowerCase() || 'user'}@metrouni.edu.lk
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {getMenuItems().map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setActiveMenu(item.path)}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-yellow-500 text-black font-semibold border-r-4 border-yellow-300'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900 hover:text-white rounded-lg transition-all duration-200"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;