import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../api/axiosClient';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for analytics data
  const [peakHours, setPeakHours] = useState({ labels: [], data: [] });
  const [peakDays, setPeakDays] = useState({ labels: [], data: [] });
  const [trends, setTrends] = useState({ labels: [], data: [] });
  const [utilization, setUtilization] = useState({ labels: [], data: [], totalHours: [] });
  const [summary, setSummary] = useState({});
  const [trendPeriod, setTrendPeriod] = useState('monthly');

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [
        hoursRes,
        daysRes,
        trendsRes,
        utilRes,
        summaryRes
      ] = await Promise.all([
        api.get('/api/admin/analytics/peak-hours'),
        api.get('/api/admin/analytics/peak-days'),
        api.get(`/api/admin/analytics/trends?period=${trendPeriod}`),
        api.get('/api/admin/analytics/utilization'),
        api.get('/api/admin/analytics/summary')
      ]);

      setPeakHours(hoursRes.data);
      setPeakDays(daysRes.data);
      setTrends(trendsRes.data);
      setUtilization(utilRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trends when period changes
  useEffect(() => {
    if (activeTab === 'trends') {
      fetchTrends();
    }
  }, [trendPeriod, activeTab]);

  const fetchTrends = async () => {
    try {
      const response = await api.get(`/api/admin/analytics/trends?period=${trendPeriod}`);
      setTrends(response.data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  // Peak Hours Chart Data
  const peakHoursData = {
    labels: peakHours.labels || [],
    datasets: [
      {
        label: 'Number of Bookings',
        data: peakHours.data || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Peak Days Chart Data
  const peakDaysData = {
    labels: peakDays.labels || [],
    datasets: [
      {
        label: 'Number of Bookings',
        data: peakDays.data || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',   // Sunday - Red
          'rgba(59, 130, 246, 0.5)',  // Monday - Blue
          'rgba(16, 185, 129, 0.5)',  // Tuesday - Green
          'rgba(245, 158, 11, 0.5)',  // Wednesday - Yellow
          'rgba(139, 92, 246, 0.5)',  // Thursday - Purple
          'rgba(236, 72, 153, 0.5)',  // Friday - Pink
          'rgba(99, 102, 241, 0.5)',  // Saturday - Indigo
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(99, 102, 241, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Trends Chart Data
  const trendsData = {
    labels: trends.labels || [],
    datasets: [
      {
        label: 'Bookings',
        data: trends.data || [],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.4,
      },
    ],
  };

  // Utilization Chart Data
  const utilizationData = {
    labels: utilization.labels || [],
    datasets: [
      {
        label: 'Utilization Rate (%)',
        data: utilization.data || [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Insights into booking patterns and resource utilization</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {['overview', 'peak-hours', 'trends', 'utilization'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Peak Hour</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.peakHour || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {summary.peakHourCount || 0} bookings
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Busiest Day</h3>
                <p className="text-3xl font-bold text-green-600">
                  {summary.peakDay || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {summary.peakDayCount || 0} bookings
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Overall Utilization</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {summary.overallUtilization || 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">This month</p>
              </div>
            </div>

            {/* Quick Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">Peak Hours Overview</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={peakHoursData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold mb-4">Peak Days Overview</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={peakDaysData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Peak Hours Tab */}
        {activeTab === 'peak-hours' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Bookings by Hour of Day</h3>
              <div style={{ height: '400px' }}>
                <Bar data={peakHoursData} options={chartOptions} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Bookings by Day of Week</h3>
              <div style={{ height: '400px' }}>
                <Bar data={peakDaysData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex gap-4">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTrendPeriod(period)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize ${
                      trendPeriod === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">
                Booking Trends ({trendPeriod.charAt(0).toUpperCase() + trendPeriod.slice(1)})
              </h3>
              <div style={{ height: '400px' }}>
                <Line data={trendsData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Utilization Tab */}
        {activeTab === 'utilization' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Resource Utilization Rate</h3>
              <p className="text-sm text-gray-600 mb-4">
                Percentage of available time each resource was booked (Last 30 days)
              </p>
              <div style={{ height: '400px' }}>
                <Bar data={utilizationData} options={chartOptions} />
              </div>
            </div>

            {/* Utilization Details Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4">Detailed Utilization Statistics</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Resource</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Hours Used</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Utilization Rate</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {utilization.labels?.map((label, index) => {
                    const rate = utilization.data[index];
                    return (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{label}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {utilization.totalHours?.[index] || '0 hrs'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rate}%</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rate >= 70
                                ? 'bg-green-100 text-green-800'
                                : rate >= 40
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {rate >= 70 ? 'High' : rate >= 40 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;