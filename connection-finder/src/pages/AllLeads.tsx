import React, { useState } from 'react';
import {
  Users,
  Upload,
  Download,
} from 'lucide-react';
import type { Company, Job, Lead, LeadFilterState, LeadStatus, UserSettings } from '../types';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadTable } from '../components/leads/LeadTable';
import { initialFilterState, LeadFilters } from '../components/leads/LeadFilters';

interface AllLeadsProps {
  leads: Lead[];
  jobs: Job[];
  companies: Company[];
  settings: UserSettings;
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
  onOpenImport: () => void;
  onExportCsv: () => void;
  onViewJob: (job: Job) => void;
  onViewCompany: (company: Company) => void;
}

export const AllLeads: React.FC<AllLeadsProps> = ({
  leads,
  jobs,
  companies,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
  onOpenImport,
  onExportCsv,
  onViewJob,
  onViewCompany,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<LeadFilterState>(initialFilterState);

  const availableCompanies = Array.from(new Set(leads.map((l) => l.company))).sort();

  const filteredLeads = leads.filter((lead) => {
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
    <div className="page-all-leads">
      {/* Top Header Card */}
      <div className="page-header-card">
        <div className="page-header-info">
          <div className="page-tag">
            <Users size={14} />
            <span>Complete Talent Directory</span>
          </div>
          <h2>All Discovered Leads ({leads.length})</h2>
          <p>
            Browse, search, and manage your complete semiconductor contact database across all companies, roles, and outreach statuses.
          </p>
        </div>

        <div className="header-page-actions">
          <button className="btn-secondary" onClick={onOpenImport}>
            <Upload size={15} />
            <span>Import Leads</span>
          </button>
          <button className="btn-secondary" onClick={onExportCsv}>
            <Download size={15} />
            <span>Export CSV</span>
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
        totalCount={leads.length}
        filteredCount={filteredLeads.length}
      />

      {/* Content */}
      {filteredLeads.length === 0 ? (
        <div className="empty-leads-card">
          <Users size={40} className="empty-icon" />
          <h3>No leads match your filter parameters</h3>
          <p>Try resetting filters or import new candidate contacts from CSV.</p>
          <div className="empty-actions mt-3">
            <button
              className="btn-secondary"
              onClick={() => setFilters(initialFilterState)}
            >
              Reset filters
            </button>
            <button className="btn-primary" onClick={onOpenImport}>
              <Upload size={15} />
              <span>Import Leads from CSV</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="leads-cards-grid">
          {filteredLeads.map((lead) => {
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
          leads={filteredLeads}
          onSelectLead={onSelectLead}
          onUpdateStatus={onUpdateStatus}
          onGenerateMessage={onGenerateMessage}
        />
      )}
    </div>
  );
};
