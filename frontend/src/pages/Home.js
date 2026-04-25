import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    activeTickets: 0
  });

  useEffect(() => {
    // Load user from localStorage (same as Login.js)
    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/dashboard/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const quickActions = [
    { 
      title: 'Book a Resource', 
      icon: '📅', 
      link: '/bookings/new', 
      color: 'bg-yellow-500',
      description: 'Reserve a room or equipment'
    },
    { 
      title: 'View My Bookings', 
      icon: '📋', 
      link: '/bookings/my', 
      color: 'bg-blue-500',
      description: 'Check your scheduled bookings'
    },
    { 
      title: 'Create Ticket', 
      icon: '🎫', 
      link: '/tickets/new', 
      color: 'bg-green-500',
      description: 'Report an issue or request'
    },
    { 
      title: 'Browse Facilities', 
      icon: '🏛️', 
      link: '/facilities', 
      color: 'bg-purple-500',
      description: 'Explore campus resources'
    },
  ];

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name || 'User'}! 👋
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your campus resources today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalBookings}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingBookings}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.approvedBookings}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Tickets</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.activeTickets}</p>
              </div>
              <div className="text-4xl">🎫</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h4 className="font-bold text-gray-800 mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Bookings</h3>
              <Link to="/bookings/my" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Physics Lab</p>
                  <p className="text-sm text-gray-600">Today, 2:00 PM - 4:00 PM</p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Study Room A</p>
                  <p className="text-sm text-gray-600">Tomorrow, 10:00 AM - 12:00 PM</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Approved
                </span>
              </div>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Tickets</h3>
              <Link to="/tickets" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Projector not working</p>
                  <p className="text-sm text-gray-600">Room E201</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Open
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">AC Maintenance</p>
                  <p className="text-sm text-gray-600">Lecture Hall 1</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Resolved
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;