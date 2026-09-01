import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  MoveRight,
} from 'lucide-react';
import type { Lead, LeadStatus } from '../../types';
import { LinkedinBadge } from '../common/LinkedinBadge';
import { ScoreBadge } from '../common/ScoreBadge';

interface OutreachBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
}

interface ColumnConfig {
  status: LeadStatus;
  title: string;
  accent: string;
  bg: string;
}

const CRM_COLUMNS: ColumnConfig[] = [
  { status: 'NEW', title: 'New Leads', accent: '#2563eb', bg: 'rgba(59, 130, 246, 0.05)' },
  { status: 'REVIEWED', title: 'Reviewed', accent: '#4b5563', bg: 'rgba(107, 114, 128, 0.05)' },
  { status: 'CONNECTION_SENT', title: 'Connection Sent', accent: '#ea580c', bg: 'rgba(234, 88, 12, 0.05)' },
  { status: 'CONNECTED', title: 'Connected', accent: '#059669', bg: 'rgba(16, 185, 129, 0.05)' },
  { status: 'MESSAGE_SENT', title: 'Message Sent', accent: '#7c3aed', bg: 'rgba(147, 51, 234, 0.05)' },
  { status: 'RESUME_SENT', title: 'Resume Sent', accent: '#0284c7', bg: 'rgba(2, 132, 199, 0.05)' },
  { status: 'FOLLOW_UP', title: 'Follow-up Due', accent: '#d97706', bg: 'rgba(217, 119, 6, 0.05)' },
  { status: 'REPLIED', title: 'Replied / Active', accent: '#0f766e', bg: 'rgba(13, 148, 136, 0.05)' },
  { status: 'INTERVIEW', title: 'Interview Stage', accent: '#15803d', bg: 'rgba(22, 163, 74, 0.08)' },
  { status: 'REJECTED', title: 'Closed / Rejected', accent: '#dc2626', bg: 'rgba(220, 38, 38, 0.05)' },
  { status: 'ARCHIVED', title: 'Archived', accent: '#64748b', bg: 'rgba(100, 116, 139, 0.05)' },
];

export const OutreachBoard: React.FC<OutreachBoardProps> = ({
  leads,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [targetColumn, setTargetColumn] = useState<LeadStatus | 'all'>('all');

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.name} ${lead.title} ${lead.company} ${lead.location}`
        .toLowerCase()
        .includes(searchFilter.toLowerCase());
    const matchesCol = targetColumn === 'all' || lead.status === targetColumn;
    return matchesSearch && matchesCol;
  });

  const getLeadsForColumn = (status: LeadStatus) => {
    return filteredLeads.filter((l) => l.status === status);
  };

  const nextStatusMap: Record<LeadStatus, LeadStatus> = {
    NEW: 'CONNECTION_SENT',
    REVIEWED: 'CONNECTION_SENT',
    CONNECTION_SENT: 'CONNECTED',
    CONNECTED: 'MESSAGE_SENT',
    MESSAGE_SENT: 'FOLLOW_UP',
    RESUME_SENT: 'FOLLOW_UP',
    FOLLOW_UP: 'REPLIED',
    REPLIED: 'INTERVIEW',
    INTERVIEW: 'CONNECTED',
    REJECTED: 'ARCHIVED',
    ARCHIVED: 'NEW',
  };

  return (
    <div className="outreach-crm-container">
      {/* Search & Filter Bar */}
      <div className="crm-top-toolbar">
        <div className="crm-search-wrap">
          <input
            type="text"
            className="crm-search-input"
            placeholder="Search CRM pipeline contacts..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        <div className="crm-column-filter">
          <label className="crm-filter-label">Filter Column:</label>
          <select
            className="crm-filter-select"
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value as LeadStatus | 'all')}
          >
            <option value="all">All 11 Stages</option>
            {CRM_COLUMNS.map((col) => (
              <option key={col.status} value={col.status}>
                {col.title} ({getLeadsForColumn(col.status).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Scrolling Container */}
      <div className="crm-board-grid">
        {CRM_COLUMNS.filter(
          (col) => targetColumn === 'all' || col.status === targetColumn
        ).map((col) => {
          const colLeads = getLeadsForColumn(col.status);
          const nextStatus = nextStatusMap[col.status];

          return (
            <div
              key={col.status}
              className="crm-column"
              style={{ borderTop: `3px solid ${col.accent}` }}
            >
              {/* Column Header */}
              <div className="crm-column-header">
                <div className="crm-column-title-group">
                  <span
                    className="crm-status-dot"
                    style={{ backgroundColor: col.accent }}
                  />
                  <h3 className="crm-column-title">{col.title}</h3>
                </div>
                <span className="crm-count-badge">{colLeads.length}</span>
              </div>

              {/* Column Cards */}
              <div className="crm-column-cards">
                {colLeads.length === 0 ? (
                  <div className="crm-empty-column">No contacts in this stage</div>
                ) : (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="crm-card"
                      onClick={() => onSelectLead(lead)}
                    >
                      <div className="crm-card-top">
                        <span className="crm-company-tag">{lead.company}</span>
                        <ScoreBadge
                          score={lead.relevanceScore}
                          size="sm"
                          showLabel={false}
                        />
                      </div>

                      <h4 className="crm-lead-name">{lead.name}</h4>
                      <p className="crm-lead-title">{lead.title}</p>
                      <div className="crm-location">📍 {lead.location}</div>

                      {lead.followUpDate && (
                        <div className="crm-followup-badge">
                          <Calendar size={11} />
                          <span>Follow-up: {lead.followUpDate}</span>
                        </div>
                      )}

                      {/* CRM Card Quick Actions */}
                      <div
                        className="crm-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="crm-btn-icon"
                          onClick={() => onGenerateMessage(lead)}
                          title="Generate outreach message"
                        >
                          <Sparkles size={13} />
                        </button>

                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="crm-btn-icon"
                          title="Open LinkedIn profile"
                        >
                          <LinkedinBadge size={13} showText={false} />
                        </a>

                        {nextStatus && (
                          <button
                            className="crm-btn-advance"
                            onClick={() => onUpdateStatus(lead.id, nextStatus)}
                            title={`Advance stage to ${nextStatus.replace(/_/g, ' ')}`}
                          >
                            <span>Move</span>
                            <MoveRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
