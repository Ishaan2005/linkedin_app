import type {
  Company,
  Job,
  JobStatus,
  Lead,
  LeadStatus,
  OutreachEvent,
  RoleCategory,
  ScoreBreakdown,
  TechnicalArea,
  UserSettings,
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

// ==========================================
// Lead Types & Mappings
// ==========================================

export interface ApiLead {
  id: number;
  name: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  relevance_score: number;
  status: string;
  notes?: string | null;
  follow_up_date?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  recommendation_reason?: string | null;
  technical_areas?: TechnicalArea[] | string[] | null;
  role_category?: RoleCategory | string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateLeadInput {
  name: string;
  title?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  relevanceScore?: number;
  status?: LeadStatus;
  notes?: string;
  followUpDate?: string | null;
}

export interface UpdateLeadInput {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  relevanceScore?: number;
  status?: LeadStatus;
  notes?: string;
  followUpDate?: string | null;
}

function inferRoleCategory(title?: string | null): RoleCategory {
  if (!title) return 'Other';
  const t = title.toLowerCase();
  if (t.includes('asic design manager')) return 'ASIC Design Manager';
  if (t.includes('rtl lead')) return 'RTL Lead';
  if (t.includes('verification lead')) return 'Verification Lead';
  if (t.includes('physical design lead')) return 'Physical Design Lead';
  if (t.includes('vlsi manager')) return 'VLSI Manager';
  if (t.includes('hiring manager')) return 'Hiring Manager';
  if (t.includes('engineering manager') || t.includes('director')) return 'Engineering Manager';
  if (t.includes('technical lead') || t.includes('principal') || t.includes('lead') || t.includes('architect')) return 'Technical Lead';
  if (t.includes('technical recruiter')) return 'Technical Recruiter';
  if (t.includes('talent acquisition') || t.includes('recruiter')) return 'Recruiter';
  if (t.includes('hr')) return 'HR';
  return 'Other';
}

function inferTechnicalAreas(title?: string | null): TechnicalArea[] {
  if (!title) return ['VLSI', 'ASIC'];
  const t = title.toLowerCase();
  const areas: TechnicalArea[] = [];
  if (t.includes('rtl')) areas.push('RTL');
  if (t.includes('verilog')) areas.push('Verilog');
  if (t.includes('systemverilog')) areas.push('SystemVerilog');
  if (t.includes('asic')) areas.push('ASIC');
  if (t.includes('fpga')) areas.push('FPGA');
  if (t.includes('physical design')) areas.push('Physical Design');
  if (t.includes('verification')) areas.push('Design Verification');
  if (t.includes('vlsi')) areas.push('VLSI');
  if (t.includes('soc')) areas.push('SoC');
  return areas.length > 0 ? areas : ['VLSI', 'ASIC'];
}

export function mapApiLeadToLead(lead: ApiLead, isDaily: boolean = false): Lead {
  const score = typeof lead.relevance_score === 'number' ? lead.relevance_score : 0;
  const roleCategory = (lead.role_category as RoleCategory) || inferRoleCategory(lead.title);
  const technicalAreas = (lead.technical_areas as TechnicalArea[]) || inferTechnicalAreas(lead.title);

  const scoreBreakdown: ScoreBreakdown = lead.score_breakdown || {
    rolePoints: Math.round(score * 0.35),
    roleReason: lead.title ? `Title match: ${lead.title}` : 'Hardware role alignment',
    technicalPoints: Math.round(score * 0.35),
    technicalReason: 'Semiconductor / VLSI domain match',
    companyPoints: Math.round(score * 0.15),
    companyReason: lead.company ? `Target company: ${lead.company}` : 'Industry target',
    jobPoints: 0,
    jobReason: 'Direct CRM contact',
    locationPoints: Math.round(score * 0.15),
    locationReason: lead.location ? `Target location: ${lead.location}` : 'Target region',
    rawTotal: score,
    normalizedScore: score,
    summaryExplanation: `Candidate relevance score ${score}/100 evaluated against semiconductor profile.`,
  };

  const recommendationReason = lead.recommendation_reason || (
    lead.title ? `${lead.title} at ${lead.company || 'Target Company'}` : 'Semiconductor hiring prospect'
  );

  return {
    id: String(lead.id),
    name: lead.name,
    title: lead.title ?? '',
    company: lead.company ?? '',
    location: lead.location ?? '',
    linkedinUrl: lead.linkedin_url ?? '',
    email: undefined,
    relevanceScore: score,
    technicalAreas,
    roleCategory,
    scoreBreakdown,
    recommendationReason,
    dataSource: 'Backend',
    associatedJobId: undefined,
    associatedCompanyName: lead.company ?? undefined,
    status: (lead.status as LeadStatus) || 'NEW',
    isDailyLead: isDaily,
    discoveredDate: lead.created_at ? lead.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    lastContactedDate: undefined,
    followUpDate: lead.follow_up_date || undefined,
    notes: lead.notes ?? '',
    createdAt: lead.created_at ?? new Date().toISOString(),
    updatedAt: lead.updated_at ?? new Date().toISOString(),
  };
}

export function mapLeadToApiPayload(input: Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.title !== undefined) payload.title = input.title;
  if (input.company !== undefined) payload.company = input.company;
  if (input.location !== undefined) payload.location = input.location;
  if (input.linkedinUrl !== undefined) payload.linkedin_url = input.linkedinUrl;
  if (input.linkedin_url !== undefined) payload.linkedin_url = input.linkedin_url;
  if (input.relevanceScore !== undefined) payload.relevance_score = input.relevanceScore;
  if (input.relevance_score !== undefined) payload.relevance_score = input.relevance_score;
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = input.notes;
  if (input.followUpDate !== undefined) payload.follow_up_date = input.followUpDate || null;
  if (input.follow_up_date !== undefined) payload.follow_up_date = input.follow_up_date || null;

  return payload;
}

// ==========================================
// Company Types & Mappings
// ==========================================

export interface ApiCompany {
  id: number;
  name: string;
  industry?: string | null;
  location?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  tech_focus?: string[] | null;
  description?: string | null;
  last_researched?: string | null;
  tier?: string | null;
  is_saved?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  location?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  techFocus?: TechnicalArea[];
  description?: string;
  lastResearched?: string;
  tier?: 'Tier 1' | 'Tier 2' | 'Startup' | 'Target';
  isSaved?: boolean;
}

export interface UpdateCompanyInput {
  name?: string;
  industry?: string;
  location?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  techFocus?: TechnicalArea[];
  description?: string;
  lastResearched?: string;
  tier?: 'Tier 1' | 'Tier 2' | 'Startup' | 'Target';
  isSaved?: boolean;
}

export function mapApiCompanyToCompany(c: ApiCompany): Company {
  return {
    id: String(c.id),
    name: c.name,
    industry: c.industry || '',
    location: c.location || '',
    websiteUrl: c.website_url || '',
    linkedinUrl: c.linkedin_url || '',
    techFocus: (c.tech_focus as TechnicalArea[]) || [],
    description: c.description || '',
    lastResearched: c.last_researched || '',
    tier: (c.tier as any) || 'Target',
    isSaved: Boolean(c.is_saved),
  };
}

export function mapCompanyToApiPayload(input: Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.industry !== undefined) payload.industry = input.industry;
  if (input.location !== undefined) payload.location = input.location;
  if (input.websiteUrl !== undefined) payload.website_url = input.websiteUrl;
  if (input.linkedinUrl !== undefined) payload.linkedin_url = input.linkedinUrl;
  if (input.techFocus !== undefined) payload.tech_focus = input.techFocus;
  if (input.description !== undefined) payload.description = input.description;
  if (input.lastResearched !== undefined) payload.last_researched = input.lastResearched;
  if (input.tier !== undefined) payload.tier = input.tier;
  if (input.isSaved !== undefined) payload.is_saved = input.isSaved;
  return payload;
}

// ==========================================
// Job Types & Mappings
// ==========================================

export interface ApiJob {
  id: number;
  company_id?: number | null;
  title: string;
  company: string;
  location?: string | null;
  url?: string | null;
  description?: string | null;
  required_skills?: string[] | null;
  date_discovered?: string | null;
  status: string;
  salary_range?: string | null;
  experience_level?: string | null;
  associated_contact_ids?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateJobInput {
  title: string;
  company: string;
  location?: string;
  url?: string;
  description?: string;
  requiredSkills?: string[];
  dateDiscovered?: string;
  status?: JobStatus;
  salaryRange?: string;
  experienceLevel?: string;
  associatedContactIds?: string[];
}

export interface UpdateJobInput {
  title?: string;
  company?: string;
  location?: string;
  url?: string;
  description?: string;
  requiredSkills?: string[];
  dateDiscovered?: string;
  status?: JobStatus;
  salaryRange?: string;
  experienceLevel?: string;
  associatedContactIds?: string[];
}

export function mapApiJobToJob(j: ApiJob): Job {
  return {
    id: String(j.id),
    title: j.title,
    company: j.company,
    location: j.location || '',
    url: j.url || '',
    description: j.description || '',
    requiredSkills: j.required_skills || [],
    dateDiscovered: j.date_discovered || '',
    status: (j.status as JobStatus) || 'NEW',
    salaryRange: j.salary_range || undefined,
    experienceLevel: j.experience_level || undefined,
    associatedContactIds: j.associated_contact_ids || [],
  };
}

export function mapJobToApiPayload(input: Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.company !== undefined) payload.company = input.company;
  if (input.location !== undefined) payload.location = input.location;
  if (input.url !== undefined) payload.url = input.url;
  if (input.description !== undefined) payload.description = input.description;
  if (input.requiredSkills !== undefined) payload.required_skills = input.requiredSkills;
  if (input.dateDiscovered !== undefined) payload.date_discovered = input.dateDiscovered;
  if (input.status !== undefined) payload.status = input.status;
  if (input.salaryRange !== undefined) payload.salary_range = input.salaryRange;
  if (input.experienceLevel !== undefined) payload.experience_level = input.experienceLevel;
  if (input.associatedContactIds !== undefined) payload.associated_contact_ids = input.associatedContactIds;
  return payload;
}

// ==========================================
// Outreach Event Types & Mappings
// ==========================================

export interface ApiOutreachEvent {
  id: number;
  lead_id?: number | null;
  lead_name?: string | null;
  lead_title?: string | null;
  company?: string | null;
  date?: string | null;
  status?: string | null;
  note?: string | null;
  action_taken?: string | null;
  message_type?: string | null;
  generated_text?: string | null;
  created_at?: string | null;
}

export interface CreateOutreachEventInput {
  leadId?: string | number;
  leadName?: string;
  leadTitle?: string;
  company?: string;
  date?: string;
  status?: LeadStatus;
  note?: string;
  actionTaken?: string;
  messageType?: 'Connection request' | 'LinkedIn message' | 'Cold email' | 'Follow-up' | 'Thank-you';
  generatedText?: string;
}

export interface UpdateOutreachEventInput {
  note?: string;
  actionTaken?: string;
  status?: LeadStatus;
  messageType?: 'Connection request' | 'LinkedIn message' | 'Cold email' | 'Follow-up' | 'Thank-you';
  generatedText?: string;
}

export function mapApiOutreachToOutreach(e: ApiOutreachEvent): OutreachEvent {
  return {
    id: String(e.id),
    leadId: e.lead_id !== null && e.lead_id !== undefined ? String(e.lead_id) : '',
    leadName: e.lead_name || '',
    leadTitle: e.lead_title || '',
    company: e.company || '',
    date: e.date || (e.created_at ? e.created_at.split('T')[0] : ''),
    status: (e.status as LeadStatus) || 'NEW',
    note: e.note || '',
    actionTaken: e.action_taken || '',
    messageType: (e.message_type as any) || undefined,
    generatedText: e.generated_text || undefined,
  };
}

export function mapOutreachToApiPayload(input: Record<string, any>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (input.leadId !== undefined) {
    const parsed = parseInt(String(input.leadId), 10);
    payload.lead_id = isNaN(parsed) ? null : parsed;
  }
  if (input.leadName !== undefined) payload.lead_name = input.leadName;
  if (input.leadTitle !== undefined) payload.lead_title = input.leadTitle;
  if (input.company !== undefined) payload.company = input.company;
  if (input.date !== undefined) payload.date = input.date;
  if (input.status !== undefined) payload.status = input.status;
  if (input.note !== undefined) payload.note = input.note;
  if (input.actionTaken !== undefined) payload.action_taken = input.actionTaken;
  if (input.messageType !== undefined) payload.message_type = input.messageType;
  if (input.generatedText !== undefined) payload.generated_text = input.generatedText;
  return payload;
}

// ==========================================
// Settings Types & Mappings
// ==========================================

export interface ApiUserSettings {
  id: number;
  target_roles: string[];
  target_technical_skills: string[];
  target_locations: string[];
  target_companies: string[];
  priority_companies?: string[];
  daily_lead_target: number;
  min_relevance_score: number;
  candidate_profile: any;
  last_daily_generation_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export function mapApiSettingsToSettings(s: ApiUserSettings): UserSettings {
  return {
    targetRoles: s.target_roles || [],
    targetTechnicalSkills: s.target_technical_skills || [],
    targetLocations: s.target_locations || [],
    targetCompanies: s.target_companies || [],
    priorityCompanies: s.priority_companies || [],
    dailyLeadTarget: s.daily_lead_target ?? 15,
    minRelevanceScore: s.min_relevance_score ?? 60,
    candidateProfile: s.candidate_profile || {
      name: '',
      education: '',
      focus: '',
      skills: [],
      projects: [],
      experience: '',
      email: '',
    },
    lastDailyGenerationDate: s.last_daily_generation_date || undefined,
  };
}

export function mapSettingsToApiPayload(input: Partial<UserSettings>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (input.targetRoles !== undefined) payload.target_roles = input.targetRoles;
  if (input.targetTechnicalSkills !== undefined) payload.target_technical_skills = input.targetTechnicalSkills;
  if (input.targetLocations !== undefined) payload.target_locations = input.targetLocations;
  if (input.targetCompanies !== undefined) payload.target_companies = input.targetCompanies;
  if (input.priorityCompanies !== undefined) payload.priority_companies = input.priorityCompanies;
  if (input.dailyLeadTarget !== undefined) payload.daily_lead_target = input.dailyLeadTarget;
  if (input.minRelevanceScore !== undefined) payload.min_relevance_score = input.minRelevanceScore;
  if (input.candidateProfile !== undefined) payload.candidate_profile = input.candidateProfile;
  if (input.lastDailyGenerationDate !== undefined) payload.last_daily_generation_date = input.lastDailyGenerationDate;
  return payload;
}

// ==========================================
// HTTP Request Helper
// ==========================================

async function handleResponse(response: Response, defaultErrorMsg: string) {
  if (!response.ok) {
    let errorDetail = defaultErrorMsg;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorJson.error || defaultErrorMsg;
    } catch {
      errorDetail = response.statusText || defaultErrorMsg;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

// ==========================================
// Leads API
// ==========================================

export async function getLeads(): Promise<Lead[]> {
  const response = await fetch(`${API_BASE}/leads`);
  const data = await handleResponse(response, 'Failed to fetch leads');
  return data.map(mapApiLeadToLead);
}

export async function getLead(id: string): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${id}`);
  const data = await handleResponse(response, `Failed to fetch lead with id ${id}`);
  return mapApiLeadToLead(data);
}

export async function createLead(lead: CreateLeadInput): Promise<Lead> {
  const payload = mapLeadToApiPayload(lead);
  const response = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse(response, 'Failed to create lead');
  return mapApiLeadToLead(data);
}

export async function updateLead(id: string, updates: UpdateLeadInput): Promise<Lead> {
  const payload = mapLeadToApiPayload(updates);
  const response = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse(response, `Failed to update lead ${id}`);
  return mapApiLeadToLead(data);
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus | string,
  note?: string
): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, note }),
  });

  const data = await handleResponse(response, `Failed to update status for lead ${leadId}`);
  return mapApiLeadToLead(data);
}

export async function deleteLead(leadId: string): Promise<{ message: string; id: number }> {
  const response = await fetch(`${API_BASE}/leads/${leadId}`, {
    method: 'DELETE',
  });

  return handleResponse(response, `Failed to delete lead ${leadId}`);
}

// ==========================================
// Companies API
// ==========================================

export async function getCompanies(): Promise<Company[]> {
  const response = await fetch(`${API_BASE}/companies`);
  const data = await handleResponse(response, 'Failed to fetch companies');
  return data.map(mapApiCompanyToCompany);
}

export async function getCompany(id: string): Promise<Company> {
  const response = await fetch(`${API_BASE}/companies/${id}`);
  const data = await handleResponse(response, `Failed to fetch company ${id}`);
  return mapApiCompanyToCompany(data);
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const payload = mapCompanyToApiPayload(input);
  const response = await fetch(`${API_BASE}/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, 'Failed to create company');
  return mapApiCompanyToCompany(data);
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
  const payload = mapCompanyToApiPayload(input);
  const response = await fetch(`${API_BASE}/companies/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, `Failed to update company ${id}`);
  return mapApiCompanyToCompany(data);
}

export async function toggleSaveCompany(id: string, isSaved: boolean): Promise<Company> {
  return updateCompany(id, { isSaved });
}

export async function deleteCompany(id: string): Promise<{ message: string; id: number }> {
  const response = await fetch(`${API_BASE}/companies/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response, `Failed to delete company ${id}`);
}

// ==========================================
// Jobs API
// ==========================================

export async function getJobs(): Promise<Job[]> {
  const response = await fetch(`${API_BASE}/jobs`);
  const data = await handleResponse(response, 'Failed to fetch jobs');
  return data.map(mapApiJobToJob);
}

export async function getJob(id: string): Promise<Job> {
  const response = await fetch(`${API_BASE}/jobs/${id}`);
  const data = await handleResponse(response, `Failed to fetch job ${id}`);
  return mapApiJobToJob(data);
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const payload = mapJobToApiPayload(input);
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, 'Failed to create job');
  return mapApiJobToJob(data);
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const payload = mapJobToApiPayload(input);
  const response = await fetch(`${API_BASE}/jobs/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, `Failed to update job ${id}`);
  return mapApiJobToJob(data);
}

export async function updateJobStatus(jobId: string, status: JobStatus | string): Promise<Job> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  const data = await handleResponse(response, `Failed to update job status ${jobId}`);
  return mapApiJobToJob(data);
}

export async function deleteJob(jobId: string): Promise<{ message: string; id: number }> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
    method: 'DELETE',
  });
  return handleResponse(response, `Failed to delete job ${jobId}`);
}

// ==========================================
// Outreach Events API
// ==========================================

export async function getOutreachEvents(): Promise<OutreachEvent[]> {
  const response = await fetch(`${API_BASE}/outreach`);
  const data = await handleResponse(response, 'Failed to fetch outreach events');
  return data.map(mapApiOutreachToOutreach);
}

export async function getOutreachEvent(id: string): Promise<OutreachEvent> {
  const response = await fetch(`${API_BASE}/outreach/${id}`);
  const data = await handleResponse(response, `Failed to fetch outreach event ${id}`);
  return mapApiOutreachToOutreach(data);
}

export async function getLeadOutreach(leadId: string): Promise<OutreachEvent[]> {
  const response = await fetch(`${API_BASE}/leads/${leadId}/outreach`);
  const data = await handleResponse(response, `Failed to fetch outreach events for lead ${leadId}`);
  return data.map(mapApiOutreachToOutreach);
}

export async function createOutreachEvent(input: CreateOutreachEventInput): Promise<OutreachEvent> {
  const payload = mapOutreachToApiPayload(input);
  const response = await fetch(`${API_BASE}/outreach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, 'Failed to record outreach event');
  return mapApiOutreachToOutreach(data);
}

export async function updateOutreachEvent(id: string, input: UpdateOutreachEventInput): Promise<OutreachEvent> {
  const payload = mapOutreachToApiPayload(input);
  const response = await fetch(`${API_BASE}/outreach/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, `Failed to update outreach event ${id}`);
  return mapApiOutreachToOutreach(data);
}

export async function deleteOutreachEvent(id: string): Promise<{ message: string; id: number }> {
  const response = await fetch(`${API_BASE}/outreach/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response, `Failed to delete outreach event ${id}`);
}

// ==========================================
// Settings API
// ==========================================

export async function getSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE}/settings`);
  const data = await handleResponse(response, 'Failed to fetch settings');
  return mapApiSettingsToSettings(data);
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const payload = mapSettingsToApiPayload(settings);
  const response = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response, 'Failed to save settings');
  return mapApiSettingsToSettings(data);
}

// ==========================================
// Development-Only Reset API
// ==========================================

export async function resetBackendData(): Promise<{ message: string; status: string }> {
  const response = await fetch(`${API_BASE}/dev/reset`, {
    method: 'POST',
  });
  return handleResponse(response, 'Failed to reset backend data');
}

// ==========================================
// Daily Lead Batch & Discovery API
// ==========================================

export interface ApiDailyLeadBatchItem {
  id: number;
  batch_id: number;
  lead_id: number;
  rank: number;
  score: number;
  reasons?: any;
  selected_at?: string | null;
  lead?: ApiLead | null;
}

export interface ApiDailyLeadBatch {
  id: number;
  date: string;
  target_count: number;
  created_at?: string | null;
  items: ApiDailyLeadBatchItem[];
}

export async function generateDailyLeads(
  force: boolean = false,
  targetCount?: number,
  regenerate: boolean = false
): Promise<ApiDailyLeadBatch> {
  const url = new URL(`${API_BASE}/discovery/generate`);
  if (force) url.searchParams.set('force', 'true');
  if (regenerate) url.searchParams.set('regenerate', 'true');
  if (targetCount) url.searchParams.set('target_count', String(targetCount));

  const response = await fetch(url.toString(), {
    method: 'POST',
  });
  return handleResponse(response, 'Failed to generate daily leads batch');
}

export async function getTodaysBatch(): Promise<ApiDailyLeadBatch | null> {
  const response = await fetch(`${API_BASE}/discovery/today`);
  if (response.status === 404) return null;
  const data = await handleResponse(response, "Failed to fetch today's batch");
  return data;
}

export async function getDiscoveryBatches(limit: number = 30): Promise<ApiDailyLeadBatch[]> {
  const response = await fetch(`${API_BASE}/discovery/batches?limit=${limit}`);
  return handleResponse(response, 'Failed to fetch discovery batches');
}

export async function getDiscoveryBatch(batchId: number): Promise<ApiDailyLeadBatch> {
  const response = await fetch(`${API_BASE}/discovery/batches/${batchId}`);
  return handleResponse(response, `Failed to fetch discovery batch ${batchId}`);
}

// ==========================================
// Rescoring API
// ==========================================

export async function rescoreLead(leadId: string | number): Promise<Lead> {
  const response = await fetch(`${API_BASE}/leads/${leadId}/rescore`, {
    method: 'POST',
  });
  const data = await handleResponse(response, `Failed to rescore lead ${leadId}`);
  return mapApiLeadToLead(data);
}

export async function rescoreAllLeads(): Promise<{ message: string; rescored_count: number }> {
  const response = await fetch(`${API_BASE}/leads/rescore-all`, {
    method: 'POST',
  });
  return handleResponse(response, 'Failed to rescore leads');
}

// ==========================================
// Ingestion API
// ==========================================

export interface IngestionCandidateInput {
  name: string;
  title?: string;
  company?: string;
  location?: string;
  linkedin_url?: string;
  role_category?: string;
  technical_areas?: string[];
  notes?: string;
  follow_up_date?: string | null;
  status?: string;
  source?: string;
}

export interface IngestionCandidateResponse {
  status: 'created' | 'duplicate' | 'invalid';
  message: string;
  lead?: ApiLead | null;
}

export interface IngestionCsvResponse {
  imported: number;
  duplicates: number;
  invalid: number;
  updated: number;
  errors: string[];
  leads_count: number;
}

export async function ingestCandidate(input: IngestionCandidateInput): Promise<IngestionCandidateResponse> {
  const response = await fetch(`${API_BASE}/ingestion/candidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  return handleResponse(response, 'Failed to ingest candidate');
}

export async function ingestCsvCandidates(
  rows: Array<Record<string, any>>,
  source: string = 'csv'
): Promise<IngestionCsvResponse> {
  const response = await fetch(`${API_BASE}/ingestion/csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rows, source }),
  });
  return handleResponse(response, 'Failed to ingest CSV candidates');
}

