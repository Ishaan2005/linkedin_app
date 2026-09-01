import React, { useState } from 'react';
import {
  Briefcase,
  ExternalLink,
  Users,
  Search,
  Plus,
  Calendar,
} from 'lucide-react';
import type { Job, JobStatus, Lead } from '../types';

interface JobsPageProps {
  jobs: Job[];
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateJobStatus: (jobId: string, status: JobStatus) => void;
  onAddNewJob: (job: Omit<Job, 'id'>) => void;
}

export const JobsPage: React.FC<JobsPageProps> = ({
  jobs,
  leads,
  onSelectLead,
  onUpdateJobStatus,
  onAddNewJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Job form state
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('AMD');
  const [newLocation, setNewLocation] = useState('Bangalore, India');
  const [newUrl, setNewUrl] = useState('https://example.com/careers');
  const [newSkills, setNewSkills] = useState('Verilog, RTL, SystemVerilog');
  const [newDesc, setNewDesc] = useState('');

  const filteredJobs = jobs.filter((job) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (
      skillFilter !== 'all' &&
      !job.requiredSkills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))
    )
      return false;
    return true;
  });

  const getContactsForJob = (job: Job) => {
    const directIds = job.associatedContactIds || [];
    const directContacts = leads.filter((l) => directIds.includes(l.id));
    const companyContacts = leads.filter(
      (l) =>
        l.company.toLowerCase() === job.company.toLowerCase() &&
        !directIds.includes(l.id)
    );
    return [...directContacts, ...companyContacts];
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    onAddNewJob({
      title: newTitle.trim(),
      company: newCompany.trim(),
      location: newLocation.trim() || 'Bangalore, India',
      url: newUrl.trim() || 'https://example.com/careers',
      description: newDesc.trim() || 'Hardware engineering requisition.',
      requiredSkills: newSkills.split(',').map((s) => s.trim()).filter(Boolean),
      dateDiscovered: new Date().toISOString().split('T')[0],
      status: 'NEW',
      salaryRange: 'Competitive',
      experienceLevel: '0-3 Years',
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const allJobStatuses: JobStatus[] = [
    'NEW',
    'SAVED',
    'APPLIED',
    'INTERVIEW',
    'REJECTED',
    'CLOSED',
  ];

  return (
    <div className="page-jobs">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <div className="page-tag">
            <Briefcase size={14} />
            <span>Active Opportunities</span>
          </div>
          <h2>Hardware & VLSI Job Requisitions ({jobs.length})</h2>
          <p>
            Connect directly with hiring managers and technical recruiters associated with active silicon openings.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Add Custom Job</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="lead-filters-panel">
        <div className="filters-top-row">
          <div className="search-input-wrap">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search jobs by title, company, skills (e.g. Verilog, UVM, RISC-V)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-controls-grid">
          <div className="filter-item">
            <label className="filter-label">Job Application Status</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Application Statuses</option>
              <option value="NEW">New</option>
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Skill Requirement</label>
            <select
              className="filter-select"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="all">All Skills</option>
              <option value="Verilog">Verilog</option>
              <option value="SystemVerilog">SystemVerilog</option>
              <option value="RTL">RTL</option>
              <option value="ASIC">ASIC</option>
              <option value="AMBA APB">AMBA APB</option>
              <option value="RISC-V">RISC-V</option>
              <option value="Physical Design">Physical Design</option>
              <option value="Design Verification">Design Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="jobs-list-container">
        {filteredJobs.map((job) => {
          const associatedContacts = getContactsForJob(job);

          return (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div className="job-title-group">
                  <div className="job-company-row">
                    <span className="job-company-badge">🏢 {job.company}</span>
                    <span className="job-location-badge">📍 {job.location}</span>
                    {job.salaryRange && (
                      <span className="job-salary-badge">💰 {job.salaryRange}</span>
                    )}
                  </div>
                  <h3 className="job-title">{job.title}</h3>
                </div>

                <div className="job-status-control">
                  <select
                    className="job-status-select"
                    value={job.status}
                    onChange={(e) =>
                      onUpdateJobStatus(job.id, e.target.value as JobStatus)
                    }
                  >
                    {allJobStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="job-description">{job.description}</p>

              {/* Required Skills */}
              <div className="job-skills-wrap">
                <span className="skills-label">Required:</span>
                {job.requiredSkills.map((sk) => (
                  <span key={sk} className="skill-pill">
                    {sk}
                  </span>
                ))}
              </div>

              {/* Associated Contacts Section */}
              <div className="job-associated-contacts-section">
                <div className="associated-contacts-header">
                  <Users size={14} />
                  <span>
                    Linked Hiring Team & Contacts ({associatedContacts.length}):
                  </span>
                </div>

                {associatedContacts.length === 0 ? (
                  <div className="no-contacts-snippet">
                    No verified contacts linked yet. Search leads to associate.
                  </div>
                ) : (
                  <div className="associated-contacts-chips-grid">
                    {associatedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="associated-contact-chip clickable"
                        onClick={() => onSelectLead(contact)}
                        title={`Click to view ${contact.name} profile & draft message`}
                      >
                        <div className="chip-avatar">
                          {(contact.name[0] || 'C').toUpperCase()}
                        </div>
                        <div className="chip-info">
                          <span className="chip-name">{contact.name}</span>
                          <span className="chip-role">{contact.title}</span>
                        </div>
                        <span className="chip-score">{contact.relevanceScore}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Footer Actions */}
              <div className="job-card-footer">
                <div className="job-date-text">
                  <Calendar size={12} />
                  <span>Discovered: {job.dateDiscovered}</span>
                </div>

                <div className="job-footer-btns">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm"
                  >
                    <span>Job Posting</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Job Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="csv-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <div className="modal-icon-badge">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="modal-title">Track New Hardware Job Opening</h2>
                  <p className="modal-subtitle">
                    Add a job posting and associate it with networking contacts.
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="input-label">Job Title *</label>
                  <input
                    type="text"
                    required
                    className="input-text"
                    placeholder="e.g. RTL Design Engineer (SoC Subsystem)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="input-label">Company Name *</label>
                    <input
                      type="text"
                      required
                      className="input-text"
                      placeholder="e.g. AMD, Qualcomm, NVIDIA"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Location</label>
                    <input
                      type="text"
                      className="input-text"
                      placeholder="e.g. Bangalore, India"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Posting URL</label>
                  <input
                    type="url"
                    className="input-text"
                    placeholder="https://example.com/careers/job-id"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">
                    Required Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="Verilog, SystemVerilog, AMBA APB, RTL Synthesis"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Description / Requisition Summary</label>
                  <textarea
                    className="input-text"
                    rows={3}
                    placeholder="Key responsibilities, team scope, or referral points..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <span>Save Job Opportunity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
