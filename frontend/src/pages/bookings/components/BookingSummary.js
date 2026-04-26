import React from 'react';

const BookingSummary = ({ 
  resource, 
  date, 
  startTime, 
  endTime, 
  purpose, 
  attendees,
  onSubmit,
  isSubmitting,
  isValid
}) => {
  
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString; // Assuming 24h format from input, or add formatting logic here
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not selected';
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 sticky top-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        📋 Booking Summary
      </h3>

      {/* Resource */}
      <div className="mb-5 pb-5 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Resource</p>
        {resource ? (
          <div>
            <p className="font-semibold text-gray-900 text-base">{resource.name}</p>
            <p className="text-sm text-gray-600">{resource.type} • Capacity: {resource.capacity}</p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">Not selected</p>
        )}
      </div>

      {/* Date */}
      <div className="mb-5 pb-5 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date</p>
        <p className="font-medium text-gray-900">{formatDate(date)}</p>
      </div>

      {/* Time */}
      <div className="mb-5 pb-5 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Time</p>
        {startTime && endTime ? (
          <div>
            <p className="font-medium text-gray-900">{formatTime(startTime)} - {formatTime(endTime)}</p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">Not selected</p>
        )}
      </div>

      {/* Attendees/Quantity */}
      <div className="mb-5 pb-5 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {resource && ['PROJECTOR', 'PRINTER', 'SPEAKER', 'SPORT_MATERIAL', 'VR_HEADSET_SET', 'VR'].includes(resource.type) ? 'Quantity' : 'Attendees'}
        </p>
        {attendees ? (
          <p className="font-medium text-gray-900">{attendees}</p>
        ) : (
          <p className="text-gray-400 text-sm italic">Not selected</p>
        )}
      </div>

      {/* Purpose */}
      {purpose && (
        <div className="mb-5 pb-5 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Purpose</p>
          <p className="text-sm text-gray-700 italic">"{purpose}"</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          isValid && !isSubmitting
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Booking...
          </>
        ) : (
          <>✓ Submit Booking</>
        )}
      </button>
      
      {!isValid && (
         <p className="text-center text-xs text-gray-500 mt-2">Fill all fields correctly to enable submission</p>
      )}
    </div>
  );
};

export default BookingSummary;