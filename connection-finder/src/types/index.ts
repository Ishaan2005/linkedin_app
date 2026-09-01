export type LeadStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'CONNECTION_SENT'
  | 'CONNECTED'
  | 'MESSAGE_SENT'
  | 'RESUME_SENT'
  | 'FOLLOW_UP'
  | 'REPLIED'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'ARCHIVED';

export type JobStatus =
  | 'NEW'
  | 'SAVED'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'REJECTED'
  | 'CLOSED';

export type RoleCategory =
  | 'Hiring Manager'
  | 'Engineering Manager'
  | 'Technical Lead'
  | 'ASIC Design Manager'
  | 'RTL Lead'
  | 'VLSI Manager'
  | 'Verification Lead'
  | 'Physical Design Lead'
  | 'Recruiter'
  | 'Technical Recruiter'
  | 'Talent Acquisition'
  | 'HR'
  | 'Other';

export type TechnicalArea =
  | 'VLSI'
  | 'ASIC'
  | 'RTL'
  | 'Verilog'
  | 'SystemVerilog'
  | 'SoC'
  | 'FPGA'
  | 'Physical Design'
  | 'Design Verification'
  | 'Computer Architecture'
  | 'Semiconductor'
  | 'AI Hardware'
  | 'EDA'
  | 'RISC-V'
  | 'AMBA APB'
  | 'Digital Design'
  | 'Other';

export type EmailSource =
  | 'Company website'
  | 'Public profile'
  | 'User entered'
  | 'API';

export type EmailConfidence =
  | 'Verified'
  | 'Public'
  | 'User-provided'
  | 'Unknown';

export interface ScoreBreakdown {
  rolePoints: number;
  roleReason: string;
  technicalPoints: number;
  technicalReason: string;
  companyPoints: number;
  companyReason: string;
  jobPoints: number;
  jobReason: string;
  locationPoints: number;
  locationReason: string;
  rawTotal: number;
  normalizedScore: number;
  summaryExplanation: string;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  technicalAreas: TechnicalArea[];
  roleCategory: RoleCategory;
  relevanceScore: number;
  scoreBreakdown?: ScoreBreakdown;
  recommendationReason: string;
  linkedinUrl: string;
  email?: string;
  emailSource?: EmailSource;
  emailConfidence?: EmailConfidence;
  dataSource: string; // e.g. "Public directory", "Company website", "CSV Import", "Demo data"
  associatedJobId?: string;
  associatedCompanyName?: string;
  status: LeadStatus;
  isDailyLead: boolean;
  discoveredDate: string; // ISO date string YYYY-MM-DD
  lastContactedDate?: string;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  websiteUrl: string;
  linkedinUrl: string;
  techFocus: TechnicalArea[];
  description: string;
  lastResearched: string;
  tier: 'Tier 1' | 'Tier 2' | 'Startup' | 'Target';
  isSaved: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  requiredSkills: string[];
  dateDiscovered: string;
  status: JobStatus;
  salaryRange?: string;
  experienceLevel?: string;
  associatedContactIds?: string[];
}

export interface OutreachEvent {
  id: string;
  leadId: string;
  leadName: string;
  leadTitle: string;
  company: string;
  date: string;
  status: LeadStatus;
  note: string;
  actionTaken: string;
  messageType?: 'Connection request' | 'LinkedIn message' | 'Cold email' | 'Follow-up' | 'Thank-you';
  generatedText?: string;
}

export interface CandidateProfile {
  name: string;
  education: string;
  focus: string;
  skills: string[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  experience: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  email: string;
}

export interface UserSettings {
  targetRoles: string[];
  targetTechnicalSkills: string[];
  targetLocations: string[];
  targetCompanies: string[];
  dailyLeadTarget: number;
  minRelevanceScore: number;
  candidateProfile: CandidateProfile;
  lastDailyGenerationDate?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'todays-leads'
  | 'all-leads'
  | 'companies'
  | 'jobs'
  | 'outreach'
  | 'settings';

export interface LeadFilterState {
  searchQuery: string;
  role: string;
  technicalArea: string;
  location: string;
  company: string;
  status: string;
  minScore: number;
  dateDiscovered: string;
  sortBy: 'relevance' | 'newest' | 'company' | 'lastContacted' | 'followUpDate';
  sortOrder: 'asc' | 'desc';
}

export interface CsvImportRow {
  name: string;
  title: string;
  company: string;
  location?: string;
  linkedin_url?: string;
  email?: string;
  source?: string;
  technical_area?: string;
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  errors: string[];
}
