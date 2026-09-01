import { useState, useEffect } from 'react';
import type {
  ActiveTab,
  Company,
  Job,
  JobStatus,
  Lead,
  LeadStatus,
  OutreachEvent,
  UserSettings,
} from './types';
import {
  loadCompanies,
  loadJobs,
  loadLeads,
  loadOutreachEvents,
  loadSettings,
  resetAllToDefault,
  saveCompanies,
  saveJobs,
  saveLeads,
  saveSettings,
  updateLeadStatus,
} from './services/storage';
import { calculateRelevanceScore } from './services/leadScoring';
import { exportLeadsToCsv } from './services/csvService';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Modals
import { LeadDetailsModal } from './components/leads/LeadDetailsModal';
import { MessageGeneratorModal } from './components/outreach/MessageGeneratorModal';
import { DiscoveryModal } from './components/leads/DiscoveryModal';
import { CsvImportModal } from './components/leads/CsvImportModal';

// Pages
import { Dashboard } from './pages/Dashboard';
import { TodaysLeads } from './pages/TodaysLeads';
import { AllLeads } from './pages/AllLeads';
import { CompaniesPage } from './pages/CompaniesPage';
import { JobsPage } from './pages/JobsPage';
import { OutreachPage } from './pages/OutreachPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  // Main State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [outreachEvents, setOutreachEvents] = useState<OutreachEvent[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadSettings());

  // Modal States
  const [activeLeadModal, setActiveLeadModal] = useState<Lead | null>(null);
  const [messageGeneratorLead, setMessageGeneratorLead] = useState<Lead | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    setLeads(loadLeads());
    setCompanies(loadCompanies());
    setJobs(loadJobs());
    setOutreachEvents(loadOutreachEvents());
  }, []);

  // Update a lead's status
  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus, note?: string) => {
    const updated = updateLeadStatus(leadId, newStatus, note);
    setLeads(updated);
    setOutreachEvents(loadOutreachEvents());

    // Also update modal active lead if open
    if (activeLeadModal && activeLeadModal.id === leadId) {
      const found = updated.find((l) => l.id === leadId);
      if (found) setActiveLeadModal(found);
    }
  };

  // Update lead custom notes
  const handleUpdateNotes = (leadId: string, notes: string) => {
    const updated = leads.map((l) =>
      l.id === leadId ? { ...l, notes, updatedAt: new Date().toISOString() } : l
    );
    setLeads(updated);
    saveLeads(updated);

    if (activeLeadModal && activeLeadModal.id === leadId) {
      const found = updated.find((l) => l.id === leadId);
      if (found) setActiveLeadModal(found);
    }
  };

  // Update lead follow-up date
  const handleUpdateFollowUpDate = (leadId: string, followUpDate: string) => {
    const updated = leads.map((l) =>
      l.id === leadId ? { ...l, followUpDate, updatedAt: new Date().toISOString() } : l
    );
    setLeads(updated);
    saveLeads(updated);

    if (activeLeadModal && activeLeadModal.id === leadId) {
      const found = updated.find((l) => l.id === leadId);
      if (found) setActiveLeadModal(found);
    }
  };

  // Open Message Generator with a chosen lead
  const handleGenerateMessage = (lead: Lead) => {
    setMessageGeneratorLead(lead);
    setIsMessageModalOpen(true);
  };

  // Open Job details / navigate to Jobs tab
  const handleViewJob = () => {
    setActiveLeadModal(null);
    setActiveTab('jobs');
  };

  // Open Company details / navigate to Companies tab
  const handleViewCompany = () => {
    setActiveLeadModal(null);
    setActiveTab('companies');
  };

  // Update job status
  const handleUpdateJobStatus = (jobId: string, status: JobStatus) => {
    const updated = jobs.map((j) => (j.id === jobId ? { ...j, status } : j));
    setJobs(updated);
    saveJobs(updated);
  };

  // Add new custom job
  const handleAddNewJob = (newJobData: Omit<Job, 'id'>) => {
    const newJob: Job = {
      ...newJobData,
      id: `job-${Date.now()}`,
    };
    const updated = [newJob, ...jobs];
    setJobs(updated);
    saveJobs(updated);
  };

  // Toggle company saved bookmark
  const handleToggleSaveCompany = (companyId: string) => {
    const updated = companies.map((c) =>
      c.id === companyId ? { ...c, isSaved: !c.isSaved } : c
    );
    setCompanies(updated);
    saveCompanies(updated);
  };

  // Save new User Settings & recalculate scores
  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    // Recalculate scores for all leads with updated criteria
    const rescoredLeads = leads.map((lead) => {
      const breakdown = calculateRelevanceScore(lead, newSettings, !!lead.associatedJobId);
      return {
        ...lead,
        relevanceScore: breakdown.normalizedScore,
        scoreBreakdown: breakdown,
      };
    });
    setLeads(rescoredLeads);
    saveLeads(rescoredLeads);
  };

  // Reset database back to default demo data
  const handleResetToDefaults = () => {
    resetAllToDefault();
    const freshSettings = loadSettings();
    setSettings(freshSettings);
    setLeads(loadLeads());
    setCompanies(loadCompanies());
    setJobs(loadJobs());
    setOutreachEvents(loadOutreachEvents());
    setActiveLeadModal(null);
    setIsMessageModalOpen(false);
  };

  // Export current leads
  const handleExportCsv = () => {
    exportLeadsToCsv(leads, `connection_finder_leads_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Discovery completion handler
  const handleDiscoveryComplete = () => {
    setLeads(loadLeads());
  };

  // Import completion handler
  const handleImportComplete = () => {
    setLeads(loadLeads());
  };

  // Metrics for sidebar
  const todaysLeads = leads.filter((l) => l.isDailyLead);
  const contactedTodayCount = todaysLeads.filter((l) =>
    ['CONNECTION_SENT', 'CONNECTED', 'MESSAGE_SENT', 'RESUME_SENT', 'FOLLOW_UP', 'REPLIED', 'INTERVIEW'].includes(
      l.status
    )
  ).length;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todaysCount={todaysLeads.length}
        contactedTodayCount={contactedTodayCount}
        dailyTarget={settings.dailyLeadTarget || 15}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main App Container */}
      <div className="app-main-container">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenDiscovery={() => setIsDiscoveryModalOpen(true)}
          onOpenImport={() => setIsImportModalOpen(true)}
          onExportCsv={handleExportCsv}
          onToggleMobileMenu={() => setIsOpenMobile(!isOpenMobile)}
        />

        {/* Dynamic Page Content */}
        <main className="app-page-body">
          {activeTab === 'dashboard' && (
            <Dashboard
              leads={leads}
              jobs={jobs}
              companies={companies}
              settings={settings}
              onSelectLead={(l) => setActiveLeadModal(l)}
              onUpdateStatus={handleUpdateStatus}
              onGenerateMessage={handleGenerateMessage}
              onOpenDiscovery={() => setIsDiscoveryModalOpen(true)}
              onViewTodaysLeads={() => setActiveTab('todays-leads')}
              onViewJob={handleViewJob}
              onViewCompany={handleViewCompany}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'todays-leads' && (
            <TodaysLeads
              leads={leads}
              jobs={jobs}
              companies={companies}
              settings={settings}
              onSelectLead={(l) => setActiveLeadModal(l)}
              onUpdateStatus={handleUpdateStatus}
              onGenerateMessage={handleGenerateMessage}
              onOpenDiscovery={() => setIsDiscoveryModalOpen(true)}
              onViewJob={handleViewJob}
              onViewCompany={handleViewCompany}
            />
          )}

          {activeTab === 'all-leads' && (
            <AllLeads
              leads={leads}
              jobs={jobs}
              companies={companies}
              settings={settings}
              onSelectLead={(l) => setActiveLeadModal(l)}
              onUpdateStatus={handleUpdateStatus}
              onGenerateMessage={handleGenerateMessage}
              onOpenImport={() => setIsImportModalOpen(true)}
              onExportCsv={handleExportCsv}
              onViewJob={handleViewJob}
              onViewCompany={handleViewCompany}
            />
          )}

          {activeTab === 'companies' && (
            <CompaniesPage
              companies={companies}
              leads={leads}
              jobs={jobs}
              onSelectLead={(l) => setActiveLeadModal(l)}
              onSelectJob={handleViewJob}
              onToggleSaveCompany={handleToggleSaveCompany}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsPage
              jobs={jobs}
              leads={leads}
              onSelectLead={(l) => setActiveLeadModal(l)}
              onUpdateJobStatus={handleUpdateJobStatus}
              onAddNewJob={handleAddNewJob}
            />
          )}

          {activeTab === 'outreach' && (
            <OutreachPage
              leads={leads}
              outreachEvents={outreachEvents}
              onSelectLead={(l) => setActiveLeadModal(l)}
              onUpdateStatus={handleUpdateStatus}
              onGenerateMessage={handleGenerateMessage}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetToDefaults={handleResetToDefaults}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}

      {/* 1. Lead Details Drawer/Modal */}
      {activeLeadModal && (
        <LeadDetailsModal
          lead={activeLeadModal}
          associatedJob={jobs.find((j) => j.id === activeLeadModal.associatedJobId)}
          associatedCompany={companies.find(
            (c) => c.name.toLowerCase() === activeLeadModal.company.toLowerCase()
          )}
          outreachEvents={outreachEvents}
          onClose={() => setActiveLeadModal(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpdateNotes={handleUpdateNotes}
          onUpdateFollowUpDate={handleUpdateFollowUpDate}
          onGenerateMessage={handleGenerateMessage}
          onViewJob={handleViewJob}
          onViewCompany={handleViewCompany}
        />
      )}

      {/* 2. AI Message Generator Modal */}
      <MessageGeneratorModal
        isOpen={isMessageModalOpen}
        lead={messageGeneratorLead}
        allLeads={leads}
        allJobs={jobs}
        settings={settings}
        onClose={() => setIsMessageModalOpen(false)}
      />

      {/* 3. Daily Discovery Animation Modal */}
      <DiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        onDiscoveryComplete={handleDiscoveryComplete}
        dailyTarget={settings.dailyLeadTarget || 15}
      />

      {/* 4. CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

export default App;
