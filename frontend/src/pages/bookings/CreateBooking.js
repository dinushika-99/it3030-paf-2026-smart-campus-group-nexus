import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingForm from './components/BookingForm';
import BookingSummary from './components/BookingSummary';
import { bookingService } from '../../services/BookingService';

const CreateBooking = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData) return;
    
    setIsSubmitting(true);
    try {
      const bookingData = {
        resourcesId: parseInt(formData.resourcesId),
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        expectedAttendees: formData.selectedResource && 
          ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR']
            .includes(formData.selectedResource.type) 
          ? null 
          : parseInt(formData.expectedAttendees),
        quantityRequested: formData.selectedResource && 
          ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR']
            .includes(formData.selectedResource.type)
          ? parseInt(formData.quantityRequested)
          : null
      };

      await bookingService.createBooking(bookingData);
      alert('Booking created successfully!');
      navigate('/bookings/my');
    } catch (error) {
      alert('Error creating booking: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  // Check if form is valid
  const isValid = formData && 
                  formData.resourcesId && 
                  formData.bookingDate && 
                  formData.startTime && 
                  formData.endTime && 
                  formData.purpose;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/resources')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back to Resources
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Booking</h1>
          <p className="text-gray-600 mt-2">
            Request a resource booking
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Booking Form */}
          <div className="lg:col-span-2">
            <BookingForm 
              preSelectedResourceId={resourceId} 
              onFormDataChange={handleFormDataChange}
            />
          </div>

          {/* RIGHT: Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <BookingSummary 
                resource={formData?.selectedResource}
                date={formData?.bookingDate}
                startTime={formData?.startTime}
                endTime={formData?.endTime}
                purpose={formData?.purpose}
                attendees={formData?.expectedAttendees || formData?.quantityRequested}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isValid={isValid}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateBooking;