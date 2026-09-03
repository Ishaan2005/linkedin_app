import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Clock,
  UserCheck,
  MessageSquare,
  Award,
  Briefcase,
  Calendar,
} from 'lucide-react';
import type { Company, Job, Lead, LeadFilterState, LeadStatus, UserSettings } from '../types';
import { StatsCard } from '../components/dashboard/StatsCard';
import { DailyGoalBanner } from '../components/dashboard/DailyGoalBanner';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadTable } from '../components/leads/LeadTable';
import { initialFilterState, LeadFilters } from '../components/leads/LeadFilters';

interface DashboardProps {
  leads: Lead[];
  jobs: Job[];
  companies: Company[];
  settings: UserSettings;
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
  onOpenDiscovery: () => void;
  onViewTodaysLeads: () => void;
  onViewJob: (job: Job) => void;
  onViewCompany: (company: Company) => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  jobs,
  companies,
  settings,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
  onOpenDiscovery,
  onViewTodaysLeads,
  onViewJob,
  onViewCompany,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<LeadFilterState>(initialFilterState);

  const todaysLeads = leads.filter((l) => l.isDailyLead);
  const targetCount = settings.dailyLeadTarget || 15;

  const contactedCount = todaysLeads.filter((l) =>
    ['CONNECTION_SENT', 'CONNECTED', 'MESSAGE_SENT', 'RESUME_SENT', 'FOLLOW_UP', 'REPLIED', 'INTERVIEW'].includes(
      l.status
    )
  ).length;

  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
  const totalContactedCount = leads.filter((l) =>
    ['CONNECTION_SENT', 'MESSAGE_SENT', 'RESUME_SENT', 'FOLLOW_UP'].includes(l.status)
  ).length;
  const connectedCount = leads.filter((l) => l.status === 'CONNECTED').length;
  const responsesCount = leads.filter((l) => l.status === 'REPLIED').length;
  const interviewsCount = leads.filter((l) => l.status === 'INTERVIEW').length;
  const applicationsCount = jobs.filter((j) => j.status === 'APPLIED' || j.status === 'INTERVIEW').length;
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const followUpsDueCount = leads.filter(
    (l) => l.followUpDate && l.followUpDate <= todayDateStr && l.status !== 'REJECTED' && l.status !== 'ARCHIVED'
  ).length;

  // Filter today's leads
  const availableCompanies = Array.from(new Set(todaysLeads.map((l) => l.company))).sort();

