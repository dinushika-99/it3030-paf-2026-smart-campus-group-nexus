import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../AuthContext';

const ResourceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch resource details from API
    setLoading(false);
    setResource(null);
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resource details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resource) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Not Found</h2>
            <p className="text-gray-600 mb-6">The resource you're looking for doesn't exist</p>
            <button
              onClick={() => navigate('/facilities')}
              className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
            >
              Back to Facilities
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="p-6 max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/facilities')}
          className="mb-6 text-yellow-600 hover:text-yellow-700 font-semibold"
        >
          ← Back to Facilities
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{resource.name}</h1>
          <p className="text-gray-600 mb-6">{resource.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
              <p className="text-gray-700">{resource.type}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-700">{resource.location}</p>
            </div>
            {resource.capacity && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Capacity</h3>
                <p className="text-gray-700">{resource.capacity} people</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/bookings/new/${resource.id}`)}
            className="mt-6 w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
          >
            Book This Resource
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResourceDetail;
