import type {
  Company,
  Job,
  Lead,
  LeadStatus,
  OutreachEvent,
  UserSettings,
} from '../types';
import {
  defaultSettings,
  mockCompanies,
  mockJobs,
  mockLeads,
  mockOutreachEvents,
} from '../data/mockData';
import { calculateRelevanceScore } from './leadScoring';

const STORAGE_KEYS = {
  LEADS: 'connection_finder_leads_v2',
  COMPANIES: 'connection_finder_companies_v2',
  JOBS: 'connection_finder_jobs_v2',
  OUTREACH: 'connection_finder_outreach_v2',
  SETTINGS: 'connection_finder_settings_v2',
};

// Initialize default scores for leads
function initializeLeadsWithScores(leads: Lead[], settings: UserSettings): Lead[] {
  return leads.map((lead) => {
    const breakdown = calculateRelevanceScore(lead, settings, !!lead.associatedJobId);
    return {
      ...lead,
      relevanceScore: breakdown.normalizedScore,
      scoreBreakdown: breakdown,
    };
  });
}

export function loadSettings(): UserSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load settings from storage:', err);
  }
  return defaultSettings;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function loadLeads(): Lead[] {
  const settings = loadSettings();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (saved) {
      const parsed: Lead[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load leads from storage:', err);
  }

  const initial = initializeLeadsWithScores(mockLeads, settings);
  saveLeads(initial);
  return initial;
}

export function saveLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  } catch (err) {
    console.error('Failed to save leads:', err);
  }
}

export function loadCompanies(): Company[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (saved) {
      const parsed: Company[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load companies from storage:', err);
  }
  saveCompanies(mockCompanies);
  return mockCompanies;
}

export function saveCompanies(companies: Company[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  } catch (err) {
    console.error('Failed to save companies:', err);
  }
}

export function loadJobs(): Job[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
    if (saved) {
      const parsed: Job[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load jobs from storage:', err);
  }
  saveJobs(mockJobs);
  return mockJobs;
}

export function saveJobs(jobs: Job[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  } catch (err) {
    console.error('Failed to save jobs:', err);
  }
}

export function loadOutreachEvents(): OutreachEvent[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.OUTREACH);
    if (saved) {
      const parsed: OutreachEvent[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load outreach events from storage:', err);
  }
  saveOutreachEvents(mockOutreachEvents);
  return mockOutreachEvents;
}

export function saveOutreachEvents(events: OutreachEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OUTREACH, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save outreach events:', err);
  }
}

export function addOutreachEvent(event: Omit<OutreachEvent, 'id'>): OutreachEvent {
  const events = loadOutreachEvents();
  const newEvent: OutreachEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newEvent, ...events];
  saveOutreachEvents(updated);
  return newEvent;
}

export function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  actionNote?: string
): Lead[] {
  const leads = loadLeads();
  const now = new Date().toISOString();
  const dateStr = now.split('T')[0];

  let updatedLead: Lead | null = null;

  const updatedLeads = leads.map((l) => {
    if (l.id === leadId) {
      const isContacted = [
        'CONNECTION_SENT',
        'MESSAGE_SENT',
        'RESUME_SENT',
        'FOLLOW_UP',
        'REPLIED',
        'INTERVIEW',
      ].includes(newStatus);

      updatedLead = {
        ...l,
        status: newStatus,
        lastContactedDate: isContacted ? (l.lastContactedDate || dateStr) : l.lastContactedDate,
        updatedAt: now,
      };
      return updatedLead;
    }
    return l;
  });

  saveLeads(updatedLeads);

  if (updatedLead) {
    const leadObj = updatedLead as Lead;
    addOutreachEvent({
      leadId: leadObj.id,
      leadName: leadObj.name,
      leadTitle: leadObj.title,
      company: leadObj.company,
      date: new Date().toLocaleString(),
      status: newStatus,
      actionTaken: `Status changed to ${newStatus.replace(/_/g, ' ')}`,
      note: actionNote || `Moved lead status to ${newStatus.replace(/_/g, ' ')}`,
    });
  }

  return updatedLeads;
}

export function resetAllToDefault(): void {
  localStorage.removeItem(STORAGE_KEYS.LEADS);
  localStorage.removeItem(STORAGE_KEYS.COMPANIES);
  localStorage.removeItem(STORAGE_KEYS.JOBS);
  localStorage.removeItem(STORAGE_KEYS.OUTREACH);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}
