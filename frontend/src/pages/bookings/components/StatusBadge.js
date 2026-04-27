import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return {
          bgColor: '#fef3c7',
          textColor: '#b45309',
          borderColor: '#fcd34d',
          label: 'Pending'
        };
      case 'APPROVED':
        return {
          bgColor: '#ecfdf5',
          textColor: '#166534',
          borderColor: '#bbf7d0',
          label: 'Approved'
        };
      case 'REJECTED':
        return {
          bgColor: '#fef2f2',
          textColor: '#b91c1c',
          borderColor: '#fecaca',
          label: 'Rejected'
        };
      case 'CANCELLED':
        return {
          bgColor: '#f3f4f6',
          textColor: '#374151',
          borderColor: '#d1d5db',
          label: 'Cancelled'
        };
      default:
        return {
          bgColor: '#f3f4f6',
          textColor: '#374151',
          borderColor: '#d1d5db',
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '6px',
        paddingBottom: '6px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.textColor }}></span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;