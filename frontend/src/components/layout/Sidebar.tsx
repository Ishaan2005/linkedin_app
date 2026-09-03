import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  Building2,
  Briefcase,
  Send,
  Settings,
  X,
  Target,
  ShieldCheck,
} from 'lucide-react';
import type { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todaysCount: number;
  contactedTodayCount: number;
  dailyTarget: number;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  todaysCount,
  contactedTodayCount,
  dailyTarget,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'todays-leads',
      label: "Today's Leads",
      icon: <Sparkles size={18} />,
      badge: todaysCount > 0 ? todaysCount : undefined,
    },
    {
      id: 'all-leads',
      label: 'All Leads',
      icon: <Users size={18} />,
    },
    {
      id: 'companies',
      label: 'Companies',
      icon: <Building2 size={18} />,
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: <Briefcase size={18} />,
    },
    {
      id: 'outreach',
      label: 'Outreach CRM',
      icon: <Send size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpenMobile(false);
  };

  const progressPercent = Math.min(100, Math.round((contactedTodayCount / (dailyTarget || 15)) * 100));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon-wrap">
              <Users size={20} />
            </div>
            <div>
              <div className="logo-title">Connection Finder</div>
              <div className="logo-subtitle">ECE & VLSI Career Assistant</div>
            </div>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setIsOpenMobile(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="demo-notice-tag">
          <ShieldCheck size={13} />
          <span>Demo data active</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`nav-badge ${isActive ? 'active' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="daily-progress-card">
            <div className="progress-header">
              <span className="progress-title">
                <Target size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Daily Target
              </span>
              <span className="progress-value">
                <strong>{contactedTodayCount}</strong> / {dailyTarget}
              </span>
            </div>

            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="progress-footer-text">
              {contactedTodayCount >= dailyTarget ? (
                <span style={{ color: '#059669', fontWeight: 600 }}>🎉 Daily goal reached!</span>
              ) : (
                <span>{dailyTarget - contactedTodayCount} more to reach daily goal</span>
              )}
            </div>
          </div>

          <div className="sidebar-user-pill">
            <div className="user-avatar-sm">AP</div>
            <div className="user-info-text">
              <div className="user-name">Aarav Patel</div>
              <div className="user-role">ECE / VLSI Candidate</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
