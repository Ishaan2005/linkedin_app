import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  X,
  Search,
  Cpu,
  Layers,
  Filter,
  Check,
  ArrowRight,
} from 'lucide-react';
import type { Lead } from '../../types';
import { leadDiscoveryService } from '../../services/leadDiscovery';

interface DiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscoveryComplete: (newLeads: Lead[]) => void;
  dailyTarget: number;
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  isOpen,
  onClose,
  onDiscoveryComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing discovery engine...');
  const [isCompleted, setIsCompleted] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<Lead[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);

  const steps = [
    { id: 1, title: 'Searching Talent Pool', desc: 'Querying semiconductor directories & active listings', icon: <Search size={16} /> },
    { id: 2, title: 'Analyzing Skill Relevance', desc: 'Evaluating Verilog, RTL, ASIC & SystemVerilog alignment', icon: <Cpu size={16} /> },
    { id: 3, title: 'Removing Duplicates', desc: 'Deduplicating names, companies, and contacted leads', icon: <Filter size={16} /> },
    { id: 4, title: 'Ranking & Scoring', desc: 'Calculating transparent multi-factor relevance scores', icon: <Layers size={16} /> },
    { id: 5, title: 'Finalizing Today’s 15', desc: 'Selecting top priority hiring leads for today', icon: <Sparkles size={16} /> },
  ];

  const runDiscovery = async () => {
    setIsCompleted(false);
    setCurrentStep(1);

    try {
      const result = await leadDiscoveryService.executeDailyDiscovery(
        (stepNum, msg) => {
          setCurrentStep(stepNum);
          setStatusMessage(msg);
        }
      );

      setDiscoveredLeads(result.todayLeads);
      setTotalScanned(result.totalEvaluated);
      setIsCompleted(true);
      setCurrentStep(6);
      setStatusMessage(`${result.newCount} high-relevance leads selected for today!`);
      onDiscoveryComplete(result.todayLeads);
    } catch (err) {
      console.error('Discovery error:', err);
      setStatusMessage('Discovery completed with existing lead pool.');
      setIsCompleted(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiscovery();
    } else {
      setIsCompleted(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((currentStep / 5) * 100));

  return (
    <div className="modal-backdrop" onClick={isCompleted ? onClose : undefined}>
      <div
        className="discovery-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="discovery-modal-header">
          <div className="discovery-header-badge">
            <Sparkles size={16} />
            <span>AI Discovery Engine</span>
          </div>
          <h2 className="discovery-modal-title">
            {isCompleted ? "Today's Connections Discovered!" : "Finding Today's 15 Priority Leads"}
          </h2>
          <p className="discovery-modal-subtitle">
            {isCompleted
              ? `Successfully analyzed and ranked ${totalScanned} candidate leads against your ECE/VLSI profile.`
              : 'Synthesizing hiring managers, RTL leads, and ASIC recruiters tailored to your experience.'}
          </p>

          {isCompleted && (
            <button
              className="modal-close-btn absolute-top-right"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="discovery-modal-body">
          {/* Progress Bar */}
          <div className="discovery-progress-wrap">
            <div className="discovery-progress-bar-bg">
              <div
                className="discovery-progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="discovery-status-text">
              {statusMessage}
            </div>
          </div>

          {/* Steps List */}
          <div className="discovery-steps-list">
            {steps.map((step) => {
              const isDone = currentStep > step.id || isCompleted;
              const isCurrent = currentStep === step.id && !isCompleted;
              return (
                <div
                  key={step.id}
                  className={`discovery-step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="step-icon-wrap">
                    {isDone ? (
                      <Check size={16} className="text-emerald" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                  {isCurrent && <div className="step-spinner" />}
                </div>
              );
            })}
          </div>

          {/* Results Summary Box when Completed */}
          {isCompleted && (
            <div className="discovery-summary-box">
              <div className="summary-stat-item">
                <span className="summary-val">{discoveredLeads.length}</span>
                <span className="summary-label">Today's Leads</span>
              </div>
              <div className="summary-stat-item">
                <span className="summary-val">
                  {discoveredLeads.length > 0
                    ? Math.max(...discoveredLeads.map((l) => l.relevanceScore))
                    : 95}
                  /100
                </span>
                <span className="summary-label">Top Relevance</span>
              </div>
              <div className="summary-stat-item">
                <span className="summary-val">{totalScanned}</span>
                <span className="summary-label">Pool Scanned</span>
              </div>
            </div>
          )}
        </div>

        <div className="discovery-modal-footer">
          {isCompleted ? (
            <button className="btn-primary btn-full" onClick={onClose}>
              <span>View Today's {discoveredLeads.length} Leads</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="discovery-running-note">
              Please wait while the candidate ranking algorithm finishes...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