  const filteredTodaysLeads = todaysLeads.filter((lead) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        lead.name.toLowerCase().includes(q) ||
        lead.title.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.location.toLowerCase().includes(q) ||
        lead.technicalAreas.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filters.role !== 'all' && lead.roleCategory !== filters.role) return false;
    if (filters.technicalArea !== 'all' && !lead.technicalAreas.includes(filters.technicalArea as any)) return false;
    if (filters.location !== 'all' && !lead.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.company !== 'all' && lead.company !== filters.company) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.minScore > 0 && lead.relevanceScore < filters.minScore) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'relevance') return b.relevanceScore - a.relevanceScore;
    if (filters.sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (filters.sortBy === 'company') return a.company.localeCompare(b.company);
    if (filters.sortBy === 'lastContacted') return (b.lastContactedDate || '').localeCompare(a.lastContactedDate || '');
    if (filters.sortBy === 'followUpDate') return (a.followUpDate || '9999').localeCompare(b.followUpDate || '9999');
    return 0;
  });

  return (
    <div className="page-dashboard">
      {/* Top Daily Banner */}
      <DailyGoalBanner
        contactedCount={contactedCount}
        dailyTarget={targetCount}
        onOpenDiscovery={onOpenDiscovery}
        onViewTodaysLeads={onViewTodaysLeads}
      />

      {/* 7 Metric Stats Cards */}
      <section className="dashboard-stats-grid">
        <StatsCard
          label="New Leads"
          value={newLeadsCount}
          subtitle="Awaiting initial review"
          icon={<Users size={20} />}
          accentColor="#2563eb"
          onClick={() => onNavigateTab('all-leads')}
        />
        <StatsCard
          label="Contacted"
          value={totalContactedCount}
          subtitle="Outreach dispatched"
          icon={<Clock size={20} />}
          accentColor="#ea580c"
          onClick={() => onNavigateTab('outreach')}
        />
        <StatsCard
          label="Connected"
          value={connectedCount}
          subtitle="Network expanded"
          icon={<UserCheck size={20} />}
          accentColor="#059669"
          onClick={() => onNavigateTab('outreach')}
        />
        <StatsCard
          label="Responses"
          value={responsesCount}
          subtitle="Active conversations"
          icon={<MessageSquare size={20} />}
          accentColor="#0f766e"
          onClick={() => onNavigateTab('outreach')}
        />
        <StatsCard
          label="Interviews"
          value={interviewsCount}
          subtitle="Scheduled screenings"
          icon={<Award size={20} />}
          accentColor="#16a34a"
          onClick={() => onNavigateTab('outreach')}
        />
        <StatsCard
          label="Applications"
          value={applicationsCount}
          subtitle="Tracked positions"
          icon={<Briefcase size={20} />}
          accentColor="#7c3aed"
          onClick={() => onNavigateTab('jobs')}
        />
        <StatsCard
          label="Follow-ups Due"
          value={followUpsDueCount}
          subtitle={followUpsDueCount > 0 ? "Requires action today" : "Pipeline up to date"}
          icon={<Calendar size={20} />}
          accentColor="#b45309"
          onClick={() => onNavigateTab('outreach')}
        />
      </section>

      {/* Main Content Section: Today's 15 Leads */}
      <section className="dashboard-main-section">
        <div className="section-header-bar">
          <div>
            <div className="section-tag">
              <Sparkles size={14} />
              <span>Today's Batch</span>
            </div>
            <h2 className="section-title">Today's Priority Connections ({todaysLeads.length})</h2>
            <p className="section-subtitle">
              Ranked ASIC Managers, RTL Leads, and Silicon Recruiters for your daily outreach target.
            </p>
          </div>

          <div className="section-actions">
            <button className="btn-secondary" onClick={onOpenDiscovery}>
              <Sparkles size={15} />
              <span>Refresh Discovery</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <LeadFilters
          filters={filters}
          onFilterChange={setFilters}
          availableCompanies={availableCompanies}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalCount={todaysLeads.length}
          filteredCount={filteredTodaysLeads.length}
        />

        {/* Lead List / Table */}
        {filteredTodaysLeads.length === 0 ? (
          <div className="empty-leads-card">
            <Users size={36} className="empty-icon" />
            <h3>No leads found matching current filters</h3>
            <p>Try clearing or broadening your search keywords and filter selections.</p>
            <button
              className="btn-secondary btn-sm mt-3"
              onClick={() => setFilters(initialFilterState)}
            >
              Reset all filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="leads-cards-grid">
            {filteredTodaysLeads.map((lead) => {
              const job = jobs.find((j) => j.id === lead.associatedJobId);
              const company = companies.find(
                (c) => c.name.toLowerCase() === lead.company.toLowerCase()
              );
              return (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  associatedJob={job}
                  associatedCompany={company}
                  onSelectLead={onSelectLead}
                  onUpdateStatus={onUpdateStatus}
                  onGenerateMessage={onGenerateMessage}
                  onViewJob={onViewJob}
                  onViewCompany={onViewCompany}
                />
              );
            })}
          </div>
        ) : (
          <LeadTable
            leads={filteredTodaysLeads}
            onSelectLead={onSelectLead}
            onUpdateStatus={onUpdateStatus}
            onGenerateMessage={onGenerateMessage}
          />
        )}
      </section>
    </div>
  );
};
