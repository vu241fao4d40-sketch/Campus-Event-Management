import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  // variants: default, success, warning, danger, info, primary, neutral
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'published':
    case 'registered':
    case 'attended':
      return <Badge variant="success">{status.toUpperCase()}</Badge>;
    case 'draft':
      return <Badge variant="warning">DRAFT</Badge>;
    case 'cancelled':
      return <Badge variant="danger">CANCELLED</Badge>;
    case 'completed':
      return <Badge variant="neutral">COMPLETED</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
