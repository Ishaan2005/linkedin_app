import React, { useState } from 'react';
import {
  Building2,
  ExternalLink,
  Users,
  Briefcase,
  Search,
  Bookmark,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import type { Company, Job, Lead } from '../types';
import { LinkedinBadge } from '../components/common/LinkedinBadge';

interface CompaniesPageProps {
  companies: Company[];
  leads: Lead[];
  jobs: Job[];
  onSelectLead: (lead: Lead) => void;
  onSelectJob: (job: Job) => void;
  onToggleSaveCompany: (companyId: string) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({
  companies,
  leads,
  jobs,
  onSelectLead,
  onSelectJob,
  onToggleSaveCompany,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [activeCompanyModal, setActiveCompanyModal] = useState<Company | null>(null);

  const filteredCompanies = companies.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.techFocus.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedTier !== 'all' && c.tier !== selectedTier) return false;
    if (selectedTech !== 'all' && !c.techFocus.includes(selectedTech as any)) return false;
    return true;
  });

  const getContactsForCompany = (compName: string) => {
    return leads.filter(
      (l) => l.company.toLowerCase() === compName.toLowerCase()
    );
  };

  const getJobsForCompany = (compName: string) => {
    return jobs.filter(
      (j) => j.company.toLowerCase() === compName.toLowerCase()
    );
  };

  return (
    <div className="page-companies">
      {/* Top Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <div className="page-tag">
            <Building2 size={14} />
            <span>Semiconductor Ecosystem</span>
          </div>
          <h2>Target Semiconductor Companies ({companies.length})</h2>
          <p>
            Track key silicon innovators, Tier 1 semiconductor firms, and fabless ASIC design teams with active India hiring centers.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="lead-filters-panel">
        <div className="filters-top-row">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search companies by name, domain, tech focus (e.g. RISC-V, ASIC, EDA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-controls-grid">
          <div className="filter-item">
            <label className="filter-label">Tier / Priority</label>
            <select
              className="filter-select"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="Tier 1">Tier 1 Leaders</option>
              <option value="Tier 2">Tier 2 Fabless</option>
              <option value="Target">Target Focus</option>
              <option value="Startup">Hardware Startups</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Tech Specialization</label>
            <select
              className="filter-select"
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
            >
              <option value="all">All Specializations</option>
              <option value="ASIC">ASIC</option>
              <option value="RTL">RTL</option>
              <option value="SoC">SoC</option>
              <option value="VLSI">VLSI</option>
              <option value="Physical Design">Physical Design</option>
              <option value="Design Verification">Design Verification</option>
              <option value="EDA">EDA</option>
              <option value="RISC-V">RISC-V</option>
              <option value="AI Hardware">AI Hardware</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="companies-grid">
        {filteredCompanies.map((company) => {
          const compContacts = getContactsForCompany(company.name);
          const compJobs = getJobsForCompany(company.name);

          return (
            <div
              key={company.id}
              className="company-card"
              onClick={() => setActiveCompanyModal(company)}
            >
              <div className="company-card-header">
                <div>
                  <div className="company-tier-tag">{company.tier}</div>
                  <h3 className="company-name">{company.name}</h3>
                  <p className="company-industry">{company.industry}</p>
                </div>

                <button
                  className={`btn-save-comp ${company.isSaved ? 'saved' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSaveCompany(company.id);
                  }}
                  title={company.isSaved ? 'Saved company' : 'Bookmark company'}
                >
                  <Bookmark size={16} fill={company.isSaved ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="company-location">📍 {company.location}</div>
              <p className="company-desc">{company.description}</p>

              {/* Tech Focus Tags */}
              <div className="company-tech-tags">
                {company.techFocus.map((tech) => (
                  <span key={tech} className="skill-pill">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Stats Counters */}
              <div className="company-stats-row">
                <div className="comp-stat-pill">
                  <Users size={13} />
                  <span>
                    <strong>{compContacts.length}</strong> Contacts
                  </span>
                </div>

                <div className="comp-stat-pill">
                  <Briefcase size={13} />
                  <span>
                    <strong>{compJobs.length}</strong> Openings
                  </span>
                </div>

                <div className="comp-stat-pill date">
                  <Calendar size={12} />
                  <span>{company.lastResearched}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div
                className="company-actions-bar"
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-xs"
                >
                  <span>Website</span>
                  <ExternalLink size={12} />
                </a>

                <a
                  href={company.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-xs"
                >
                  <LinkedinBadge size={13} showText={true} />
                  <ExternalLink size={12} />
                </a>

                <button
                  className="btn-secondary btn-xs ml-auto"
                  onClick={() => setActiveCompanyModal(company)}
                >
                  <span>View Details</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Company Details Modal */}
      {activeCompanyModal && (
        <div className="modal-backdrop" onClick={() => setActiveCompanyModal(null)}>
          <div
            className="lead-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon-badge">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="modal-title-row">
                    <h2 className="modal-lead-name">{activeCompanyModal.name}</h2>
                    <span className="company-tier-tag">{activeCompanyModal.tier}</span>
                  </div>
                  <p className="modal-lead-title">{activeCompanyModal.industry}</p>
                  <div className="modal-subtitle-tags">
                    <span>📍 {activeCompanyModal.location}</span>
                  </div>
                </div>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setActiveCompanyModal(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-scroll">
              <div className="modal-quick-actions">
                <a
                  href={activeCompanyModal.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <span>Open Official Website</span>
                  <ExternalLink size={14} />
                </a>

                <a
                  href={activeCompanyModal.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  <LinkedinBadge size={15} />
                  <span>LinkedIn Company Page</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Associated Contacts list */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Users size={16} />
                  <span>
                    Linked Contacts at {activeCompanyModal.name} (
                    {getContactsForCompany(activeCompanyModal.name).length})
                  </span>
                </div>

                <div className="company-modal-contacts-list">
                  {getContactsForCompany(activeCompanyModal.name).map((lead) => (
                    <div
                      key={lead.id}
                      className="company-modal-contact-row clickable"
                      onClick={() => {
                        setActiveCompanyModal(null);
                        onSelectLead(lead);
                      }}
                    >
                      <div className="contact-row-left">
                        <div className="table-avatar">
                          {(lead.name[0] || 'C').toUpperCase()}
                        </div>
                        <div>
                          <strong className="lead-name-link">{lead.name}</strong>
                          <p className="lead-title-sub">{lead.title}</p>
                        </div>
                      </div>

                      <div className="contact-row-right">
                        <span className="score-pill-mini">
                          {lead.relevanceScore}/100 match
                        </span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Jobs list */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Briefcase size={16} />
                  <span>
                    Active Hardware Openings (
                    {getJobsForCompany(activeCompanyModal.name).length})
                  </span>
                </div>

                <div className="company-modal-jobs-list">
                  {getJobsForCompany(activeCompanyModal.name).map((job) => (
                    <div
                      key={job.id}
                      className="company-modal-job-card clickable"
                      onClick={() => {
                        setActiveCompanyModal(null);
                        onSelectJob(job);
                      }}
                    >
                      <div className="job-card-top-row">
                        <h4 className="job-title-highlight">{job.title}</h4>
                        <span className="job-salary-tag">{job.salaryRange || 'Competitive'}</span>
                      </div>
                      <p className="job-desc-snippet">{job.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
