import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../AuthContext';

const AdminResourceForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    capacity: '',
    description: '',
    isBookable: true,
  });
  const [loading, setLoading] = useState(id ? true : false);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      // TODO: Fetch resource data from API
      setLoading(false);
      setFormData({
        name: '',
        type: '',
        location: '',
        capacity: '',
        description: '',
        isBookable: true,
      });
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Submit form data to API
      alert(`Resource ${isEditMode ? 'updated' : 'created'} successfully!`);
      navigate('/admin/resources');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resource...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Resource' : 'Create Resource'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update the resource information' : 'Add a new resource to the system'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Resource Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="e.g., Lab A, Meeting Room 201"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-semibold text-gray-900 mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Select a type</option>
                <option value="LAB">Lab</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="AUDITORIUM">Auditorium</option>
                <option value="GYM">Gym</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Building A, 2nd Floor"
              />
            </div>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-semibold text-gray-900 mb-2">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="e.g., 50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Provide additional details about the resource"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isBookable"
              name="isBookable"
              checked={formData.isBookable}
              onChange={handleChange}
              className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
            />
            <label htmlFor="isBookable" className="ml-3 text-sm font-semibold text-gray-900">
              Make this resource bookable
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Resource' : 'Create Resource'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/resources')}
              className="flex-1 bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AdminResourceForm;
