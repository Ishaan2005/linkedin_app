import React from 'react';
import type { JobStatus, LeadStatus } from '../../types';

interface StatusBadgeProps {
  status: LeadStatus | JobStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (statusStr: string): { bg: string; color: string; border: string; label: string } => {
    switch (statusStr) {
      case 'NEW':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: 'rgba(59, 130, 246, 0.25)', label: 'New' };
      case 'REVIEWED':
        return { bg: 'rgba(107, 114, 128, 0.12)', color: '#4b5563', border: 'rgba(107, 114, 128, 0.25)', label: 'Reviewed' };
      case 'CONNECTION_SENT':
        return { bg: 'rgba(234, 88, 12, 0.12)', color: '#c2410c', border: 'rgba(234, 88, 12, 0.25)', label: 'Connection Sent' };
      case 'CONNECTED':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: 'rgba(16, 185, 129, 0.25)', label: 'Connected' };
      case 'MESSAGE_SENT':
        return { bg: 'rgba(147, 51, 234, 0.12)', color: '#7c3aed', border: 'rgba(147, 51, 234, 0.25)', label: 'Message Sent' };
      case 'RESUME_SENT':
        return { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: 'rgba(2, 132, 199, 0.25)', label: 'Resume Sent' };
      case 'FOLLOW_UP':
        return { bg: 'rgba(217, 119, 6, 0.12)', color: '#b45309', border: 'rgba(217, 119, 6, 0.25)', label: 'Follow Up' };
      case 'REPLIED':
        return { bg: 'rgba(13, 148, 136, 0.12)', color: '#0f766e', border: 'rgba(13, 148, 136, 0.25)', label: 'Replied' };
      case 'INTERVIEW':
        return { bg: 'rgba(22, 163, 74, 0.15)', color: '#15803d', border: 'rgba(22, 163, 74, 0.3)', label: 'Interview' };
      case 'REJECTED':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c', border: 'rgba(239, 68, 68, 0.2)', label: 'Rejected' };
      case 'ARCHIVED':
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: 'rgba(100, 116, 139, 0.2)', label: 'Archived' };
      case 'SAVED':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: 'rgba(245, 158, 11, 0.25)', label: 'Saved' };
      case 'APPLIED':
        return { bg: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', border: 'rgba(14, 165, 233, 0.25)', label: 'Applied' };
      case 'CLOSED':
        return { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280', border: 'rgba(156, 163, 175, 0.2)', label: 'Closed' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', border: 'rgba(100, 116, 139, 0.2)', label: statusStr };
    }
  };

  const style = getBadgeStyle(status);
  const isSm = size === 'sm';

  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: '9999px',
        padding: isSm ? '2px 8px' : '4px 10px',
        fontSize: isSm ? '0.72rem' : '0.8rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSm ? '5px' : '6px',
          height: isSm ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: style.color,
        }}
      />
      {style.label}
    </span>
  );
};
