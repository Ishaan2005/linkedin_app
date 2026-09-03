import type {
  ImportResult,
  Lead,
  LeadStatus,
  RoleCategory,
  TechnicalArea,
} from '../types';
import { calculateRelevanceScore } from './leadScoring';
import { getLeadDuplicateKey } from './leadDiscovery';
import { loadLeads, saveLeads, loadSettings } from './storage';

export function generateSampleCsvContent(): string {
  return `name,title,company,location,linkedin_url,email,source,technical_area
Demo Contact 23 (Anil K.),Senior ASIC Verification Manager,NVIDIA,Bangalore India,https://www.linkedin.com/in/demo-contact-23,demo-contact-23@example.com,Company website,ASIC; Design Verification; SystemVerilog
Demo Contact 24 (Rashmi M.),RTL Micro-Architect,Qualcomm,Hyderabad India,https://www.linkedin.com/in/demo-contact-24,demo-contact-24@example.com,Public directory,RTL; Verilog; AMBA APB
Demo Contact 25 (Sunil P.),Technical Recruiter - Silicon,Intel,Bangalore India,https://www.linkedin.com/in/demo-contact-25,,Public profile,VLSI; Physical Design`;
}

export function parseCsvText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim().replace(/^"|"$/g, ''));
    rows.push(row);
  }
  return rows;
}

export function inferRoleCategory(title: string): RoleCategory {
  const t = title.toLowerCase();
  if (t.includes('asic design manager')) return 'ASIC Design Manager';
  if (t.includes('rtl lead')) return 'RTL Lead';
  if (t.includes('verification lead')) return 'Verification Lead';
  if (t.includes('physical design lead')) return 'Physical Design Lead';
  if (t.includes('vlsi manager')) return 'VLSI Manager';
  if (t.includes('hiring manager')) return 'Hiring Manager';
  if (t.includes('engineering manager') || t.includes('director')) return 'Engineering Manager';
  if (t.includes('technical lead') || t.includes('principal') || t.includes('architect')) return 'Technical Lead';
  if (t.includes('technical recruiter')) return 'Technical Recruiter';
  if (t.includes('talent acquisition') || t.includes('recruiter')) return 'Recruiter';
  if (t.includes('hr')) return 'HR';
  return 'Other';
}

export function parseTechnicalAreas(text: string): TechnicalArea[] {
  if (!text) return ['VLSI'];
  const validAreas: TechnicalArea[] = [
    'VLSI',
    'ASIC',
    'RTL',
    'Verilog',
    'SystemVerilog',
    'SoC',
    'FPGA',
    'Physical Design',
    'Design Verification',
    'Computer Architecture',
    'Semiconductor',
    'AI Hardware',
    'EDA',
    'RISC-V',
  ];

  const items = text.split(/[,;|]/).map((s) => s.trim());
  const matched: TechnicalArea[] = [];

  for (const item of items) {
    const found = validAreas.find((va) => va.toLowerCase() === item.toLowerCase());
    if (found && !matched.includes(found)) {
      matched.push(found);
    }
  }

  return matched.length > 0 ? matched : ['VLSI', 'ASIC'];
}

