import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditBookingForm from './components/EditBookingForm';
import BookingSummary from './components/BookingSummary';
import { bookingService } from '../../services/BookingService';
import toast from 'react-hot-toast';

const EditBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditable, setIsEditable] = useState(true);

  useEffect(() => {
    fetchBookingData();
  }, [id]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookingById(id);
      const bookingData = data.data || data;
      
      // ✅ Only allow editing PENDING bookings
      if (bookingData.status !== 'PENDING') {
        toast.error(`Cannot edit ${bookingData.status.toLowerCase()} booking. Only PENDING bookings can be edited.`);
        setTimeout(() => {
          navigate(`/bookings/${id}`);
        }, 2000);
        setIsEditable(false);
        setBooking(bookingData);
        return;
      }
      
      setBooking(bookingData);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/bookings/my');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/bookings/${id}`);
  };

  const handleSubmit = async (submittedData = formData) => {
    const payload = submittedData && submittedData.target ? formData : submittedData;
    if (!payload || !booking) return;
    
    if (!payload.isValid) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bookingDate = payload.bookingDate;
      const startDateTime = `${bookingDate}T${payload.startTime}`;
      const endDateTime = `${bookingDate}T${payload.endTime}`; 
      
      const isEquipment = ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(payload.selectedResource?.type);

      const updateData = {
        resourcesId: parseInt(payload.resourcesId),
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: payload.purpose,
        expectedAttendees: isEquipment ? null : parseInt(payload.expectedAttendees),
        quantityRequested: isEquipment ? parseInt(payload.quantityRequested) : null
      };

      await bookingService.updateBooking(booking.bookingId, updateData);
      toast.success('Booking updated successfully!');
      navigate(`/bookings/${id}`);
    } catch (error) {
      console.error('Full error:', error);
      const errorMsg = error.response?.data?.message || error.message;
      toast.error('Error updating booking: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDataChange = useCallback((data) => {
    setFormData(data);
  }, []);

  const isValid = formData?.isValid || false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // ✅ Show message if booking is not editable
  if (!isEditable && booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              ← Back to Booking Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Cannot Edit This Booking</h2>
            <p className="text-red-700 mb-4">
              Only <strong>PENDING</strong> bookings can be edited. This booking is currently <strong>{booking.status}</strong>.
            </p>
            <p className="text-gray-600 mb-6">
              If you need to make changes to an approved booking, please cancel it first and create a new booking.
            </p>
            <button
              onClick={() => navigate(`/bookings/${id}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View Booking Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back to Booking Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
          <p className="text-gray-600 mt-2">
            Update your booking for <span className="font-semibold text-blue-600">{booking.resourceName}</span>
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <span>⏳</span> Status: {booking.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EditBookingForm 
              initialData={booking}
              preSelectedResourceId={booking.resourcesId}
              onFormDataChange={handleFormDataChange}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <BookingSummary 
                resource={formData?.selectedResource || {
                  name: booking.resourceName,
                  type: booking.resourceType,
                  capacity: booking.capacity
                }}
                date={formData?.bookingDate || booking.startTime?.split('T')[0]}
                startTime={formData?.startTime || booking.startTime?.substring(11, 16)}
                endTime={formData?.endTime || booking.endTime?.substring(11, 16)}
                purpose={formData?.purpose || booking.purpose}
                attendees={formData?.expectedAttendees || formData?.quantityRequested || booking.expectedAttendees || booking.quantityRequested}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isValid={isValid}
                isEditMode={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBooking;