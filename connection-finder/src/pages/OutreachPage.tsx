import React, { useState } from 'react';
import {
  Send,
  Kanban,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Lead, LeadStatus, OutreachEvent } from '../types';
import { OutreachBoard } from '../components/outreach/OutreachBoard';
import { OutreachTimeline } from '../components/outreach/OutreachTimeline';

interface OutreachPageProps {
  leads: Lead[];
  outreachEvents: OutreachEvent[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onGenerateMessage: (lead: Lead) => void;
}

export const OutreachPage: React.FC<OutreachPageProps> = ({
  leads,
  outreachEvents,
  onSelectLead,
  onUpdateStatus,
  onGenerateMessage,
}) => {
  const [viewTab, setViewTab] = useState<'board' | 'timeline'>('board');

  const todayStr = new Date().toISOString().split('T')[0];
  const followUpsDue = leads.filter(
    (l) =>
      l.followUpDate &&
      l.followUpDate <= todayStr &&
      l.status !== 'REJECTED' &&
      l.status !== 'ARCHIVED'
  );

  const handleSelectLeadById = (leadId: string) => {
    const found = leads.find((l) => l.id === leadId);
    if (found) {
      onSelectLead(found);
    }
  };

  return (
    <div className="page-outreach">
      {/* Top Header Card */}
      <div className="page-header-card">
        <div className="page-header-info">
          <div className="page-tag">
            <Send size={14} />
            <span>Outreach CRM & Follow-up Tracking</span>
          </div>
          <h2>Networking CRM Pipeline</h2>
          <p>
            Manage conversations from initial connection request to technical interview scheduling.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="outreach-view-tabs">
          <button
            className={`outreach-tab-btn ${viewTab === 'board' ? 'active' : ''}`}
            onClick={() => setViewTab('board')}
          >
            <Kanban size={15} />
            <span>Pipeline Board (11 Stages)</span>
          </button>
          <button
            className={`outreach-tab-btn ${viewTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewTab('timeline')}
          >
            <Clock size={15} />
            <span>Activity Log ({outreachEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Follow-ups Due Banner */}
      {followUpsDue.length > 0 && (
        <div className="followup-alert-banner">
          <div className="alert-left">
            <AlertCircle size={18} className="alert-icon" />
            <div>
              <strong>{followUpsDue.length} Follow-up(s) Due Today:</strong>
              <div className="followup-leads-chips">
                {followUpsDue.map((l) => (
                  <span
                    key={l.id}
                    className="followup-lead-pill clickable"
                    onClick={() => onSelectLead(l)}
                  >
                    {l.name} ({l.company})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            className="btn-accent btn-sm"
            onClick={() => onSelectLead(followUpsDue[0])}
          >
            <Sparkles size={14} />
            <span>Review & Draft Follow-up</span>
          </button>
        </div>
      )}

      {/* View Switcher: Board vs Timeline */}
      {viewTab === 'board' ? (
        <OutreachBoard
          leads={leads}
          onSelectLead={onSelectLead}
          onUpdateStatus={onUpdateStatus}
          onGenerateMessage={onGenerateMessage}
        />
      ) : (
        <OutreachTimeline
          events={outreachEvents}
          allLeads={leads}
          onSelectLeadById={handleSelectLeadById}
        />
      )}
    </div>
  );
};
