import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Archive,
  Save,
  Award,
} from 'lucide-react';
import type { Company, Job, Lead, LeadStatus, OutreachEvent } from '../../types';
import { LinkedinBadge } from '../common/LinkedinBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ScoreBadge } from '../common/ScoreBadge';

interface LeadDetailsModalProps {
  lead: Lead | null;
  associatedJob?: Job;
  associatedCompany?: Company;
  outreachEvents: OutreachEvent[];
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: LeadStatus, note?: string) => void;
  onUpdateNotes: (leadId: string, notes: string) => void;
  onUpdateFollowUpDate: (leadId: string, date: string) => void;
  onGenerateMessage: (lead: Lead) => void;
  onViewJob?: (job: Job) => void;
  onViewCompany?: (company: Company) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  associatedJob,
  associatedCompany,
  outreachEvents,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateFollowUpDate,
  onGenerateMessage,
  onViewJob,
  onViewCompany,
}) => {
  if (!lead) return null;

  const [notesText, setNotesText] = useState(lead.notes || '');
  const [followUpDateInput, setFollowUpDateInput] = useState(lead.followUpDate || '');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (lead) {
      setNotesText(lead.notes || '');
      setFollowUpDateInput(lead.followUpDate || '');
    }
  }, [lead?.id, lead?.notes, lead?.followUpDate]);

  const filteredEvents = outreachEvents.filter((e) => e.leadId === lead.id);

  const handleCopyEmail = () => {
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSaveNotes = async () => {
    await onUpdateNotes(lead.id, notesText);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleSaveFollowUp = async (newDate: string) => {
    setFollowUpDateInput(newDate);
    await onUpdateFollowUpDate(lead.id, newDate);
  };

  const allStatuses: LeadStatus[] = [
    'NEW',
    'REVIEWED',
    'CONNECTION_SENT',
    'CONNECTED',
    'MESSAGE_SENT',
    'RESUME_SENT',
    'FOLLOW_UP',
    'REPLIED',
    'INTERVIEW',
    'REJECTED',
    'ARCHIVED',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="lead-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-avatar">
              {(lead.name[0] || 'C').toUpperCase()}
            </div>
            <div>
              <div className="modal-title-row">
                <h2 className="modal-lead-name">{lead.name}</h2>
                <StatusBadge status={lead.status} />
              </div>
              <p className="modal-lead-title">{lead.title}</p>
              <div className="modal-subtitle-tags">
                <span>🏢 {lead.company}</span>
                <span>📍 {lead.location}</span>
                <span className="role-tag">{lead.roleCategory}</span>
              </div>
            </div>
          </div>

          <div className="modal-header-actions">
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroll">
          {/* Quick Actions Bar */}
          <div className="modal-quick-actions">
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              title="Open profile on LinkedIn"
            >
              <LinkedinBadge size={16} />
              <ExternalLink size={14} />
            </a>

            {lead.email && lead.emailConfidence !== 'Unknown' && (
              <a
                href={`mailto:${lead.email}?subject=VLSI%20Engineering%20Inquiry%20-%20ECE%20Candidate`}
                className="btn-secondary"
              >
                <Mail size={15} />
                <span>Open Email Client</span>
              </a>
            )}

            <button
              className="btn-accent"
              onClick={() => onGenerateMessage(lead)}
            >
              <Sparkles size={15} />
              <span>Generate AI Message Draft</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() =>
                onUpdateStatus(
                  lead.id,
                  lead.status === 'ARCHIVED' ? 'NEW' : 'ARCHIVED'
                )
              }
            >
              <Archive size={15} />
              <span>
                {lead.status === 'ARCHIVED' ? 'Unarchive' : 'Archive Lead'}
              </span>
            </button>
          </div>

          {/* Grid Layout: 2 Columns */}
          <div className="modal-grid-2col">
            {/* Left Column: Profile, Scoring, Association, Email */}
            <div className="modal-col-main">
              {/* Relevance Score & Transparent Breakdown */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Award size={16} />
                  <span>Relevance Score & Rationale</span>
                </div>

                <div className="relevance-score-box">
                  <ScoreBadge
                    score={lead.relevanceScore}
                    breakdown={lead.scoreBreakdown}
                    size="lg"
                  />
                  <div className="score-summary-text">
                    <p className="score-main-reason">
                      {lead.recommendationReason}
                    </p>
                    <p className="score-disclaimer">
                      * Score is calculated transparently based on role authority, hardware technical alignment, target company status, and active job linkages.
                    </p>
                  </div>
                </div>

                {lead.scoreBreakdown && (
                  <div className="score-breakdown-table">
                    <div className="breakdown-row">
                      <span className="factor-name">Role Authority:</span>
                      <span className="factor-pts">+{lead.scoreBreakdown.rolePoints} pts</span>
                      <span className="factor-desc">{lead.scoreBreakdown.roleReason}</span>
                    </div>
                    <div className="breakdown-row">
                      <span className="factor-name">Technical Area:</span>
                      <span className="factor-pts">+{lead.scoreBreakdown.technicalPoints} pts</span>
                      <span className="factor-desc">{lead.scoreBreakdown.technicalReason}</span>
                    </div>
                    <div className="breakdown-row">
                      <span className="factor-name">Target Company:</span>
                      <span className="factor-pts">+{lead.scoreBreakdown.companyPoints} pts</span>
                      <span className="factor-desc">{lead.scoreBreakdown.companyReason}</span>
                    </div>
                    <div className="breakdown-row">
                      <span className="factor-name">Active Job Link:</span>
                      <span className="factor-pts">+{lead.scoreBreakdown.jobPoints} pts</span>
                      <span className="factor-desc">{lead.scoreBreakdown.jobReason}</span>
                    </div>
                    <div className="breakdown-row">
                      <span className="factor-name">Location Hub:</span>
                      <span className="factor-pts">+{lead.scoreBreakdown.locationPoints} pts</span>
                      <span className="factor-desc">{lead.scoreBreakdown.locationReason}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Areas */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Sparkles size={16} />
                  <span>Technical Areas & Specializations</span>
                </div>
                <div className="skills-tags-wrap">
                  {lead.technicalAreas.map((area) => (
                    <span key={area} className="skill-tag-lg">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Verified Professional Email Details */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Mail size={16} />
                  <span>Public / Professional Email</span>
                </div>

                {lead.email && lead.emailConfidence !== 'Unknown' ? (
                  <div className="email-details-box">
                    <div className="email-row">
                      <code className="email-address">{lead.email}</code>
                      <button
                        className="btn-copy-email"
                        onClick={handleCopyEmail}
                        title="Copy email to clipboard"
                      >
                        {copiedEmail ? (
                          <>
                            <Check size={14} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="email-meta-chips">
                      <span className="meta-chip">
                        Source: <strong>{lead.emailSource || 'Public directory'}</strong>
                      </span>
                      <span className="meta-chip verified">
                        Confidence: <strong>{lead.emailConfidence || 'Public'}</strong>
                      </span>
                    </div>
                    <p className="email-disclaimer">
                      * This email was discovered from public sources or company website disclosures. Private email addresses are never estimated or guessed.
                    </p>
                  </div>
                ) : (
                  <div className="no-email-box">
                    <p>No verified public email address available for this contact.</p>
                    <span className="no-email-sub">
                      Reach out directly via LinkedIn message or connection note.
                    </span>
                  </div>
                )}
              </div>

              {/* Associated Company & Job Cards */}
              {(associatedJob || associatedCompany) && (
                <div className="modal-card">
                  <div className="card-section-title">
                    <Building2 size={16} />
                    <span>Linked Opportunities</span>
                  </div>

                  {associatedCompany && (
                    <div
                      className="linked-card clickable"
                      onClick={() => onViewCompany && onViewCompany(associatedCompany)}
                    >
                      <div className="linked-card-header">
                        <div>
                          <strong>{associatedCompany.name}</strong>
                          <p>{associatedCompany.industry}</p>
                        </div>
                        <a
                          href={associatedCompany.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="icon-link-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}

                  {associatedJob && (
                    <div
                      className="linked-card clickable mt-2"
                      onClick={() => onViewJob && onViewJob(associatedJob)}
                    >
                      <div className="linked-card-header">
                        <div>
                          <span className="badge-job">Associated Requisition</span>
                          <strong>{associatedJob.title}</strong>
                          <p>
                            {associatedJob.location} • {associatedJob.salaryRange || 'Competitive'}
                          </p>
                        </div>
                        <ChevronRightIcon size={16} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: CRM Controls, Notes, Timeline */}
            <div className="modal-col-sidebar">
              {/* CRM Status Movement */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Clock size={16} />
                  <span>Outreach Stage (CRM)</span>
                </div>

                <div className="status-selector-wrap">
                  <label className="input-label">Current Pipeline Status</label>
                  <select
                    className="select-status-lg"
                    value={lead.status}
                    onChange={(e) =>
                      onUpdateStatus(
                        lead.id,
                        e.target.value as LeadStatus,
                        `Moved status to ${e.target.value}`
                      )
                    }
                  >
                    {allStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Follow-up scheduler */}
                <div className="followup-scheduler-wrap">
                  <label className="input-label">
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Schedule Follow-up Date
                  </label>
                  <input
                    type="date"
                    className="input-date"
                    value={followUpDateInput}
                    onChange={(e) => handleSaveFollowUp(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes & Context Editor */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Save size={16} />
                  <span>Outreach Notes</span>
                </div>
                <textarea
                  className="notes-textarea"
                  rows={4}
                  placeholder="Add custom notes about this contact, topics discussed, project alignments, or referral details..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                />
                <button
                  className="btn-secondary btn-sm mt-2"
                  onClick={handleSaveNotes}
                >
                  {notesSaved ? (
                    <>
                      <Check size={14} />
                      <span>Notes Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Notes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Outreach Activity History */}
              <div className="modal-card">
                <div className="card-section-title">
                  <Clock size={16} />
                  <span>Activity History ({filteredEvents.length})</span>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="empty-history-text">
                    No outreach activity recorded yet.
                  </div>
                ) : (
                  <div className="modal-timeline">
                    {filteredEvents.map((evt) => (
                      <div key={evt.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-action">
                              {evt.actionTaken}
                            </span>
                            <span className="timeline-date">{evt.date}</span>
                          </div>
                          {evt.note && (
                            <p className="timeline-note">{evt.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
