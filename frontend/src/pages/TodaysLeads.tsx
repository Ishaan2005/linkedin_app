import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Target,
} from 'lucide-react';
import type { Company, Job, Lead, LeadFilterState, LeadStatus, UserSettings } from '../types';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadTable } from '../components/leads/LeadTable';
import { initialFilterState, LeadFilters } from '../components/leads/LeadFilters';

interface TodaysLeadsProps {
  leads: Lead[];
  jobs: Job[];
  companies: Company[];
  settings: UserSettings;
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
  onOpenDiscovery: () => void;
  onViewJob: (job: Job) => void;
  onViewCompany: (company: Company) => void;
}

export const TodaysLeads: React.FC<TodaysLeadsProps> = ({
  leads,
  jobs,
  companies,
  settings,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
  onOpenDiscovery,
  onViewJob,
  onViewCompany,
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
    <div className="page-todays-leads">
      {/* Header bar */}
      <div className="page-header-card">
        <div className="page-header-info">
          <div className="page-tag">
            <Target size={14} />
            <span>Daily Goal Focus</span>
          </div>
          <h2>Today's {targetCount} Recommended Connections</h2>
          <p>
            Your handpicked pipeline of hiring managers, RTL leads, and verification directors for today's outreach session.
          </p>
        </div>

        <div className="daily-stats-summary-pill">
          <div className="summary-col">
            <span className="col-label">Today's Target</span>
            <span className="col-val">{targetCount} leads</span>
          </div>
          <div className="summary-col">
            <span className="col-label">Progress</span>
            <span className="col-val">{contactedCount} / {targetCount} contacted</span>
          </div>
          <button
            className="btn-primary btn-sm"
            onClick={onOpenDiscovery}
            title="Safely rescore and regenerate today's top recommended connections"
          >
            <Sparkles size={14} />
            <span>Regenerate Today's Leads</span>
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

      {/* Content */}
      {filteredTodaysLeads.length === 0 ? (
        <div className="empty-leads-card">
          <Users size={40} className="empty-icon" />
          <h3>No leads match your filter criteria</h3>
          <p>Try resetting filters or click "Find today's 15" to discover new leads.</p>
          <div className="empty-actions mt-3">
            <button
              className="btn-secondary"
              onClick={() => setFilters(initialFilterState)}
            >
              Reset filters
            </button>
            <button className="btn-primary" onClick={onOpenDiscovery}>
              <Sparkles size={15} />
              <span>Find today's 15</span>
            </button>
          </div>
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
    </div>
  );
};
