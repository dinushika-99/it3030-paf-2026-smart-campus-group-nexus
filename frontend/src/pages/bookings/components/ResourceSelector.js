import React, { useState, useEffect } from 'react';
import { bookingService } from '../../../services/BookingService';

const ResourceSelector = ({ 
  selectedResource, 
  onResourceChange, 
  error,
  isLocked = false,
  preSelectedResource = null
}) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await bookingService.getResources();
        // Filter only bookable and active resources
        const bookableResources = data.filter(
          r => r.status === 'ACTIVE' && r.isBookable !== false
        );
        setResources(bookableResources);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // If locked and pre-selected resource exists, show it
  if (isLocked && preSelectedResource) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          Selected Resource
        </label>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{preSelectedResource.name}</p>
            <p className="text-sm text-gray-600">
              {preSelectedResource.type} • {preSelectedResource.location}
              {preSelectedResource.capacity && ` • Capacity: ${preSelectedResource.capacity}`}
            </p>
          </div>
          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
            Locked
          </span>
        </div>
        <input
          type="hidden"
          name="resourcesId"
          value={preSelectedResource.resourcesId}
        />
      </div>
    );
  }

  if (loading) {
    return <div className="text-gray-500">Loading resources...</div>;
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Resource *
      </label>
      <select
        value={selectedResource || ''}
        onChange={(e) => {
          const resourceId = parseInt(e.target.value);
          const resource = resources.find(r => r.resourcesId === resourceId);
          onResourceChange(resource);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select a Resource --</option>
        {resources.map((resource) => (
          <option key={resource.resourcesId} value={resource.resourcesId}>
            {resource.name} ({resource.type}) - {resource.location}
            {resource.capacity && ` - Capacity: ${resource.capacity}`}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default ResourceSelector;