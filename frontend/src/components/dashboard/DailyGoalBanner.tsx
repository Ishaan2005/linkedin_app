import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface DailyGoalBannerProps {
  contactedCount: number;
  dailyTarget: number;
  onOpenDiscovery: () => void;
  onViewTodaysLeads: () => void;
}

export const DailyGoalBanner: React.FC<DailyGoalBannerProps> = ({
  contactedCount,
  dailyTarget,
  onOpenDiscovery,
  onViewTodaysLeads,
}) => {
  const percent = Math.min(100, Math.round((contactedCount / (dailyTarget || 15)) * 100));

  return (
    <div className="daily-goal-banner">
      <div className="daily-goal-content">
        <div className="daily-goal-badge">
          <TrendingUp size={14} />
          <span>Daily Outreach Engine</span>
        </div>
        <h2 className="daily-goal-title">
          Good day! Your networking pipeline is ready.
        </h2>
        <p className="daily-goal-desc">
          Reach out to <strong>{dailyTarget} high-relevance contacts</strong> today to build referrals in ASIC design, RTL engineering, and VLSI verification teams.
        </p>

        <div className="daily-goal-progress-wrap">
          <div className="daily-goal-bar-bg">
            <div className="daily-goal-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="daily-goal-stats-row">
            <span>
              <strong>{contactedCount}</strong> of {dailyTarget} contacted today ({percent}%)
            </span>
            <span>{Math.max(0, dailyTarget - contactedCount)} remaining today</span>
          </div>
        </div>

        <div className="daily-goal-actions">
          <button className="btn-primary" onClick={onOpenDiscovery}>
            <Sparkles size={16} />
            <span>Discover Today's 15</span>
          </button>

          <button className="btn-secondary" onClick={onViewTodaysLeads}>
            <span>View Today's Leads</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
