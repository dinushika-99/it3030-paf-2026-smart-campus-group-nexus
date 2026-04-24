import React from 'react';

const BookingTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No status history available</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '⏳';
      case 'APPROVED': return '✅';
      case 'REJECTED': return '❌';
      case 'CANCELLED': return '🚫';
      default: return '📌';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-500';
      case 'APPROVED': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Sort by date (newest first)
  const sortedHistory = [...statusHistory].sort((a, b) => 
    new Date(b.changedAt) - new Date(a.changedAt)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Status History</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        {sortedHistory.map((item, index) => (
          <div key={index} className="relative flex items-start gap-4 pb-6 last:pb-0">
            {/* Icon */}
            <div className={`relative z-10 w-12 h-12 rounded-full ${getStatusColor(item.newStatus)} flex items-center justify-center text-white text-xl shadow-md`}>
              {getStatusIcon(item.newStatus)}
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">
                  {item.newStatus}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(item.changedAt).toLocaleString()}
                </span>
              </div>
              
              {item.changeNote && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Note:</span> {item.changeNote}
                </p>
              )}
              
              {item.changedByUserName && (
                <p className="text-xs text-gray-500">
                  By: {item.changedByUserName}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingTimeline;