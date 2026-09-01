import React from 'react';
import {
  Mail,
  Sparkles,
  Eye,
  Calendar,
} from 'lucide-react';
import type { Lead, LeadStatus } from '../../types';
import { LinkedinBadge } from '../common/LinkedinBadge';
import { ScoreBadge } from '../common/ScoreBadge';

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
}) => {
  if (leads.length === 0) {
    return null;
  }

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
    <div className="lead-table-container">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Candidate Lead</th>
            <th>Company & Location</th>
            <th>Tech Areas</th>
            <th>Role Category</th>
            <th>Relevance</th>
            <th>Status</th>
            <th>Follow-up</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="lead-table-row"
              onClick={() => onSelectLead(lead)}
            >
              {/* Lead Name & Title */}
              <td className="col-name">
                <div className="lead-table-profile">
                  <div className="table-avatar">
                    {(lead.name[0] || 'C').toUpperCase()}
                  </div>
                  <div>
                    <div className="table-name">{lead.name}</div>
                    <div className="table-title">{lead.title}</div>
                  </div>
                </div>
              </td>

              {/* Company & Location */}
              <td className="col-company">
                <div className="table-company-name">{lead.company}</div>
                <div className="table-location">📍 {lead.location}</div>
              </td>

              {/* Tech Areas */}
              <td className="col-skills">
                <div className="table-skills-wrap">
                  {lead.technicalAreas.slice(0, 3).map((ta) => (
                    <span key={ta} className="skill-pill-sm">
                      {ta}
                    </span>
                  ))}
                  {lead.technicalAreas.length > 3 && (
                    <span className="skill-pill-sm more">
                      +{lead.technicalAreas.length - 3}
                    </span>
                  )}
                </div>
              </td>

              {/* Role Category */}
              <td className="col-role">
                <span className="table-role-tag">{lead.roleCategory}</span>
              </td>

              {/* Relevance Score */}
              <td className="col-score">
                <ScoreBadge
                  score={lead.relevanceScore}
                  breakdown={lead.scoreBreakdown}
                  size="sm"
                  showLabel={false}
                />
              </td>

              {/* Status Dropdown */}
              <td
                className="col-status"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  className="table-status-select"
                  value={lead.status}
                  onChange={(e) =>
                    onUpdateStatus(lead.id, e.target.value as LeadStatus)
                  }
                >
                  {allStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </td>

              {/* Follow-up Date */}
              <td className="col-followup">
                {lead.followUpDate ? (
                  <span className="table-date-badge">
                    <Calendar size={12} />
                    {lead.followUpDate}
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
                )}
              </td>

              {/* Actions */}
              <td
                className="col-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="table-actions-group">
                  <a
                    href={lead.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="table-icon-btn"
                    title="Open LinkedIn profile"
                  >
                    <LinkedinBadge size={14} showText={false} />
                  </a>

                  {lead.email && lead.emailConfidence !== 'Unknown' && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="table-icon-btn"
                      title={`Send email to ${lead.email}`}
                    >
                      <Mail size={14} />
                    </a>
                  )}

                  <button
                    className="table-icon-btn highlight"
                    onClick={() => onGenerateMessage(lead)}
                    title="Generate AI outreach draft"
                  >
                    <Sparkles size={14} />
                  </button>

                  <button
                    className="table-icon-btn"
                    onClick={() => onSelectLead(lead)}
                    title="View lead details"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
