import React from 'react';
import {
  Mail,
  Building2,
  Briefcase,
  Sparkles,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import type { Company, Job, Lead, LeadStatus } from '../../types';
import { LinkedinBadge } from '../common/LinkedinBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ScoreBadge } from '../common/ScoreBadge';

interface LeadCardProps {
  lead: Lead;
  associatedJob?: Job;
  associatedCompany?: Company;
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
  onViewJob?: (job: Job) => void;
  onViewCompany?: (company: Company) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  associatedJob,
  associatedCompany,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
  onViewJob,
  onViewCompany,
}) => {
  const isContacted = [
    'CONNECTION_SENT',
    'MESSAGE_SENT',
    'RESUME_SENT',
    'FOLLOW_UP',
    'REPLIED',
    'INTERVIEW',
  ].includes(lead.status);

  const getInitials = (name: string) => {
    const parts = name.replace(/\([^)]*\)/g, '').trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'C').toUpperCase();
  };

  const handleQuickContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.status === 'NEW' || lead.status === 'REVIEWED') {
      onUpdateStatus(lead.id, 'CONNECTION_SENT');
    } else if (lead.status === 'CONNECTION_SENT') {
      onUpdateStatus(lead.id, 'CONNECTED');
    } else {
      onUpdateStatus(lead.id, 'MESSAGE_SENT');
    }
  };

  return (
    <div
      className="lead-card"
      onClick={() => onSelectLead(lead)}
      tabIndex={0}
      role="button"
    >
      {/* Top Card Header */}
      <div className="lead-card-header">
        <div className="lead-avatar-wrap">
          <div className="lead-avatar">{getInitials(lead.name)}</div>
          <div>
            <h3 className="lead-name">{lead.name}</h3>
            <p className="lead-title">{lead.title}</p>
          </div>
        </div>

        <div className="lead-score-wrap">
          <ScoreBadge score={lead.relevanceScore} breakdown={lead.scoreBreakdown} />
        </div>
      </div>

      {/* Meta tags (Company, Location, Role Category) */}
      <div className="lead-meta-row">
        <span
          className="meta-tag company-tag"
          onClick={(e) => {
            if (associatedCompany && onViewCompany) {
              e.stopPropagation();
              onViewCompany(associatedCompany);
            }
          }}
          title={associatedCompany ? 'Click to view company info' : undefined}
          style={{ cursor: associatedCompany ? 'pointer' : 'default' }}
        >
          <Building2 size={13} />
          {lead.company}
        </span>
        <span className="meta-tag location-tag">
          📍 {lead.location}
        </span>
        <span className="meta-tag role-category-tag">
          {lead.roleCategory}
        </span>
      </div>

      {/* Technical Skill Tags */}
      <div className="lead-skills-row">
        {lead.technicalAreas.slice(0, 4).map((tech) => (
          <span key={tech} className="skill-pill">
            {tech}
          </span>
        ))}
        {lead.technicalAreas.length > 4 && (
          <span className="skill-pill more">
            +{lead.technicalAreas.length - 4}
          </span>
        )}
      </div>

      {/* Why Recommended Reason Box */}
      <div className="lead-reason-box">
        <div className="reason-label">
          <Sparkles size={13} />
          <span>Why recommended:</span>
        </div>
        <p className="reason-text">"{lead.recommendationReason}"</p>
      </div>

      {/* Associated Job Context (if any) */}
      {associatedJob && (
        <div
          className="associated-job-pill"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewJob) onViewJob(associatedJob);
          }}
          title="Click to view associated job requisition"
        >
          <Briefcase size={13} />
          <span className="job-title-snippet">
            Job: <strong>{associatedJob.title}</strong>
          </span>
          <ChevronRight size={13} />
        </div>
      )}

      {/* Card Status & Date Details */}
      <div className="lead-status-row">
        <div className="status-indicator-group">
          <StatusBadge status={lead.status} size="sm" />
          {lead.dataSource === 'Demo data' && (
            <span className="demo-source-tag" title="Verified fictional demonstration data">
              Demo data
            </span>
          )}
        </div>

        {lead.followUpDate && (
          <div className="followup-tag" title="Scheduled follow-up">
            <Calendar size={12} />
            <span>Follow-up: {lead.followUpDate}</span>
          </div>
        )}
      </div>

      {/* Card Action Buttons Bar */}
      <div className="lead-actions-bar" onClick={(e) => e.stopPropagation()}>
        {/* LinkedIn Link (External, Manual Open) */}
        <a
          href={lead.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-action-linkedin"
          title="Open LinkedIn profile in new tab (manual outreach)"
        >
          <LinkedinBadge size={14} showText={true} />
          <ExternalLink size={12} />
        </a>

        {/* Public / Verified Professional Email */}
        {lead.email && lead.emailConfidence !== 'Unknown' && (
          <a
            href={`mailto:${lead.email}?subject=VLSI%20Engineering%20Inquiry%20-%20ECE%20Candidate`}
            className="btn-action-email"
            title={`Open email client (${lead.email} - Source: ${lead.emailSource || 'Public'}, Confidence: ${lead.emailConfidence || 'Public'})`}
          >
            <Mail size={14} />
            <span>Email</span>
          </a>
        )}

        {/* Generate Message Draft */}
        <button
          className="btn-action-generate"
          onClick={() => onGenerateMessage(lead)}
          title="Generate AI-assisted personalized message draft"
        >
          <Sparkles size={14} />
          <span>Draft</span>
        </button>

        {/* Quick Contact Status Button */}
        <button
          className={`btn-action-contact ${isContacted ? 'contacted' : ''}`}
          onClick={handleQuickContact}
          title={isContacted ? 'Update outreach status' : 'Mark as Contacted'}
        >
          {isContacted ? (
            <>
              <Check size={14} />
              <span>Contacted</span>
            </>
          ) : (
            <>
              <Clock size={14} />
              <span>Mark Contacted</span>
            </>
          )}
        </button>

        {/* View Details Drawer */}
        <button
          className="btn-action-details"
          onClick={() => onSelectLead(lead)}
          title="View full lead details & CRM timeline"
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
};
