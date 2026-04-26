import React, { useState, useEffect } from 'react';
import ResourceSelector from './ResourceSelector';
import TimePicker from './TimePicker';
import ValidationMessage from './ValidationMessage';
import { bookingService } from '../../../services/BookingService';

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
  const [resourceInfo, setResourceInfo] = useState(null);
  
  // ✅ NEW: Track touched fields and submit attempt
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch resource info when selected
  useEffect(() => {
    if (formData.resourcesId) {
      fetchResourceInfo();
    }
  }, [formData.resourcesId]);

  const fetchResourceInfo = async () => {
    try {
      const resource = await bookingService.getResourceById(formData.resourcesId);
      setResourceInfo(resource);
      if (preSelectedResourceId) {
        setSelectedResource(resource);
        setIsResourceLocked(true);
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
    }
  };

  // Notify parent of form data changes
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange({ ...formData, selectedResource });
    }
  }, [formData, selectedResource, onFormDataChange]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // 1. Resource required
    if (!formData.resourcesId) {
      newErrors.resourcesId = 'Please select a resource';
    }

    // 2. Date required
    if (!formData.bookingDate) {
      newErrors.bookingDate = 'Date is required';
    }

    // 3. Start time required
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // 4. End time required
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    // 5. Validate within resource available hours
    if (resourceInfo && formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      
      const [openHour, openMin] = resourceInfo.dailyOpenTime.split(':').map(Number);
      const [closeHour, closeMin] = resourceInfo.dailyCloseTime.split(':').map(Number);
      
      const bookingStartMinutes = startHour * 60 + startMin;
      const bookingEndMinutes = endHour * 60 + endMin;
      const resourceOpenMinutes = openHour * 60 + openMin;
      const resourceCloseMinutes = closeHour * 60 + closeMin;
      
      if (bookingStartMinutes < resourceOpenMinutes) {
        newErrors.startTime = `Resource opens at ${resourceInfo.dailyOpenTime}. Please select a later time.`;
      }
      
      if (bookingEndMinutes > resourceCloseMinutes) {
        newErrors.endTime = `Resource closes at ${resourceInfo.dailyCloseTime}. Please select an earlier time.`;
      }
      
      // 6. Validate max booking duration
      const durationMinutes = bookingEndMinutes - bookingStartMinutes;
      const maxDurationMinutes = resourceInfo.maxBookingDurationHours * 60;
      
      if (durationMinutes > maxDurationMinutes) {
        newErrors.endTime = `Maximum booking duration is ${resourceInfo.maxBookingDurationHours} hour(s). Current duration: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
      }
      
      if (durationMinutes <= 0) {
        newErrors.endTime = 'Booking duration must be at least 1 hour';
      }
    }

    // 7. Validate purpose
    if (!formData.purpose || formData.purpose.trim() === '') {
      newErrors.purpose = 'Purpose is required';
    } else if (formData.purpose.trim().length < 10) {
      newErrors.purpose = 'Purpose must be at least 10 characters long';
    } else if (formData.purpose.length > 255) {
      newErrors.purpose = 'Purpose must not exceed 255 characters';
    } else {
      // Check for symbols (allow only letters, numbers, spaces, and basic punctuation)
      const purposePattern = /^[a-zA-Z0-9\s,.'-]+$/;
      if (!purposePattern.test(formData.purpose)) {
        newErrors.purpose = 'Purpose contains invalid characters. Only letters, numbers, spaces, and basic punctuation (, . \') are allowed';
      }
      
      // Check for minimum words
      const words = formData.purpose.trim().split(/\s+/);
      if (words.length < 3) {
        newErrors.purpose = 'Purpose must be at least 3 words long and provide meaningful information';
      }
      
      // Check for repeated characters
      if (/^(.)\1+$/.test(formData.purpose.trim())) {
        newErrors.purpose = 'Purpose must be a meaningful description, not repeated characters';
      }
    }

    // 8. Validate attendees/quantity based on resource type
    if (selectedResource) {
      const isEquipment = ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type);
      
      if (isEquipment) {
        // Equipment: validate quantity
        if (!formData.quantityRequested || formData.quantityRequested < 1) {
          newErrors.quantityRequested = 'Quantity must be at least 1';
        }
        if (formData.quantityRequested > selectedResource.maxQuantity) {
          newErrors.quantityRequested = `Cannot exceed maximum quantity of ${selectedResource.maxQuantity}`;
        }
      } else {
        // Non-equipment: validate attendees
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
    
    // ✅ Mark field as touched when user interacts with it
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
    
    // Clear field error when user starts typing (only for that field)
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ NEW: Handle blur event to mark field as touched
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    // Validate this specific field on blur
    validateForm();
  };

  // ✅ NEW: Handle submit attempt
  const handleSubmitAttempt = () => {
    setSubmitted(true);
    // Mark all fields as touched
    const allTouched = {
      resourcesId: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      purpose: true,
      expectedAttendees: true,
      quantityRequested: true
    };
    setTouched(allTouched);
    validateForm();
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    return formData.resourcesId && 
           formData.bookingDate && 
           formData.startTime && 
           formData.endTime && 
           formData.purpose && 
           formData.purpose.trim().length >= 10 &&
           (selectedResource 
             ? (['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(selectedResource.type)
               ? formData.quantityRequested >= 1 && formData.quantityRequested <= (selectedResource.maxQuantity || 999)
               : formData.expectedAttendees >= 1 && formData.expectedAttendees <= (selectedResource.capacity || 999))
             : false) &&
           Object.keys(errors).length === 0;
  };

  // ✅ Helper to determine if error should be shown
  const shouldShowError = (fieldName) => {
    return (touched[fieldName] || submitted) && errors[fieldName];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Booking Details</h2>
      
      <ValidationMessage apiError={apiError} fieldErrors={errors} />

      {/* Resource Information Display */}
      {resourceInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Resource Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Available Hours:</span>
              <span className="ml-2 font-medium text-gray-900">
                {resourceInfo.dailyOpenTime} - {resourceInfo.dailyCloseTime}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Max Duration:</span>
              <span className="ml-2 font-medium text-gray-900">
                {resourceInfo.maxBookingDurationHours} hour(s)
              </span>
            </div>
            <div>
              <span className="text-gray-600">
                {['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(resourceInfo.type) 
                  ? 'Max Quantity:' 
                  : 'Capacity:'}
              </span>
              <span className="ml-2 font-medium text-gray-900">
                {['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(resourceInfo.type)
                  ? resourceInfo.maxQuantity
                  : resourceInfo.capacity}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Resource Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Resource</h3>
        <ResourceSelector
          selectedResource={formData.resourcesId}
          onResourceChange={(resource) => {
            setSelectedResource(resource);
            setFormData(prev => ({ ...prev, resourcesId: resource.resourcesId }));
            setTouched(prev => ({ ...prev, resourcesId: true }));
          }}
          error={shouldShowError('resourcesId') ? errors.resourcesId : ''}
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
          onBlur={handleBlur}  // ✅ Add blur handler
          min={new Date().toISOString().split('T')[0]}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            shouldShowError('bookingDate') 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          required
        />
        {shouldShowError('bookingDate') && (
          <p className="text-red-500 text-sm mt-1">{errors.bookingDate}</p>
        )}
      </div>

      {/* Time Selection */}
      <div className="mb-6">
        <TimePicker
          startTime={formData.startTime}
          endTime={formData.endTime}
          onStartTimeChange={(value) => {
            setFormData(prev => ({ ...prev, startTime: value }));
            setTouched(prev => ({ ...prev, startTime: true }));
          }}
          onEndTimeChange={(value) => {
            setFormData(prev => ({ ...prev, endTime: value }));
            setTouched(prev => ({ ...prev, endTime: true }));
          }}
          onBlur={handleBlur}  // ✅ Add blur handler
          startTimeError={shouldShowError('startTime') ? errors.startTime : ''}
          endTimeError={shouldShowError('endTime') ? errors.endTime : ''}
          resourceOpenTime={resourceInfo?.dailyOpenTime || '08:00'}
          resourceCloseTime={resourceInfo?.dailyCloseTime || '22:00'}
          maxDurationHours={resourceInfo?.maxBookingDurationHours || 4}
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
          onBlur={handleBlur}  // ✅ Add blur handler
          rows="3"
          placeholder="Describe the purpose of your booking (e.g., 'Group project meeting for software development')"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            shouldShowError('purpose') 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          maxLength="255"
          required
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">{formData.purpose.length}/255 characters</p>
          {formData.purpose.length > 0 && formData.purpose.length < 10 && (
            <p className="text-xs text-orange-500">Minimum 10 characters required</p>
          )}
        </div>
        {shouldShowError('purpose') && (
          <p className="text-red-500 text-sm mt-1">{errors.purpose}</p>
        )}
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
            onBlur={handleBlur}  // ✅ Add blur handler
            min="1"
            max={selectedResource.capacity || 999}
            placeholder={`Max: ${selectedResource.capacity || 'N/A'}`}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              shouldShowError('expectedAttendees') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {shouldShowError('expectedAttendees') && (
            <p className="text-red-500 text-sm mt-1">{errors.expectedAttendees}</p>
          )}
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
            onBlur={handleBlur}  // ✅ Add blur handler
            min="1"
            max={selectedResource.maxQuantity || 999}
            placeholder={`Max: ${selectedResource.maxQuantity || 'N/A'}`}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              shouldShowError('quantityRequested') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            required
          />
          {shouldShowError('quantityRequested') && (
            <p className="text-red-500 text-sm mt-1">{errors.quantityRequested}</p>
          )}
        </div>
      )}

      {/* Submit Button - Only enabled when form is valid */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            handleSubmitAttempt();  // ✅ Mark as submitted and validate all
            if (isFormValid()) {
              // Parent will handle actual submission
            }
          }}
          disabled={!isFormValid()}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isFormValid()
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isFormValid() ? 'Submit Booking Request' : 'Fill All Required Fields'}
        </button>
        {!isFormValid() && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Please fill all required fields correctly to enable submission
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingForm;