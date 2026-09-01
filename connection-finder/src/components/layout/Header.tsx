import React from 'react';
import {
  Menu,
  Sparkles,
  Upload,
  Download,
  Calendar,
} from 'lucide-react';
import type { ActiveTab } from '../../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenDiscovery: () => void;
  onOpenImport: () => void;
  onExportCsv: () => void;
  onToggleMobileMenu: () => void;
  isDiscovering?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenDiscovery,
  onOpenImport,
  onExportCsv,
  onToggleMobileMenu,
  isDiscovering = false,
}) => {
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Daily Networking Dashboard',
          subtitle: 'Track your ECE/VLSI job outreach, active leads, and follow-ups.',
        };
      case 'todays-leads':
        return {
          title: "Today's 15 Recommended Connections",
          subtitle: 'Prioritized hiring managers, RTL/ASIC leads, and semiconductor recruiters for today.',
        };
      case 'all-leads':
        return {
          title: 'All Discovered Leads & Database',
          subtitle: 'Search, filter, and manage your complete semiconductor talent & hiring directory.',
        };
      case 'companies':
        return {
          title: 'Target Semiconductor Companies',
          subtitle: 'Explore semiconductor tiers, active hiring hubs, and company-specific contacts.',
        };
      case 'jobs':
        return {
          title: 'Active Hardware & VLSI Job Openings',
          subtitle: 'Link verified professional contacts directly to active job requisitions.',
        };
      case 'outreach':
        return {
          title: 'Outreach CRM Pipeline',
          subtitle: 'Move leads across stages: connection sent, messages, resumes, follow-ups, and interviews.',
        };
      case 'settings':
        return {
          title: 'Settings & Candidate Profile',
          subtitle: 'Configure target roles, skills, companies, locations, and personal project portfolio.',
        };
    }
  };

  const { title, subtitle } = getTabTitle(activeTab);
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-hamburger-btn"
          onClick={onToggleMobileMenu}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-headings">
          <div className="header-date-badge">
            <Calendar size={13} />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn-secondary btn-sm"
          onClick={onOpenImport}
          title="Import leads from CSV"
        >
          <Upload size={15} />
          <span>Import CSV</span>
        </button>

        <button
          className="btn-secondary btn-sm"
          onClick={onExportCsv}
          title="Export current leads to CSV"
        >
          <Download size={15} />
          <span>Export CSV</span>
        </button>

        <button
          className="btn-primary"
          onClick={onOpenDiscovery}
          disabled={isDiscovering}
        >
          <Sparkles size={16} className={isDiscovering ? 'spin-icon' : ''} />
          <span>Find today's 15</span>
        </button>
      </div>
    </header>
  );
};
