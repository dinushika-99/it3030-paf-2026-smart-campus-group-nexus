import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingForm from './components/BookingForm';
import BookingSummary from './components/BookingSummary';
import { bookingService } from '../../services/BookingService';
import toast from 'react-hot-toast';

const CreateBooking = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/facilities');
  };

  const handleSubmit = async () => {
    if (!formData) return;
    
    // Double-check validity before sending
    if (!formData.isValid) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bookingDate = formData.bookingDate;
      const startDateTime = `${bookingDate}T${formData.startTime}`;
      const endDateTime = `${bookingDate}T${formData.endTime}`; 
      
      const isEquipment = ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(formData.selectedResource?.type);

      const bookingData = {
        resourcesId: parseInt(formData.resourcesId),
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: formData.purpose,
        expectedAttendees: isEquipment ? null : parseInt(formData.expectedAttendees),
        quantityRequested: isEquipment ? parseInt(formData.quantityRequested) : null
      };

      await bookingService.createBooking(bookingData);
      toast.success('Booking request submitted successfully!');
      navigate('/facilities');
    } catch (error) {
      console.error('Full error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error('Error creating booking: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  // The form is valid if the child component reports it as valid
  const isValid = formData?.isValid || false;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
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