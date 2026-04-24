import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingForm from './components/BookingForm';
import BookingSummary from './components/BookingSummary';

const CreateBooking = () => {
  const { resourceId } = useParams();
  const navigate = useNavigate();

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
          
          {/* LEFT: Booking Form (2/3 width) */}
          <div className="lg:col-span-2">
            <BookingForm preSelectedResourceId={resourceId} />
          </div>

          {/* RIGHT: Booking Summary (1/3 width) - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <BookingSummary />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateBooking;