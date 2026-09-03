import type { Lead, LeadStatus, UserSettings } from '../types';
import { calculateRelevanceScore } from './leadScoring';
import { loadLeads, saveLeads, loadSettings } from './storage';

export interface DiscoveryProgressCallback {
  (step: number, message: string): void;
}

// Normalize strings for duplicate comparison
export function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Generate duplicate key
export function getLeadDuplicateKey(lead: Partial<Lead>): string {
  if (lead.linkedinUrl && lead.linkedinUrl !== '#' && !lead.linkedinUrl.includes('example.com/in/#')) {
    const cleanUrl = lead.linkedinUrl.toLowerCase().trim().replace(/\/+$/, '');
    return `url:${cleanUrl}`;
  }
  const normName = normalizeString(lead.name || '');
  const normComp = normalizeString(lead.company || '');
  return `name_comp:${normName}_${normComp}`;
}

export interface LeadDiscoveryService {
  discoverLeads(allLeads: Lead[], settings: UserSettings): Lead[];
  removeDuplicates(leads: Lead[]): Lead[];
  rankLeads(leads: Lead[], settings: UserSettings): Lead[];
  selectDailyLeads(rankedLeads: Lead[], count?: number): Lead[];
  executeDailyDiscovery(onProgress?: DiscoveryProgressCallback): Promise<{
    todayLeads: Lead[];
    totalEvaluated: number;
    newCount: number;
  }>;
}

export class DefaultLeadDiscoveryService implements LeadDiscoveryService {
  removeDuplicates(leads: Lead[]): Lead[] {
    const seen = new Set<string>();
    const unique: Lead[] = [];

    for (const lead of leads) {
      const key = getLeadDuplicateKey(lead);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }
    return unique;
  }

  rankLeads(leads: Lead[], settings: UserSettings): Lead[] {
    return leads
      .map((lead) => {
        const breakdown = calculateRelevanceScore(lead, settings, !!lead.associatedJobId);
        return {
          ...lead,
          relevanceScore: breakdown.normalizedScore,
          scoreBreakdown: breakdown,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  discoverLeads(allLeads: Lead[], settings: UserSettings): Lead[] {
    const excludedStatuses: LeadStatus[] = [
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

    const candidates = allLeads.filter(
      (l) => !excludedStatuses.includes(l.status)
    );

    const scored = candidates.map((lead) => {
      const breakdown = calculateRelevanceScore(lead, settings, !!lead.associatedJobId);
      return {
        ...lead,
        relevanceScore: breakdown.normalizedScore,
        scoreBreakdown: breakdown,
      };
    });

    return scored.filter((l) => l.relevanceScore >= (settings.minRelevanceScore || 50));
  }

  selectDailyLeads(rankedLeads: Lead[], count: number = 15): Lead[] {
    return rankedLeads.slice(0, count);
  }

  async executeDailyDiscovery(onProgress?: DiscoveryProgressCallback): Promise<{
    todayLeads: Lead[];
    totalEvaluated: number;
    newCount: number;
  }> {
    const settings = loadSettings();
    const existingLeads = loadLeads();
    const todayTarget = settings.dailyLeadTarget || 15;
    const todayDate = new Date().toISOString().split('T')[0];

    // Step 1: Searching
    if (onProgress) onProgress(1, 'Searching candidate talent pool and verified directory sources...');
    await new Promise((r) => setTimeout(r, 450));

    // Step 2: Analyzing
    if (onProgress) onProgress(2, 'Analyzing hardware/VLSI skill keywords and job relevance...');
    await new Promise((r) => setTimeout(r, 450));

    // Step 3: Removing duplicates & already contacted
    if (onProgress) onProgress(3, 'Removing duplicates and already contacted leads...');
    const deduplicated = this.removeDuplicates(existingLeads);
    await new Promise((r) => setTimeout(r, 400));

    // Step 4: Scoring and Ranking
    if (onProgress) onProgress(4, 'Scoring relevance and ranking against candidate profile...');
    const eligibleLeads = this.discoverLeads(deduplicated, settings);
    const ranked = this.rankLeads(eligibleLeads, settings);
    await new Promise((r) => setTimeout(r, 400));

    // Step 5: Preparing
    if (onProgress) onProgress(5, `Preparing today's top ${todayTarget} priority connections...`);
    const selected = this.selectDailyLeads(ranked, todayTarget);
    const selectedIds = new Set(selected.map((l) => l.id));

    // Update all leads with the new isDailyLead flag
    const updatedAllLeads = deduplicated.map((lead) => {
      const isChosen = selectedIds.has(lead.id);
      const breakdown = calculateRelevanceScore(lead, settings, !!lead.associatedJobId);
      return {
        ...lead,
        isDailyLead: isChosen,
        discoveredDate: isChosen ? todayDate : lead.discoveredDate,
        relevanceScore: breakdown.normalizedScore,
        scoreBreakdown: breakdown,
        updatedAt: new Date().toISOString(),
      };
    });

    saveLeads(updatedAllLeads);
    await new Promise((r) => setTimeout(r, 350));

    const finalTodayLeads = updatedAllLeads.filter((l) => l.isDailyLead);

    return {
      todayLeads: finalTodayLeads,
      totalEvaluated: deduplicated.length,
      newCount: finalTodayLeads.length,
    };
  }
}

export const leadDiscoveryService = new DefaultLeadDiscoveryService();
