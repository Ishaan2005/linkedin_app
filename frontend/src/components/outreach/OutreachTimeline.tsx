import React, { useState } from 'react';
import {
  Clock,
  Send,
  Calendar,
  Eye,
} from 'lucide-react';
import type { Lead, OutreachEvent } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface OutreachTimelineProps {
  events: OutreachEvent[];
  allLeads: Lead[];
  onSelectLeadById: (leadId: string) => void;
}

export const OutreachTimeline: React.FC<OutreachTimelineProps> = ({
  events,
  onSelectLeadById,
}) => {
  const [filterText, setFilterText] = useState('');

  const filtered = events.filter((e) =>
    `${e.leadName} ${e.leadTitle} ${e.company} ${e.actionTaken} ${e.note}`
      .toLowerCase()
      .includes(filterText.toLowerCase())
  );

  return (
    <div className="timeline-container-full">
      <div className="timeline-top-bar">
        <div className="timeline-title-wrap">
          <Clock size={16} />
          <h3>Outreach Activity Log ({filtered.length})</h3>
        </div>

        <div className="timeline-search">
          <input
            type="text"
            className="input-text-sm"
            placeholder="Search outreach events..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="timeline-empty-state">
          <p>No outreach events match your search criteria.</p>
        </div>
      ) : (
        <div className="timeline-list">
          {filtered.map((evt) => (
            <div key={evt.id} className="timeline-card">
              <div className="timeline-card-left">
                <div className="timeline-dot-large" />
                <div className="timeline-date-stamp">
                  <Calendar size={12} />
                  <span>{evt.date}</span>
                </div>
              </div>

              <div className="timeline-card-body">
                <div className="timeline-event-header">
                  <div className="timeline-actor">
                    <strong
                      className="lead-link"
                      onClick={() => onSelectLeadById(evt.leadId)}
                    >
                      {evt.leadName}
                    </strong>
                    <span className="lead-meta-inline">
                      {evt.leadTitle} • {evt.company}
                    </span>
                  </div>
                  <StatusBadge status={evt.status} size="sm" />
                </div>

                <div className="timeline-action-pill">
                  <Send size={12} />
                  <span>{evt.actionTaken}</span>
                  {evt.messageType && (
                    <span className="message-type-tag">
                      via {evt.messageType}
                    </span>
                  )}
                </div>

                {evt.note && <p className="timeline-note-text">{evt.note}</p>}
              </div>

              <div className="timeline-card-actions">
                <button
                  className="btn-view-lead"
                  onClick={() => onSelectLeadById(evt.leadId)}
                  title="View lead profile"
                >
                  <Eye size={14} />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
