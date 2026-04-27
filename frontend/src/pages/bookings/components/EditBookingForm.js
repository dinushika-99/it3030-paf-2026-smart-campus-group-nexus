import React, { useState, useEffect, useRef } from 'react';
import ResourceSelector from './ResourceSelector';
import TimePicker from './TimePicker';
import { bookingService } from '../../../services/BookingService';

const EditBookingForm = ({ 
  initialData, 
  preSelectedResourceId, 
  onFormDataChange
}) => {
  const [formData, setFormData] = useState({
    resourcesId: initialData?.resourcesId || preSelectedResourceId || '',
    bookingDate: initialData?.startTime ? initialData.startTime.split('T')[0] : '',
    startTime: initialData?.startTime ? initialData.startTime.substring(11, 16) : '',
    endTime: initialData?.endTime ? initialData.endTime.substring(11, 16) : '',
    purpose: initialData?.purpose || '',
    expectedAttendees: initialData?.expectedAttendees || '',
    quantityRequested: initialData?.quantityRequested || 1
  });
  
  const [selectedResource, setSelectedResource] = useState(null);
  const [errors, setErrors] = useState({});
  const [resourceInfo, setResourceInfo] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState({});
  const [isFormReady, setIsFormReady] = useState(false);
  const lastPayloadRef = useRef('');

  // Fetch resource info on mount
  useEffect(() => {
    const resourceId = initialData?.resourcesId || preSelectedResourceId;
    console.log('🔍 Fetching resource:', resourceId);
    if (resourceId) {
      fetchResourceInfo(resourceId);
    }
  }, [initialData?.resourcesId, preSelectedResourceId]);

  const fetchResourceInfo = async (resourceId) => {
    try {
      console.log('📡 Fetching resource info for ID:', resourceId);
      const resource = await bookingService.getResourceById(resourceId);
      console.log('✅ Resource loaded:', resource);
      setResourceInfo(resource);
      setSelectedResource(resource);
      setIsFormReady(true);
    } catch (error) {
      console.error('❌ Error fetching resource:', error);
    }
  };

  const calculateErrors = () => {
    if (!resourceInfo) {
      console.log('⚠️ Cannot validate - resourceInfo not loaded');
      return {};
    }
    
    const newErrors = {};
    console.log('🔍 Validating form data:', formData);

    // 1. Date Validation
    if (!formData.bookingDate) {
      newErrors.bookingDate = 'Date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.bookingDate);
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 14);

      if (selectedDate < today) {
        newErrors.bookingDate = 'Cannot book dates in the past';
      } else if (selectedDate > maxDate) {
        newErrors.bookingDate = 'Bookings allowed up to 2 weeks in advance';
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

      if (formData.startTime && resourceInfo) {
        const [startH, startM] = formData.startTime.split(':').map(Number);
        const [openH, openM] = resourceInfo.dailyOpenTime.split(':').map(Number);
        
        const startMin = startH * 60 + startM;
        const openMin = openH * 60 + openM;

        if (startMin < openMin) {
          newErrors.startTime = `Resource opens at ${resourceInfo.dailyOpenTime}`;
        }
      }

      if (formData.endTime && resourceInfo) {
        const [endH, endM] = formData.endTime.split(':').map(Number);
        const [closeH, closeM] = resourceInfo.dailyCloseTime.split(':').map(Number);
        
        const endMin = endH * 60 + endM;
        const closeMin = closeH * 60 + closeM;

        if (endMin > closeMin) {
          newErrors.endTime = `Resource closes at ${resourceInfo.dailyCloseTime}`;
        }
      }

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
      const hasLetters = /[a-zA-Z]/.test(purposeTrimmed);
      
      if (!hasLetters) {
        newErrors.purpose = 'Please use meaningful words, not just symbols or numbers';
      } else {
        const isRepetitive = /^(.)\1+$/.test(purposeTrimmed);
        
        if (isRepetitive) {
          newErrors.purpose = 'Please provide a valid description';
        }
      }
    }

    // 4. Attendees / Quantity Validation
    const isEquipment = ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(resourceInfo.type);
    
    if (isEquipment) {
      const qty = parseInt(formData.quantityRequested);
      if (!formData.quantityRequested || isNaN(qty) || qty < 1) {
        newErrors.quantityRequested = 'Quantity must be at least 1';
      } else if (resourceInfo.maxQuantity && qty > resourceInfo.maxQuantity) {
        newErrors.quantityRequested = `Max quantity is ${resourceInfo.maxQuantity}`;
      }
    } else {
      const attendees = parseInt(formData.expectedAttendees);
      if (!formData.expectedAttendees || isNaN(attendees) || attendees < 1) {
        newErrors.expectedAttendees = 'Attendees must be at least 1';
      } else if (resourceInfo.capacity && attendees > resourceInfo.capacity) {
        newErrors.expectedAttendees = `Max capacity is ${resourceInfo.capacity}`;
      }
    }

    console.log('📋 Validation errors:', newErrors);
    return newErrors;
  };

  // Validate form when data changes (only after form is ready)
  useEffect(() => {
    if (!isFormReady || !resourceInfo) {
      console.log('⏳ Waiting for form to be ready...');
      return;
    }
    
    console.log('✅ Form is ready, running validation...');
    const calculatedErrors = calculateErrors();
    
    // Check validity
    const hasErrors = Object.keys(calculatedErrors).length > 0;
    const hasAllFields = formData.resourcesId && 
                         formData.bookingDate && 
                         formData.startTime && 
                         formData.endTime && 
                         formData.purpose;
    
    const currentIsValid = !hasErrors && hasAllFields;
    
    console.log('📊 Validation result:', {
      hasErrors,
      hasAllFields,
      isValid: currentIsValid,
      formData
    });
    
    setIsValid(currentIsValid);
    
    // Notify parent of validity
    if (onFormDataChange) {
      const payload = { ...formData, selectedResource, isValid: currentIsValid };
      const serializedPayload = JSON.stringify(payload);
      if (serializedPayload !== lastPayloadRef.current) {
        lastPayloadRef.current = serializedPayload;
        onFormDataChange(payload);
      }
    }
    
    // Update displayed errors (only for touched fields)
    setErrors(prevErrors => {
      const newDisplayedErrors = {};
      Object.keys(calculatedErrors).forEach(field => {
        if (touched[field]) {
          newDisplayedErrors[field] = calculatedErrors[field];
        }
      });
      return newDisplayedErrors;
    });
    
  }, [formData, resourceInfo, touched, isFormReady, onFormDataChange]);

  // Initialize form as "touched" after resource loads
  useEffect(() => {
    if (isFormReady && resourceInfo && Object.keys(touched).length === 0) {
      console.log('🎯 Initializing form as touched');
      setTouched({
        resourcesId: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        purpose: true,
        expectedAttendees: true,
        quantityRequested: true
      });
    }
  }, [isFormReady, resourceInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('✏️ Field changed:', name, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (fieldName) => {
    console.log('👁️ Field blurred:', fieldName);
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const allErrors = calculateErrors();
    if (allErrors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: allErrors[fieldName] }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  };

  const showError = (field) => touched[field] && errors[field];

  // Show loading state
  if (!isFormReady || !resourceInfo) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading booking information...</p>
      </div>
    );
  }

  console.log('🎨 Rendering form with isValid:', isValid);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Edit Booking</h2>
      
      {/* Resource Selection - LOCKED */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Resource *</label>
        <ResourceSelector
          selectedResource={formData.resourcesId}
          onResourceChange={() => {}} // Prevent changes
          error={showError('resourcesId') ? errors.resourcesId : ''}
          isLocked={true}
          preSelectedResource={selectedResource}
        />
        <p className="text-xs text-gray-500 mt-1 italic">
          ℹ️ Resource cannot be changed when editing a booking
        </p>
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
        <p className="text-xs text-gray-500 mt-1">Bookings allowed up to 2 weeks in advance.</p>
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
          resourceOpenTime={resourceInfo.dailyOpenTime}
          resourceCloseTime={resourceInfo.dailyCloseTime}
          maxDurationHours={resourceInfo.maxBookingDurationHours}
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
          placeholder="Edit your booking purpose..."
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            showError('purpose') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          maxLength="255"
        />
        
        {showError('purpose') && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <span>⚠️</span> {errors.purpose}
          </p>
        )}
        
        {!showError('purpose') && (
          <p className="text-xs text-gray-500 mt-1">
            💡 Please provide a meaningful reason for your booking.
          </p>
        )}
      </div>

      {/* Attendees or Quantity */}
      {!['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(resourceInfo.type) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Expected Attendees *</label>
          <input
            type="number"
            name="expectedAttendees"
            value={formData.expectedAttendees}
            onChange={handleChange}
            onBlur={() => handleBlur('expectedAttendees')}
            min="1"
            max={resourceInfo.capacity}
            placeholder={`Max: ${resourceInfo.capacity}`}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              showError('expectedAttendees') ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {showError('expectedAttendees') && <p className="text-red-500 text-xs mt-1">{errors.expectedAttendees}</p>}
        </div>
      )}

      {['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(resourceInfo.type) && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Requested *</label>
          <input
            type="number"
            name="quantityRequested"
            value={formData.quantityRequested}
            onChange={handleChange}
            onBlur={() => handleBlur('quantityRequested')}
            min="1"
            max={resourceInfo.maxQuantity}
            placeholder={`Max: ${resourceInfo.maxQuantity}`}
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

export default EditBookingForm;