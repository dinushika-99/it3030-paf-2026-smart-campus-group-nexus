import React, { useState, useEffect } from 'react';
import ResourceSelector from './ResourceSelector';
import TimePicker from './TimePicker';
import { bookingService } from '../../../services/BookingService';

const BookingForm = ({ preSelectedResourceId, onFormDataChange }) => {
  // Initialize state
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
  const [resourceInfo, setResourceInfo] = useState(null);
  const [isValid, setIsValid] = useState(false);
  
  // Track which fields have been touched (blurred)
  const [touched, setTouched] = useState({});

  // Fetch resource info when ID changes
  useEffect(() => {
    if (formData.resourcesId) {
      fetchResourceInfo();
    } else {
      setResourceInfo(null);
      setSelectedResource(null);
    }
  }, [formData.resourcesId]);

  const fetchResourceInfo = async () => {
    try {
      const resource = await bookingService.getResourceById(formData.resourcesId);
      setResourceInfo(resource);
      if (preSelectedResourceId) {
        setSelectedResource(resource);
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
    }
  };

  // --- VALIDATION LOGIC ---
  // This function calculates errors but doesn't set them directly.
  // It returns the errors object so we can decide whether to display them.
  const calculateErrors = () => {
    const newErrors = {};

    // 1. Date Validation
    if (!formData.bookingDate) {
      newErrors.bookingDate = 'Date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.bookingDate);
      const maxDate = new Date(today);
      maxDate.setMonth(today.getMonth() + 1);

      if (selectedDate < today) {
        newErrors.bookingDate = 'Cannot book dates in the past';
      } else if (selectedDate > maxDate) {
        newErrors.bookingDate = 'Bookings allowed up to one month in advance';
      }
    }

    // 2. Time Validation
    if (formData.bookingDate && !newErrors.bookingDate) {
      if (!formData.startTime) {
        newErrors.startTime = 'Start time is required';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'End time is required';
      }

      // CHECK START TIME AGAINST RESOURCE OPEN TIME IMMEDIATELY
      if (formData.startTime && resourceInfo) {
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [openH, openM] = resourceInfo.dailyOpenTime.split(':').map(Number);
        
        const startMin = startH * 60 + startM;
        const openMin = openH * 60 + openM;

        if (startMin < openMin) {
          newErrors.startTime = `Resource opens at ${resourceInfo.dailyOpenTime}`;
        }
      }

      // CHECK END TIME AGAINST RESOURCE CLOSE TIME IMMEDIATELY
      if (formData.endTime && resourceInfo) {
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const [closeH, closeM] = resourceInfo.dailyCloseTime.split(':').map(Number);
        
        const endMin = endH * 60 + endM;
        const closeMin = closeH * 60 + closeM;

        if (endMin > closeMin) {
          newErrors.endTime = `Resource closes at ${resourceInfo.dailyCloseTime}`;
        }
      }

      // CHECK DURATION IMMEDIATELY IF BOTH TIMES ARE SET
      if (formData.startTime && formData.endTime && resourceInfo) {
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        const maxDurationMin = resourceInfo.maxBookingDurationHours * 60;

        if (duration > maxDurationMin) {
          newErrors.endTime = `Max duration is ${resourceInfo.maxBookingDurationHours}h`;
        }
        
        if (duration <= 0) {
          newErrors.endTime = 'End time must be after start time';
        }
      }
    }
        // 3. Purpose Validation
    const purposeTrimmed = formData.purpose ? formData.purpose.trim() : '';

    if (!purposeTrimmed) {
      newErrors.purpose = 'Purpose is required';
    } else if (purposeTrimmed.length < 10) {
      newErrors.purpose = 'Please provide more details';
    } else if (purposeTrimmed.length > 255) {
      newErrors.purpose = 'Max 255 characters allowed';
    } else {
      // Check if it contains ANY letters (a-z, A-Z)
      // This prevents inputs like "@#$%^&*()" or "1234567890"
      const hasLetters = /[a-zA-Z]/.test(purposeTrimmed);
      
      if (!hasLetters) {
        newErrors.purpose = 'Please use meaningful words, not just symbols or numbers';
      } else {
        // Optional: Check for repetitive characters (e.g., "aaaaaaaaaaa")
        // This regex checks if the string is made of only one repeated character
        const isRepetitive = /^(.)\1+$/.test(purposeTrimmed);
        
        if (isRepetitive) {
          newErrors.purpose = 'Please provide a valid description';
        }
      }
    }

    // 4. Attendees / Quantity Validation
    if (selectedResource) {
      const isEquipment = ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type);
      
      if (isEquipment) {
        if (!formData.quantityRequested || formData.quantityRequested < 1) {
          newErrors.quantityRequested = 'Quantity must be at least 1';
        } else if (formData.quantityRequested > selectedResource.maxQuantity) {
          newErrors.quantityRequested = `Max quantity is ${selectedResource.maxQuantity}`;
        }
      } else {
        if (!formData.expectedAttendees || formData.expectedAttendees < 1) {
          newErrors.expectedAttendees = 'Attendees must be at least 1';
        } else if (formData.expectedAttendees > selectedResource.capacity) {
          newErrors.expectedAttendees = `Max capacity is ${selectedResource.capacity}`;
        }
      }
    }

    return newErrors;
  };

  // Run validation whenever form data changes
  useEffect(() => {
    const calculatedErrors = calculateErrors();
    
    // Determine overall validity
    const currentIsValid = Object.keys(calculatedErrors).length === 0 && 
                           formData.resourcesId && 
                           formData.bookingDate && 
                           formData.startTime && 
                           formData.endTime && 
                           formData.purpose;
    
    setIsValid(currentIsValid);
    
    // Notify parent
    if (onFormDataChange) {
      onFormDataChange({ ...formData, selectedResource, isValid: currentIsValid });
    }
    
    // ✅ ONLY update displayed errors for fields that have been touched
    // This prevents red errors from showing on initial load
    setErrors(prevErrors => {
      const newDisplayedErrors = {};
      Object.keys(calculatedErrors).forEach(field => {
        if (touched[field]) {
          newDisplayedErrors[field] = calculatedErrors[field];
        }
      });
      return newDisplayedErrors;
    });
    
  }, [formData, selectedResource, resourceInfo, touched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  //Mark field as touched when user leaves it
  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Immediately validate this specific field on blur
    const allErrors = calculateErrors();
    if (allErrors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: allErrors[fieldName] }));
    } else {
      // Clear error if valid
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Calculate max date for input attribute
  const getMaxDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  // Helper to check if an error should be shown
  const showError = (field) => touched[field] && errors[field];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Booking Details</h2>
      
      {/* Resource Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Resource *</label>
        <ResourceSelector
          selectedResource={formData.resourcesId}
          onResourceChange={(resource) => {
            setSelectedResource(resource);
            setFormData(prev => ({ ...prev, resourcesId: resource.resourcesId }));
            setTouched(prev => ({ ...prev, resourcesId: true }));
          }}
          error={showError('resourcesId') ? errors.resourcesId : ''}
          isLocked={!!preSelectedResourceId}
          preSelectedResource={selectedResource}
        />
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
        <input
          type="date"
          name="bookingDate"
          value={formData.bookingDate}
          onChange={handleChange}
          onBlur={() => handleBlur('bookingDate')}
          min={new Date().toISOString().split('T')[0]}
          max={getMaxDate()}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            showError('bookingDate') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {showError('bookingDate') && <p className="text-red-500 text-xs mt-1">{errors.bookingDate}</p>}
        <p className="text-xs text-gray-500 mt-1">Bookings allowed up to one month in advance.</p>
      </div>

      {/* Time Selection */}
      <div className="mb-6">
        <TimePicker
          startTime={formData.startTime}
          endTime={formData.endTime}
          onStartTimeChange={(val) => {
            setFormData(p => ({...p, startTime: val}));
            setTouched(prev => ({ ...prev, startTime: true }));
          }}
          onEndTimeChange={(val) => {
            setFormData(p => ({...p, endTime: val}));
            setTouched(prev => ({ ...prev, endTime: true }));
          }}
          onBlurStart={() => handleBlur('startTime')}
          onBlurEnd={() => handleBlur('endTime')}
          startTimeError={showError('startTime') ? errors.startTime : ''}
          endTimeError={showError('endTime') ? errors.endTime : ''}
          resourceOpenTime={resourceInfo?.dailyOpenTime}
          resourceCloseTime={resourceInfo?.dailyCloseTime}
          maxDurationHours={resourceInfo?.maxBookingDurationHours}
        />
      </div>

      {/* Purpose */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          onBlur={() => handleBlur('purpose')}
          rows="3"
          placeholder="E.g., Annual Department Meeting, Project Presentation..."
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            showError('purpose') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          maxLength="255"
        />
        
        {/* Dynamic Error Message */}
        {showError('purpose') && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span>⚠️</span> {errors.purpose}
          </p>
        )}
        
        {/* Helper Note (Always visible or only when no error) */}
        {!showError('purpose') && (
          <p className="text-xs text-gray-500 mt-1">
            💡 Please provide a meaningful reason for your booking.
          </p>
        )}
      </div>

      {/* Attendees or Quantity */}
      {selectedResource && !['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Expected Attendees *</label>
          <input
            type="number"
            name="expectedAttendees"
            value={formData.expectedAttendees}
            onChange={handleChange}
            onBlur={() => handleBlur('expectedAttendees')}
            min="1"
            max={selectedResource.capacity}
            placeholder={`Max: ${selectedResource.capacity}`}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              showError('expectedAttendees') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {showError('expectedAttendees') && <p className="text-red-500 text-xs mt-1">{errors.expectedAttendees}</p>}
        </div>
      )}

      {selectedResource && ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Requested *</label>
          <input
            type="number"
            name="quantityRequested"
            value={formData.quantityRequested}
            onChange={handleChange}
            onBlur={() => handleBlur('quantityRequested')}
            min="1"
            max={selectedResource.maxQuantity}
            placeholder={`Max: ${selectedResource.maxQuantity}`}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              showError('quantityRequested') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {showError('quantityRequested') && <p className="text-red-500 text-xs mt-1">{errors.quantityRequested}</p>}
        </div>
      )}
    </div>
  );
};

export default BookingForm;      