export function importLeadsFromCsv(csvText: string): ImportResult {
  const rows = parseCsvText(csvText);
  if (rows.length < 2) {
    return {
      importedCount: 0,
      skippedCount: 0,
      duplicateCount: 0,
      errors: ['The CSV file is empty or does not contain data rows.'],
    };
  }

  const header = rows[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]/g, ''));
  const nameIdx = header.findIndex((h) => h === 'name' || h === 'fullname' || h === 'leadname');
  const titleIdx = header.findIndex((h) => h === 'title' || h === 'jobtitle' || h === 'role');
  const companyIdx = header.findIndex((h) => h === 'company' || h === 'companyname' || h === 'organization');
  const locationIdx = header.findIndex((h) => h === 'location' || h === 'city' || h === 'region');
  const linkedinIdx = header.findIndex((h) => h === 'linkedinurl' || h === 'linkedin' || h === 'profileurl');
  const emailIdx = header.findIndex((h) => h === 'email' || h === 'emailaddress');
  const sourceIdx = header.findIndex((h) => h === 'source' || h === 'datasource');
  const techIdx = header.findIndex((h) => h === 'technicalarea' || h === 'technicalareas' || h === 'skills');

  if (nameIdx === -1 || titleIdx === -1 || companyIdx === -1) {
    return {
      importedCount: 0,
      skippedCount: 0,
      duplicateCount: 0,
      errors: [
        `Missing required header columns. Found headers: [${rows[0].join(', ')}]. Expected at least: name, title, company.`,
      ],
    };
  }

  const currentLeads = loadLeads();
  const settings = loadSettings();
  const existingKeys = new Set(currentLeads.map((l) => getLeadDuplicateKey(l)));

  let importedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  const errors: string[] = [];
  const newLeads: Lead[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const name = row[nameIdx] || '';
    const title = row[titleIdx] || '';
    const company = row[companyIdx] || '';
    const location = (locationIdx !== -1 ? row[locationIdx] : '') || 'India';
    const linkedinUrl = (linkedinIdx !== -1 ? row[linkedinIdx] : '') || '#';
    const email = (emailIdx !== -1 ? row[emailIdx] : '') || undefined;
    const source = (sourceIdx !== -1 ? row[sourceIdx] : '') || 'CSV Import';
    const techText = techIdx !== -1 ? row[techIdx] : '';

    if (!name.trim() || !title.trim() || !company.trim()) {
      skippedCount++;
      errors.push(`Row ${i + 1}: Skipped due to missing name, title, or company.`);
      continue;
    }

    const tempLead: Partial<Lead> = {
      name: name.trim(),
      company: company.trim(),
      linkedinUrl: linkedinUrl.trim(),
    };

    const duplicateKey = getLeadDuplicateKey(tempLead);
    if (existingKeys.has(duplicateKey)) {
      duplicateCount++;
      continue;
    }

    existingKeys.add(duplicateKey);

    const technicalAreas = parseTechnicalAreas(techText);
    const roleCategory = inferRoleCategory(title);

    const partialLead: Partial<Lead> = {
      name: name.trim(),
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      technicalAreas,
      roleCategory,
      linkedinUrl: linkedinUrl.trim(),
      email: email ? email.trim() : undefined,
      emailSource: email ? 'User entered' : undefined,
      emailConfidence: email ? 'User-provided' : undefined,
      dataSource: source.trim() || 'CSV Import',
      status: 'NEW' as LeadStatus,
      isDailyLead: false,
      discoveredDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const breakdown = calculateRelevanceScore(partialLead, settings, false);

    const fullLead: Lead = {
      id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      name: partialLead.name!,
      title: partialLead.title!,
      company: partialLead.company!,
      location: partialLead.location!,
      technicalAreas: partialLead.technicalAreas!,
      roleCategory: partialLead.roleCategory!,
      relevanceScore: breakdown.normalizedScore,
      scoreBreakdown: breakdown,
      recommendationReason: `Imported lead (${source}): ${breakdown.summaryExplanation}`,
      linkedinUrl: partialLead.linkedinUrl!,
      email: partialLead.email,
      emailSource: partialLead.emailSource,
      emailConfidence: partialLead.emailConfidence,
      dataSource: partialLead.dataSource!,
      status: 'NEW',
      isDailyLead: false,
      discoveredDate: partialLead.discoveredDate!,
      createdAt: partialLead.createdAt!,
      updatedAt: partialLead.updatedAt!,
    };

    newLeads.push(fullLead);
    importedCount++;
  }

  if (newLeads.length > 0) {
    saveLeads([...newLeads, ...currentLeads]);
  }

  return {
    importedCount,
    skippedCount,
    duplicateCount,
    errors,
  };
}

export function exportLeadsToCsv(leads: Lead[], filename = 'connection_finder_leads.csv'): void {
  const headers = [
    'name',
    'title',
    'company',
    'location',
    'linkedin_url',
    'email',
    'relevance_score',
    'status',
    'last_contacted',
    'follow_up_date',
    'notes',
    'technical_areas',
    'data_source',
  ];

  const escapeCsv = (str: string | number | undefined) => {
    if (str === undefined || str === null) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = leads.map((l) => [
    escapeCsv(l.name),
    escapeCsv(l.title),
    escapeCsv(l.company),
    escapeCsv(l.location),
    escapeCsv(l.linkedinUrl),
    escapeCsv(l.email || ''),
    escapeCsv(l.relevanceScore),
    escapeCsv(l.status),
    escapeCsv(l.lastContactedDate || ''),
    escapeCsv(l.followUpDate || ''),
    escapeCsv(l.notes || ''),
    escapeCsv(l.technicalAreas.join('; ')),
    escapeCsv(l.dataSource),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
