import React, { useState } from 'react';
import {
  Settings,
  User,
  Cpu,
  Building2,
  Target,
  Plus,
  Trash2,
  Save,
  Check,
  RotateCcw,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import type { UserSettings } from '../types';

interface SettingsPageProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onResetToDefaults: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  onResetToDefaults,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Helper for array inputs
  const [newRole, setNewRole] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCompany, setNewCompany] = useState('');

  // New project modal / form
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const addRole = () => {
    if (newRole.trim() && !formData.targetRoles.includes(newRole.trim())) {
      setFormData({
        ...formData,
        targetRoles: [...formData.targetRoles, newRole.trim()],
      });
      setNewRole('');
    }
  };

  const removeRole = (role: string) => {
    setFormData({
      ...formData,
      targetRoles: formData.targetRoles.filter((r) => r !== role),
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.targetTechnicalSkills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        targetTechnicalSkills: [...formData.targetTechnicalSkills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      targetTechnicalSkills: formData.targetTechnicalSkills.filter((s) => s !== skill),
    });
  };

  const addLocation = () => {
    if (newLocation.trim() && !formData.targetLocations.includes(newLocation.trim())) {
      setFormData({
        ...formData,
        targetLocations: [...formData.targetLocations, newLocation.trim()],
      });
      setNewLocation('');
    }
  };

  const removeLocation = (loc: string) => {
    setFormData({
      ...formData,
      targetLocations: formData.targetLocations.filter((l) => l !== loc),
    });
  };

  const addCompany = () => {
    if (newCompany.trim() && !formData.targetCompanies.includes(newCompany.trim())) {
      setFormData({
        ...formData,
        targetCompanies: [...formData.targetCompanies, newCompany.trim()],
      });
      setNewCompany('');
    }
  };

  const removeCompany = (comp: string) => {
    setFormData({
      ...formData,
      targetCompanies: formData.targetCompanies.filter((c) => c !== comp),
    });
  };

  const addProject = () => {
    if (!newProjName.trim()) return;
    const newP = {
      name: newProjName.trim(),
      description: newProjDesc.trim() || 'Digital design project.',
      technologies: newProjTech.split(',').map((s) => s.trim()).filter(Boolean),
    };
    setFormData({
      ...formData,
      candidateProfile: {
        ...formData.candidateProfile,
        projects: [...formData.candidateProfile.projects, newP],
      },
    });
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
  };

  const removeProject = (index: number) => {
    setFormData({
      ...formData,
      candidateProfile: {
        ...formData.candidateProfile,
        projects: formData.candidateProfile.projects.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="page-settings">
      {/* Header */}
      <div className="page-header-card">
        <div className="page-header-info">
          <div className="page-tag">
            <Settings size={14} />
            <span>Targeting & Candidate Configuration</span>
          </div>
          <h2>Job Search Criteria & Candidate Profile</h2>
          <p>
            Configure your target ECE/VLSI specializations, target semiconductor companies, and customize projects for the AI message generator.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleSave}
          type="button"
        >
          {isSaved ? (
            <>
              <Check size={16} />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="settings-form-layout">
        {/* Section 1: Candidate Profile */}
        <div className="settings-card">
          <div className="card-section-title">
            <User size={18} />
            <span>Candidate Profile Information</span>
          </div>
          <p className="card-desc">
            This profile is automatically referenced by the AI message generator to craft personalized outreach notes.
          </p>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="input-label">Candidate Full Name</label>
              <input
                type="text"
                className="input-text"
                value={formData.candidateProfile.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    candidateProfile: {
                      ...formData.candidateProfile,
                      name: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="input-label">Education Background</label>
              <input
                type="text"
                className="input-text"
                value={formData.candidateProfile.education}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    candidateProfile: {
                      ...formData.candidateProfile,
                      education: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="input-label">Technical Focus Domain</label>
              <input
                type="text"
                className="input-text"
                value={formData.candidateProfile.focus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    candidateProfile: {
                      ...formData.candidateProfile,
                      focus: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="input-label">Experience Level</label>
              <input
                type="text"
                className="input-text"
                value={formData.candidateProfile.experience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    candidateProfile: {
                      ...formData.candidateProfile,
                      experience: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="input-label">Portfolio / GitHub Repository URL</label>
              <input
                type="url"
                className="input-text"
                value={formData.candidateProfile.portfolioUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    candidateProfile: {
                      ...formData.candidateProfile,
                      portfolioUrl: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label className="input-label">Resume Download Link (PDF)</label>
              <input
                type="url"
                className="input-text"
                value={formData.candidateProfile.resumeUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    candidateProfile: {
                      ...formData.candidateProfile,
                      resumeUrl: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Section 2: Projects Showcase */}
        <div className="settings-card">
          <div className="card-section-title">
            <FolderGit2 size={18} />
            <span>Showcase Projects ({formData.candidateProfile.projects.length})</span>
          </div>
          <p className="card-desc">
            These technical projects are used as proof points when generating message drafts for engineering managers and technical leads.
          </p>

          <div className="projects-list-manage">
            {formData.candidateProfile.projects.map((proj, idx) => (
              <div key={idx} className="project-manage-item">
                <div className="proj-info">
                  <strong>{proj.name}</strong>
                  <p>{proj.description}</p>
                  <div className="proj-tech-chips">
                    {proj.technologies.map((t) => (
                      <span key={t} className="skill-pill-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-delete-item"
                  onClick={() => removeProject(idx)}
                  title="Remove project"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Add project form */}
          <div className="add-project-box">
            <h4 className="add-sub-title">Add Another Project</h4>
            <div className="form-group">
              <input
                type="text"
                className="input-text"
                placeholder="Project Name (e.g. SPI Controller with DMA)"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <textarea
                className="input-text"
                rows={2}
                placeholder="Brief technical description & outcome..."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="input-text"
                placeholder="Technologies (comma separated, e.g. SystemVerilog, UVM, QuestaSim)"
                value={newProjTech}
                onChange={(e) => setNewProjTech(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={addProject}
              disabled={!newProjName.trim()}
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Section 3: Target Roles & Skills */}
        <div className="settings-card">
          <div className="card-section-title">
            <Cpu size={18} />
            <span>Target Roles & Hardware Skills</span>
          </div>

          {/* Roles */}
          <div className="form-group">
            <label className="input-label">Target Role Titles (Used in relevance scoring)</label>
            <div className="tags-interactive-wrap">
              {formData.targetRoles.map((role) => (
                <span key={role} className="tag-interactive">
                  <span>{role}</span>
                  <button
                    type="button"
                    onClick={() => removeRole(role)}
                    aria-label={`Remove ${role}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                type="text"
                className="input-text-sm"
                placeholder="Add role title (e.g. DFT Engineer Lead)..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRole();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addRole}
              >
                Add Role
              </button>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="form-group mt-4">
            <label className="input-label">Target Technical Skills (Used in keyword matching)</label>
            <div className="tags-interactive-wrap">
              {formData.targetTechnicalSkills.map((skill) => (
                <span key={skill} className="tag-interactive">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                type="text"
                className="input-text-sm"
                placeholder="Add skill (e.g. AMBA AXI, UVM, Floorplanning)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addSkill}
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Target Companies & Locations */}
        <div className="settings-card">
          <div className="card-section-title">
            <Building2 size={18} />
            <span>Target Companies & Geographic Hubs</span>
          </div>

          {/* Companies */}
          <div className="form-group">
            <label className="input-label">Priority Target Companies</label>
            <div className="tags-interactive-wrap">
              {formData.targetCompanies.map((comp) => (
                <span key={comp} className="tag-interactive">
                  <span>{comp}</span>
                  <button
                    type="button"
                    onClick={() => removeCompany(comp)}
                    aria-label={`Remove ${comp}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                type="text"
                className="input-text-sm"
                placeholder="Add company name..."
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCompany();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addCompany}
              >
                Add Company
              </button>
            </div>
          </div>

          {/* Locations */}
          <div className="form-group mt-4">
            <label className="input-label">Preferred Locations / Semiconductor Hubs</label>
            <div className="tags-interactive-wrap">
              {formData.targetLocations.map((loc) => (
                <span key={loc} className="tag-interactive">
                  <span>{loc}</span>
                  <button
                    type="button"
                    onClick={() => removeLocation(loc)}
                    aria-label={`Remove ${loc}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="tag-input-row">
              <input
                type="text"
                className="input-text-sm"
                placeholder="Add location (e.g. Bangalore, Hyderabad, Remote)..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLocation();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addLocation}
              >
                Add Location
              </button>
            </div>
          </div>
        </div>

        {/* Section 5: Discovery Engine Controls */}
        <div className="settings-card">
          <div className="card-section-title">
            <Target size={18} />
            <span>Daily Discovery Engine Parameters</span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="input-label">Daily Lead Target Count</label>
              <input
                type="number"
                min={5}
                max={50}
                className="input-text"
                value={formData.dailyLeadTarget}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyLeadTarget: Number(e.target.value) || 15,
                  })
                }
              />
              <span className="input-helper">
                Default: 15 connections per day.
              </span>
            </div>

            <div className="form-group">
              <label className="input-label">Minimum Relevance Score Threshold</label>
              <input
                type="number"
                min={30}
                max={95}
                className="input-text"
                value={formData.minRelevanceScore}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minRelevanceScore: Number(e.target.value) || 50,
                  })
                }
              />
              <span className="input-helper">
                Candidates scoring below this will be filtered out during daily discovery.
              </span>
            </div>
          </div>
        </div>

        {/* Section 6: Data Reset / Diagnostics */}
        <div className="settings-card danger-zone">
          <div className="card-section-title text-danger">
            <AlertTriangle size={18} />
            <span>Reset Demo Data & Local Storage</span>
          </div>
          <p className="card-desc">
            Clear locally saved CRM updates and restore all initial 22+ mock leads, 10 companies, and 8 jobs to their default demo states.
          </p>

          <button
            type="button"
            className="btn-danger btn-sm"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw size={14} />
            <span>Restore Default Demo Data</span>
          </button>
        </div>

        {/* Save Bar */}
        <div className="settings-sticky-save">
          <button type="submit" className="btn-primary btn-lg">
            {isSaved ? (
              <>
                <Check size={18} />
                <span>All Settings Saved!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save All Settings & Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={36} className="text-danger mb-2" />
            <h3>Reset all data to defaults?</h3>
            <p>
              This will clear your local storage and reset all contact statuses, outreach history, custom jobs, and settings back to original demo values.
            </p>
            <div className="confirm-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  onResetToDefaults();
                  setShowResetConfirm(false);
                }}
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
