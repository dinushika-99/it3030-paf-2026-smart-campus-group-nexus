import React from 'react';

const TimePicker = ({ 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange, 
  startTimeError, 
  endTimeError,
  resourceOpenTime = '08:00',
  resourceCloseTime = '22:00',
  maxDurationHours = 4
}) => {
  
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const diffMinutes = endMinutes - startMinutes;
    
    if (diffMinutes <= 0) return 'Invalid';
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const duration = calculateDuration();
  const isOverMaxDuration = duration && duration !== 'Invalid' && 
    (() => {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      return totalMinutes > (maxDurationHours * 60);
    })();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Time Range *
      </label>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            min={resourceOpenTime}
            max={resourceCloseTime}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {startTimeError && <p className="text-red-500 text-sm mt-1">{startTimeError}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            min={startTime || resourceOpenTime}
            max={resourceCloseTime}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {endTimeError && <p className="text-red-500 text-sm mt-1">{endTimeError}</p>}
        </div>
      </div>
      
      <div className="mt-2 flex justify-between items-center text-xs">
        <p className="text-gray-500">
          Available hours: {resourceOpenTime} - {resourceCloseTime}
        </p>
        {duration && (
          <p className={`font-medium ${isOverMaxDuration ? 'text-red-600' : 'text-blue-600'}`}>
            Duration: {duration} {isOverMaxDuration && `(Max: ${maxDurationHours}h)`}
          </p>
        )}
      </div>
    </div>
  );
};

export default TimePicker;