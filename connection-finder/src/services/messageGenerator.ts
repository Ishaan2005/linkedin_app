import type { CandidateProfile, Job, Lead } from '../types';

export type MessageType =
  | 'Connection request'
  | 'LinkedIn message'
  | 'Cold email'
  | 'Follow-up'
  | 'Thank-you';

export type MessageTone = 'Professional' | 'Technical & Direct' | 'Enthusiastic';

export interface MessageGeneratorParams {
  lead: Lead;
  job?: Job;
  selectedProjectName?: string;
  selectedSkill?: string;
  messageType: MessageType;
  tone: MessageTone;
  candidateProfile: CandidateProfile;
  customNote?: string;
}

export interface GeneratedMessageResult {
  subject?: string;
  body: string;
  characterCount: number;
  isWithinLimit: boolean;
  limitNotice?: string;
}

export function generateMessageDraft(params: MessageGeneratorParams): GeneratedMessageResult {
  const {
    lead,
    job,
    selectedProjectName,
    selectedSkill,
    messageType,
    tone,
    candidateProfile,
    customNote,
  } = params;

  const firstName = lead.name.split(' ')[0] || lead.name;
  const project = candidateProfile.projects.find((p) => p.name === selectedProjectName) || candidateProfile.projects[0];
  const skill = selectedSkill || project?.technologies?.[0] || 'SystemVerilog / RTL';

  let subject: string | undefined = undefined;
  let body = '';

  switch (messageType) {
    case 'Connection request': {
      // Under 300 characters for LinkedIn connection note limit
      if (tone === 'Technical & Direct') {
        if (job) {
          body = `Hi ${firstName}, I came across your team's ${job.title} role at ${lead.company}. I specialize in ${skill} (built ${project.name}) and would appreciate connecting with you.`;
        } else {
          body = `Hi ${firstName}, saw your hardware work at ${lead.company}. I'm an ECE graduate focusing on ${skill} & ${project.name}. Would love to connect and follow your team's work.`;
        }
      } else if (tone === 'Enthusiastic') {
        if (job) {
          body = `Hello ${firstName}! Extremely excited by ${lead.company}'s silicon innovations. I recently completed ${project.name} in ${skill} and would love to connect regarding ${job.title}!`;
        } else {
          body = `Hello ${firstName}, really inspired by your leadership in ${lead.technicalAreas[0] || 'VLSI'} at ${lead.company}. Would love to connect with fellow hardware engineers!`;
        }
      } else {
        // Professional default
        if (job) {
          body = `Hi ${firstName}, I saw the ${job.title} opening at ${lead.company}. With hands-on experience in ${skill} & ${project.name}, I would value connecting with you.`;
        } else {
          body = `Hi ${firstName}, I'm an ECE candidate focusing on ${lead.technicalAreas[0] || 'VLSI/ASIC'} design at ${lead.company}. Would value having you in my network!`;
        }
      }
      break;
    }

    case 'LinkedIn message': {
      if (job) {
        body = `Hi ${firstName},

I hope you are having a productive week.

I noticed the ${job.title} opening in your group at ${lead.company} and wanted to reach out directly. My background is in Electronics & Communication Engineering with a core focus on VLSI, ASIC design, and ${skill}.

Recently, I designed:
• ${project.name}: ${project.description}
• Tech Stack: ${project.technologies.join(', ')}

Given your team's work in ${lead.company}, I would greatly appreciate the opportunity to learn if my skill set matches your team's requirements.

My portfolio & verified RTL implementations: ${candidateProfile.portfolioUrl || 'https://github.com/example/vlsi-asic-portfolio'}

${customNote ? `\nNote: ${customNote}\n` : ''}
Thank you very much for your time and guidance.

Best regards,
${candidateProfile.name}`;
      } else {
        body = `Hi ${firstName},

I hope this message finds you well.

I follow ${lead.company}'s silicon engineering developments closely and wanted to connect regarding your team's work in ${lead.technicalAreas.join(', ')}.

As an ECE candidate specializing in digital design and verification, I have focused heavily on synthesis-ready hardware projects, including:
• ${project.name}: ${project.description}
• Core competencies: ${candidateProfile.skills.slice(0, 5).join(', ')}

I would love to learn more about upcoming opportunities within your engineering org or any advice you might have for an aspiring hardware engineer.

Best regards,
${candidateProfile.name}`;
      }
      break;
    }

    case 'Cold email': {
      subject = job
        ? `Application Inquiry: ${job.title} — ${candidateProfile.name} (ECE / ${skill})`
        : `VLSI & ASIC Engineering Inquiry — ${candidateProfile.name} | ${lead.company}`;

      body = `Dear ${lead.name},

I hope you are doing well.

I am writing to express my strong interest in silicon engineering opportunities within ${lead.company}${job ? `, specifically for the ${job.title} role (Location: ${job.location})` : ''}.

I hold a background in ${candidateProfile.education} with dedicated focus on ${candidateProfile.focus}. My hands-on engineering projects closely align with your team's domain:

1. ${project.name}
   - ${project.description}
   - Key tools/skills: ${project.technologies.join(', ')}

2. Key Technical Strengths:
   - Languages & HDL: ${candidateProfile.skills.slice(0, 6).join(', ')}
   - Design flow: RTL Coding, Simulation, Linting, STA, and SkyWater 130nm RTL-to-GDS closure.

I have attached my resume and you can review my open-source RTL codebase here:
${candidateProfile.portfolioUrl || 'https://github.com/example/vlsi-asic-portfolio'}

I would welcome the chance for a brief 10-minute conversation or referral consideration if my profile matches your team's needs.

Thank you for your consideration.

Warm regards,
${candidateProfile.name}
${candidateProfile.email}
LinkedIn: ${candidateProfile.portfolioUrl || 'linkedin.com/in/aarav-patel-ece'}`;
      break;
    }

    case 'Follow-up': {
      subject = `Following up: Silicon Engineering inquiry / ${candidateProfile.name}`;

      body = `Hi ${firstName},

I hope you are having a great week.

I wanted to briefly follow up on my earlier note regarding opportunities in your hardware group at ${lead.company}. I remain very enthusiastic about the work your team is doing in ${lead.technicalAreas.slice(0, 2).join(' and ') || 'ASIC design'}.

Since my last note, I have added further benchmarks to my ${project.name} project. Please let me know if you would like me to share my updated resume or GitHub repository.

Thank you again for your time!

Best regards,
${candidateProfile.name}`;
      break;
    }

    case 'Thank-you': {
      subject = `Thank you for your time and guidance — ${candidateProfile.name}`;

      body = `Dear ${lead.name},

Thank you very much for connecting and taking the time to share insights about ${lead.company}'s engineering initiatives.

I really appreciated your perspective on ${lead.technicalAreas.slice(0, 2).join(' / ') || 'hardware engineering'} and the discussion regarding digital design best practices.

I look forward to keeping in touch as I continue my journey in the VLSI industry.

Best regards,
${candidateProfile.name}`;
      break;
    }
  }

  const characterCount = body.length;
  const isWithinLimit = messageType !== 'Connection request' || characterCount <= 300;
  const limitNotice =
    messageType === 'Connection request'
      ? `${characterCount}/300 characters ${characterCount > 300 ? '(Exceeds LinkedIn 300 char connection note limit)' : '(LinkedIn connection note limit: 300)'}`
      : `${characterCount} characters`;

  return {
    subject,
    body,
    characterCount,
    isWithinLimit,
    limitNotice,
  };
}
