import type { Lead, ScoreBreakdown, UserSettings } from '../types';

export function calculateRelevanceScore(
  lead: Partial<Lead>,
  settings: UserSettings,
  hasAssociatedJob: boolean = false
): ScoreBreakdown {
  let rolePoints = 0;
  let roleReason = '';

  const titleLower = (lead.title || '').toLowerCase();
  const roleCategory = lead.roleCategory || 'Other';

  // 1. Role Score
  if (
    titleLower.includes('hiring manager') ||
    titleLower.includes('asic design manager') ||
    roleCategory === 'Hiring Manager' ||
    roleCategory === 'ASIC Design Manager'
  ) {
    rolePoints = 30;
    roleReason = 'Direct decision maker / Hiring Manager in hardware domain';
  } else if (
    titleLower.includes('engineering manager') ||
    titleLower.includes('vlsi manager') ||
    roleCategory === 'Engineering Manager' ||
    roleCategory === 'VLSI Manager'
  ) {
    rolePoints = 25;
    roleReason = 'Engineering leadership with direct team oversight';
  } else if (
    titleLower.includes('technical lead') ||
    titleLower.includes('rtl lead') ||
    titleLower.includes('verification lead') ||
    titleLower.includes('physical design lead') ||
    titleLower.includes('principal engineer') ||
    titleLower.includes('staff engineer') ||
    roleCategory === 'Technical Lead' ||
    roleCategory === 'RTL Lead' ||
    roleCategory === 'Verification Lead' ||
    roleCategory === 'Physical Design Lead'
  ) {
    rolePoints = 25;
    roleReason = 'Senior technical lead / architect involved in interviews';
  } else if (
    titleLower.includes('technical recruiter') ||
    titleLower.includes('talent acquisition') ||
    titleLower.includes('recruiter') ||
    roleCategory === 'Technical Recruiter' ||
    roleCategory === 'Recruiter' ||
    roleCategory === 'Talent Acquisition'
  ) {
    rolePoints = 20;
    roleReason = 'Specialized technical recruiter managing active job openings';
  } else if (titleLower.includes('hr') || roleCategory === 'HR') {
    rolePoints = 15;
    roleReason = 'People operations / Human Resources contact';
  } else {
    rolePoints = 10;
    roleReason = 'Professional contact in the semiconductor industry';
  }

  // 2. Technical Relevance
  let technicalPoints = 0;
  const techReasons: string[] = [];
  const areas = lead.technicalAreas || [];
  const areasLower = areas.map((a) => a.toLowerCase());

  const hasAsicVlsi = areasLower.some(
    (a) => a.includes('vlsi') || a.includes('asic')
  );
  const hasRtlVerilog = areasLower.some(
    (a) =>
      a.includes('rtl') ||
      a.includes('verilog') ||
      a.includes('systemverilog')
  );
  const hasVerification = areasLower.some(
    (a) => a.includes('verification') || a.includes('dv')
  );
  const hasSocFpga = areasLower.some(
    (a) =>
      a.includes('soc') ||
      a.includes('fpga') ||
      a.includes('physical design') ||
      a.includes('risc-v') ||
      a.includes('ai hardware') ||
      a.includes('eda') ||
      a.includes('semiconductor')
  );

  if (hasAsicVlsi) {
    technicalPoints += 20;
    techReasons.push('VLSI / ASIC domain (+20)');
  }
  if (hasRtlVerilog) {
    technicalPoints += 20;
    techReasons.push('RTL / SystemVerilog (+20)');
  }
  if (hasVerification || hasSocFpga) {
    technicalPoints += 10;
    techReasons.push('SoC / Verification / Physical Design (+10)');
  }

  // Check against user target technical skills
  const matchedUserSkills = settings.targetTechnicalSkills.filter((skill) =>
    titleLower.includes(skill.toLowerCase()) ||
    areasLower.some((a) => a.includes(skill.toLowerCase()))
  );
  if (matchedUserSkills.length > 0 && technicalPoints < 45) {
    technicalPoints += 5;
    techReasons.push(`Matches target skill (${matchedUserSkills[0]}) (+5)`);
  }

  const technicalReason =
    techReasons.length > 0
      ? techReasons.join(', ')
      : 'General semiconductor alignment';

  // 3. Company Relevance
  let companyPoints = 0;
  let companyReason = '';
  const leadCompanyLower = (lead.company || '').toLowerCase();
  const isTargetCompany = settings.targetCompanies.some((tc) =>
    leadCompanyLower.includes(tc.toLowerCase())
  );

  if (isTargetCompany) {
    companyPoints = 15;
    companyReason = `Direct match in target company watchlist (${lead.company})`;
  } else if (lead.company) {
    companyPoints = 8;
    companyReason = 'Semiconductor / hardware ecosystem company';
  } else {
    companyPoints = 0;
    companyReason = 'Company unverified';
  }

  // 4. Job Relevance
  let jobPoints = 0;
  let jobReason = '';
  if (hasAssociatedJob || lead.associatedJobId) {
    jobPoints = 15;
    jobReason = 'Directly tied to an active, relevant VLSI/ASIC job opening';
  } else {
    jobPoints = 0;
    jobReason = 'No active direct job currently attached';
  }

  // 5. Location Match
  let locationPoints = 0;
  let locationReason = '';
  const leadLocationLower = (lead.location || '').toLowerCase();
  const isTargetLocation = settings.targetLocations.some((loc) =>
    leadLocationLower.includes(loc.toLowerCase())
  );

  if (isTargetLocation || leadLocationLower.includes('india') || leadLocationLower.includes('remote')) {
    locationPoints = 10;
    locationReason = `Matches preferred region (${lead.location || 'India/Remote'})`;
  } else if (lead.location) {
    locationPoints = 5;
    locationReason = `Global semiconductor hub (${lead.location})`;
  } else {
    locationPoints = 0;
    locationReason = 'Location not specified';
  }

  const rawTotal =
    rolePoints + technicalPoints + companyPoints + jobPoints + locationPoints;

  const normalizedScore = Math.min(
    99,
    Math.max(25, Math.round((rawTotal / 115) * 100))
  );

  const keyFactors: string[] = [];
  if (rolePoints >= 25) keyFactors.push(roleReason);
  if (hasAsicVlsi || hasRtlVerilog) keyFactors.push('strong RTL/ASIC relevance');
  if (companyPoints >= 15) keyFactors.push(`key target firm (${lead.company})`);
  if (jobPoints > 0) keyFactors.push('linked to open job');
  if (locationPoints >= 10) keyFactors.push('in target hiring hub');

  const summaryExplanation =
    keyFactors.length > 0
      ? `High relevance: ${keyFactors.join('; ')}.`
      : 'Relevant contact aligned with hardware and semiconductor networking goals.';

  return {
    rolePoints,
    roleReason,
    technicalPoints,
    technicalReason,
    companyPoints,
    companyReason,
    jobPoints,
    jobReason,
    locationPoints,
    locationReason,
    rawTotal,
    normalizedScore,
    summaryExplanation,
  };
}
