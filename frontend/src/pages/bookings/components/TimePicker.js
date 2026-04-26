import React from 'react';

const TimePicker = ({ 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange, 
  startTimeError, 
  endTimeError,
  onBlurStart,
  onBlurEnd,
  resourceOpenTime,
  resourceCloseTime,
  maxDurationHours
}) => {
  
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return 'Invalid';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const duration = calculateDuration();
  const isOverMax = maxDurationHours && duration !== 'Invalid' && duration !== null && 
    (() => {
       const [sh, sm] = startTime.split(':').map(Number);
       const [eh, em] = endTime.split(':').map(Number);
       return ((eh * 60 + em) - (sh * 60 + sm)) > (maxDurationHours * 60);
    })();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Time Range *</label>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            onBlur={onBlurStart}
            min={resourceOpenTime || "08:00"}
            max={resourceCloseTime || "22:00"}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              startTimeError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {startTimeError && <p className="text-red-500 text-xs mt-1">{startTimeError}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            onBlur={onBlurEnd}
            min={startTime || resourceOpenTime || "08:00"}
            max={resourceCloseTime || "22:00"}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              endTimeError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {endTimeError && <p className="text-red-500 text-xs mt-1">{endTimeError}</p>}
        </div>
      </div>
      
      <div className="mt-2 flex justify-between items-center text-xs">
        <p className="text-gray-500">
          Available: {resourceOpenTime || '08:00'} - {resourceCloseTime || '22:00'}
        </p>
        {duration && (
          <p className={`font-medium ${isOverMax ? 'text-red-600' : 'text-blue-600'}`}>
            Duration: {duration} {isOverMax && `(Max: ${maxDurationHours}h)`}
          </p>
        )}
      </div>
    </div>
  );
};

export default TimePicker;