import React, { useState, useEffect } from 'react';
import ResourceSelector from './components/ResourceSelector';
import TimePicker from './components/TimePicker';
import ValidationMessages from './components/ValidationMessages';
import { bookingService } from '../../../services/bookingService';

const BookingForm = ({ preSelectedResourceId, onFormDataChange }) => {
  const [formData, setFormData] = useState({
    resourcesId: preSelectedResourceId || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
    quantityRequested: 1
  });
  
  const [selectedResource, setSelectedResource] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isResourceLocked, setIsResourceLocked] = useState(!!preSelectedResourceId);

  // Notify parent of form data changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange({ ...formData, selectedResource });
    }
  }, [formData, selectedResource, onFormDataChange]);

  // Fetch pre-selected resource details
  useEffect(() => {
    if (preSelectedResourceId) {
      const fetchResource = async () => {
        try {
          const resource = await bookingService.getResourceById(preSelectedResourceId);
          setSelectedResource(resource);
          setIsResourceLocked(true);
          setFormData(prev => ({ ...prev, resourcesId: preSelectedResourceId }));
        } catch (error) {
          console.error('Error fetching resource:', error);
          setApiError('Could not load resource details');
        }
      };
      fetchResource();
    }
  }, [preSelectedResourceId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.resourcesId) {
      newErrors.resourcesId = 'Please select a resource';
    }

    if (!formData.bookingDate) {
      newErrors.bookingDate = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.purpose || formData.purpose.trim() === '') {
      newErrors.purpose = 'Purpose is required';
    } else if (formData.purpose.length > 255) {
      newErrors.purpose = 'Purpose must not exceed 255 characters';
    }

    if (selectedResource) {
      const isEquipment = ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type);
      
      if (isEquipment) {
        if (!formData.quantityRequested || formData.quantityRequested < 1) {
          newErrors.quantityRequested = 'Quantity must be at least 1';
        }
      } else {
        if (!formData.expectedAttendees || formData.expectedAttendees < 1) {
          newErrors.expectedAttendees = 'Expected attendees must be at least 1';
        }
        if (selectedResource.capacity && formData.expectedAttendees > selectedResource.capacity) {
          newErrors.expectedAttendees = `Cannot exceed capacity of ${selectedResource.capacity}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Booking Details</h2>
      
      <ValidationMessages apiError={apiError} fieldErrors={errors} />

      {/* Resource Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Resource</h3>
        <ResourceSelector
          selectedResource={formData.resourcesId}
          onResourceChange={(resource) => {
            setSelectedResource(resource);
            setFormData(prev => ({ ...prev, resourcesId: resource.resourcesId }));
          }}
          error={errors.resourcesId}
          isLocked={isResourceLocked}
          preSelectedResource={selectedResource}
        />
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Booking Details</h3>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          name="bookingDate"
          value={formData.bookingDate}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {errors.bookingDate && <p className="text-red-500 text-sm mt-1">{errors.bookingDate}</p>}
      </div>

      {/* Time Selection */}
      <div className="mb-6">
        <TimePicker
          startTime={formData.startTime}
          endTime={formData.endTime}
          onStartTimeChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
          onEndTimeChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
          startTimeError={errors.startTime}
          endTimeError={errors.endTime}
        />
      </div>

      {/* Purpose */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Purpose *
        </label>
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          rows="3"
          placeholder="Describe the purpose of your booking"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength="255"
          required
        />
        <p className="text-xs text-gray-500 mt-1">{formData.purpose.length}/255 characters</p>
        {errors.purpose && <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>}
      </div>

      {/* Attendees or Quantity */}
      {selectedResource && !['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Attendees *
          </label>
          <input
            type="number"
            name="expectedAttendees"
            value={formData.expectedAttendees}
            onChange={handleChange}
            min="1"
            max={selectedResource.capacity || 999}
            placeholder={`Max: ${selectedResource.capacity || 'N/A'}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {errors.expectedAttendees && <p className="text-red-500 text-sm mt-1">{errors.expectedAttendees}</p>}
        </div>
      )}

      {selectedResource && ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity Requested *
          </label>
          <input
            type="number"
            name="quantityRequested"
            value={formData.quantityRequested}
            onChange={handleChange}
            min="1"
            max={selectedResource.quantity || 999}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {errors.quantityRequested && <p className="text-red-500 text-sm mt-1">{errors.quantityRequested}</p>}
        </div>
      )}
    </div>
  );
};

export default BookingForm;