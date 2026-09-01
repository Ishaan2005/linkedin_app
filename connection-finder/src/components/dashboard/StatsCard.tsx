import React from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accentColor = '#2563eb',
  onClick,
}) => {
  return (
    <div
      className={`stats-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stats-card-top">
        <span className="stats-card-label">{label}</span>
        <div
          className="stats-card-icon-wrap"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
      </div>

      <div className="stats-card-value">{value}</div>

      {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}
    </div>
  );
};
