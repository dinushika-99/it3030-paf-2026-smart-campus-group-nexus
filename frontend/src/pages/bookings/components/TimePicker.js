import React from 'react';

const TimePicker = ({ 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange, 
  startTimeError, 
  endTimeError 
}) => {
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
            min="08:00"
            max="20:00"
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
            min="08:00"
            max="22:00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {endTimeError && <p className="text-red-500 text-sm mt-1">{endTimeError}</p>}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Available hours: 8:00 AM - 10:00 PM
      </p>
    </div>
  );
};

export default TimePicker;