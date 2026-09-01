import React from 'react';
import type { ScoreBreakdown } from '../../types';

interface ScoreBadgeProps {
  score: number;
  breakdown?: ScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  breakdown,
  size = 'md',
  showLabel = true,
}) => {
  const getScoreTheme = (val: number) => {
    if (val >= 90) {
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        text: '#059669',
        border: 'rgba(16, 185, 129, 0.3)',
        pillBg: '#10b981',
      };
    }
    if (val >= 80) {
      return {
        bg: 'rgba(59, 130, 246, 0.1)',
        text: '#2563eb',
        border: 'rgba(59, 130, 246, 0.3)',
        pillBg: '#3b82f6',
      };
    }
    if (val >= 70) {
      return {
        bg: 'rgba(99, 102, 241, 0.1)',
        text: '#4f46e5',
        border: 'rgba(99, 102, 241, 0.3)',
        pillBg: '#6366f1',
      };
    }
    return {
      bg: 'rgba(217, 119, 6, 0.1)',
      text: '#b45309',
      border: 'rgba(217, 119, 6, 0.3)',
      pillBg: '#d97706',
    };
  };

  const theme = getScoreTheme(score);

  if (size === 'sm') {
    return (
      <span
        title={breakdown?.summaryExplanation || `Relevance score: ${score}/100`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: theme.bg,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: '6px',
          padding: '2px 6px',
          fontSize: '0.75rem',
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        <span>{score}</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 500 }}>
          /100
        </span>
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.bg,
          border: `1.5px solid ${theme.border}`,
          borderRadius: '10px',
          padding: '8px 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>/100</span>
        </div>
        {showLabel && (
          <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
            Relevance score
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      title={breakdown?.summaryExplanation || `Relevance score: ${score}/100`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '4px 10px',
      }}
    >
      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: theme.text, lineHeight: 1 }}>
        {score}
      </span>
      {showLabel && (
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em' }}>
          match
        </span>
      )}
    </div>
  );
};
