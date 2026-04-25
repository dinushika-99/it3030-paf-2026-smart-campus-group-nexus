import React from 'react';

const ValidationMessages = ({ apiError, fieldErrors }) => {
  if (!apiError && (!fieldErrors || Object.keys(fieldErrors).length === 0)) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      {apiError && (
        <div className="text-red-800 font-medium mb-2">
          ⚠️ {apiError}
        </div>
      )}
      
      {fieldErrors && Object.keys(fieldErrors).length > 0 && (
        <ul className="list-disc list-inside text-red-700 text-sm">
          {Object.entries(fieldErrors).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ValidationMessages;