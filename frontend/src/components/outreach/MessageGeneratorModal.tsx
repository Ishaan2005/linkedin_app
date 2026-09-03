import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { Job, Lead, UserSettings } from '../../types';
import {
  generateMessageDraft,
  type MessageTone,
  type MessageType,
} from '../../services/messageGenerator';
import { LinkedinBadge } from '../common/LinkedinBadge';

interface MessageGeneratorModalProps {
  isOpen: boolean;
  lead: Lead | null;
  allLeads: Lead[];
  allJobs: Job[];
  settings: UserSettings;
  onClose: () => void;
  onLeadSelect?: (lead: Lead) => void;
}

export const MessageGeneratorModal: React.FC<MessageGeneratorModalProps> = ({
  isOpen,
  lead,
  allLeads,
  allJobs,
  settings,
  onClose,
}) => {
  if (!isOpen) return null;

  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    lead?.id || (allLeads[0]?.id ?? '')
  );
  const [selectedJobId, setSelectedJobId] = useState<string>(
    lead?.associatedJobId || ''
  );
  const [messageType, setMessageType] = useState<MessageType>('Connection request');
  const [tone, setTone] = useState<MessageTone>('Professional');
  const [selectedProjectName, setSelectedProjectName] = useState<string>(
    settings.candidateProfile.projects[0]?.name || ''
  );
  const [selectedSkill] = useState<string>(
    settings.candidateProfile.skills[0] || 'SystemVerilog'
  );
  const [customNote, setCustomNote] = useState<string>('');

  const [generatedSubject, setGeneratedSubject] = useState<string>('');
  const [editableBody, setEditableBody] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const currentLead =
    allLeads.find((l) => l.id === selectedLeadId) || lead || allLeads[0];
  const currentJob = allJobs.find((j) => j.id === selectedJobId);

  const runGeneration = () => {
    if (!currentLead) return;

    const result = generateMessageDraft({
      lead: currentLead,
      job: currentJob,
      selectedProjectName,
      selectedSkill,
      messageType,
      tone,
      candidateProfile: settings.candidateProfile,
      customNote,
    });

    setGeneratedSubject(result.subject || '');
    setEditableBody(result.body);
  };

  useEffect(() => {
    if (lead) {
      setSelectedLeadId(lead.id);
      setSelectedJobId(lead.associatedJobId || '');
    }
  }, [lead]);

  useEffect(() => {
    runGeneration();
  }, [selectedLeadId, selectedJobId, messageType, tone, selectedProjectName, selectedSkill]);

  const handleCopyBody = () => {
    navigator.clipboard.writeText(editableBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySubject = () => {
    if (generatedSubject) {
      navigator.clipboard.writeText(generatedSubject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    }
  };

  const charCount = editableBody.length;
  const isLinkedInConnNote = messageType === 'Connection request';
  const isOverLimit = isLinkedInConnNote && charCount > 300;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="message-generator-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge sparkle">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="modal-title">AI-Assisted Message Generator</h2>
              <p className="modal-subtitle">
                Create tailored outreach drafts backed by your actual ECE/VLSI projects.
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="disclaimer-banner">
          <AlertCircle size={15} />
          <span>
            <strong>Manual outreach:</strong> This tool crafts the draft text for you. You review, personalize, and manually send it via LinkedIn or Email.
          </span>
        </div>

        <div className="modal-body-scroll generator-grid">
          {/* Controls Column */}
          <div className="generator-controls-col">
            {/* Target Contact Selector */}
            <div className="form-group">
              <label className="input-label">Target Contact</label>
              <select
                className="input-select"
                value={selectedLeadId}
                onChange={(e) => {
                  setSelectedLeadId(e.target.value);
                  const found = allLeads.find((l) => l.id === e.target.value);
                  if (found?.associatedJobId) {
                    setSelectedJobId(found.associatedJobId);
                  }
                }}
              >
                {allLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.title} ({l.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Message Type */}
            <div className="form-group">
              <label className="input-label">Message Type</label>
              <div className="radio-pills-group">
                {(
                  [
                    'Connection request',
                    'LinkedIn message',
                    'Cold email',
                    'Follow-up',
                    'Thank-you',
                  ] as MessageType[]
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`radio-pill ${messageType === type ? 'active' : ''}`}
                    onClick={() => setMessageType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="form-group">
              <label className="input-label">Tone & Style</label>
              <div className="radio-pills-group">
                {(
                  [
                    'Professional',
                    'Technical & Direct',
                    'Enthusiastic',
                  ] as MessageTone[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`radio-pill ${tone === t ? 'active' : ''}`}
                    onClick={() => setTone(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Project to Highlight */}
            <div className="form-group">
              <label className="input-label">Featured Project from Profile</label>
              <select
                className="input-select"
                value={selectedProjectName}
                onChange={(e) => setSelectedProjectName(e.target.value)}
              >
                {settings.candidateProfile.projects.map((proj) => (
                  <option key={proj.name} value={proj.name}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Associated Job Requisition */}
            <div className="form-group">
              <label className="input-label">Associated Job Requisition (Optional)</label>
              <select
                className="input-select"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="">No specific job (General outreach)</option>
                {allJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.company})
                  </option>
                ))}
              </select>
            </div>

            {/* Extra custom note */}
            <div className="form-group">
              <label className="input-label">Custom note / angle (Optional)</label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. Met at campus placement talk, or paper referral"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>

            <button
              className="btn-secondary btn-sm regenerate-btn"
              onClick={runGeneration}
            >
              <RefreshCw size={14} />
              <span>Regenerate Draft</span>
            </button>
          </div>

          {/* Preview & Editor Column */}
          <div className="generator-preview-col">
            {/* Subject Line (if Cold Email / Follow-up) */}
            {generatedSubject && (
              <div className="subject-box">
                <div className="subject-label-row">
                  <span className="input-label">Subject Line</span>
                  <button
                    className="btn-copy-sm"
                    onClick={handleCopySubject}
                  >
                    {copiedSubject ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSubject ? 'Copied' : 'Copy Subject'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="subject-input"
                  value={generatedSubject}
                  onChange={(e) => setGeneratedSubject(e.target.value)}
                />
              </div>
            )}

            {/* Message Body Editor */}
            <div className="message-body-wrap">
              <div className="body-label-row">
                <span className="input-label">Generated Message Body (Editable)</span>
                <span
                  className={`char-counter ${isOverLimit ? 'over-limit' : ''}`}
                >
                  {charCount} characters{' '}
                  {isLinkedInConnNote && (
                    <span>(Limit: 300)</span>
                  )}
                </span>
              </div>

              <textarea
                className={`generated-textarea ${isOverLimit ? 'has-error' : ''}`}
                rows={11}
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
              />

              {isOverLimit && (
                <div className="char-warning">
                  ⚠️ Note exceeds 300 characters for LinkedIn connection requests. Please trim slightly.
                </div>
              )}
            </div>

            {/* Quick action triggers */}
            <div className="preview-footer-actions">
              <button
                className="btn-primary copy-big-btn"
                onClick={handleCopyBody}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span>Copied Draft to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Message to Clipboard</span>
                  </>
                )}
              </button>

              {currentLead && (
                <a
                  href={currentLead.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  title="Open candidate's LinkedIn profile"
                >
                  <LinkedinBadge size={14} />
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
