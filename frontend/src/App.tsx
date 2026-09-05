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
  getLeads,
  updateLead,
  updateLeadStatus as updateLeadStatusAPI,
  getCompanies,
  toggleSaveCompany as toggleSaveCompanyAPI,
  getJobs,
  createJob as createJobAPI,
  updateJobStatus as updateJobStatusAPI,
  getOutreachEvents,
  getSettings,
  saveSettings as saveSettingsAPI,
  resetBackendData,
  getTodaysBatch,
  rescoreAllLeads,
} from './services/api';
import { defaultSettings } from './data/mockData';
import { saveSettings as saveSettingsToLocal, resetAllToDefault } from './services/storage';
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
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal States
  const [activeLeadModal, setActiveLeadModal] = useState<Lead | null>(null);
  const [messageGeneratorLead, setMessageGeneratorLead] = useState<Lead | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Initialize data on mount from FastAPI backend
  useEffect(() => {
    async function initApp() {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const [
          leadsData,
          companiesData,
          jobsData,
          outreachData,
          settingsData,
          todaysBatch,
        ] = await Promise.all([
          getLeads(),
          getCompanies(),
          getJobs(),
          getOutreachEvents(),
          getSettings(),
          getTodaysBatch().catch(() => null),
        ]);

        const todayLeadIds = new Set(
          (todaysBatch?.items || []).map((item) => String(item.lead_id))
        );

        const markedLeads = leadsData.map((lead) => ({
          ...lead,
          isDailyLead: todayLeadIds.has(lead.id),
        }));

        setLeads(markedLeads);
        setCompanies(companiesData);
        setJobs(jobsData);
        setOutreachEvents(outreachData);
        setSettings(settingsData);
        // Sync local cache fallback for synchronous helper components
        saveSettingsToLocal(settingsData);
      } catch (error: any) {
        console.error('Failed to initialize application data from backend:', error);
        setErrorMsg(error?.message || 'Failed to connect to backend server');
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, []);

  // Update a lead's status (persists in backend and auto-generates outreach history)
  const handleUpdateStatus = async (
    leadId: string,
    newStatus: LeadStatus,
    note?: string
  ) => {
    try {
      await updateLeadStatusAPI(leadId, newStatus, note);

      // Refresh leads and outreach events from backend
      const [updatedLeads, updatedEvents] = await Promise.all([
        getLeads(),
        getOutreachEvents(),
      ]);

      setLeads(updatedLeads);
      setOutreachEvents(updatedEvents);

      // Keep active lead modal in sync if currently viewing this lead
      if (activeLeadModal && activeLeadModal.id === leadId) {
        const targetLead = updatedLeads.find((l) => l.id === leadId);
        if (targetLead) {
          setActiveLeadModal(targetLead);
        }
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  // Update lead custom notes
  const handleUpdateNotes = async (leadId: string, notes: string) => {
    try {
      await updateLead(leadId, { notes });
      const updated = await getLeads();
      setLeads(updated);

      if (activeLeadModal && activeLeadModal.id === leadId) {
        const found = updated.find((l) => l.id === leadId);
        if (found) setActiveLeadModal(found);
      }
    } catch (error) {
      console.error('Failed to update lead notes:', error);
    }
  };

  // Update lead follow-up date
  const handleUpdateFollowUpDate = async (leadId: string, followUpDate: string) => {
    try {
      await updateLead(leadId, { followUpDate });
      const updated = await getLeads();
      setLeads(updated);

      if (activeLeadModal && activeLeadModal.id === leadId) {
        const found = updated.find((l) => l.id === leadId);
        if (found) setActiveLeadModal(found);
      }
    } catch (error) {
      console.error('Failed to update lead follow-up date:', error);
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

  // Update job status in backend
  const handleUpdateJobStatus = async (jobId: string, status: JobStatus) => {
    try {
      await updateJobStatusAPI(jobId, status);
      const updatedJobs = await getJobs();
      setJobs(updatedJobs);
    } catch (error) {
      console.error('Failed to update job status in backend:', error);
    }
  };

  // Add new custom job in backend
  const handleAddNewJob = async (newJobData: Omit<Job, 'id'>) => {
    try {
      await createJobAPI(newJobData);
      const updatedJobs = await getJobs();
      setJobs(updatedJobs);
    } catch (error) {
      console.error('Failed to create new job in backend:', error);
    }
  };

  // Toggle company saved bookmark in backend
  const handleToggleSaveCompany = async (companyId: string) => {
    try {
      const targetCompany = companies.find((c) => c.id === companyId);
      const newSaved = targetCompany ? !targetCompany.isSaved : true;
      await toggleSaveCompanyAPI(companyId, newSaved);
      const updatedCompanies = await getCompanies();
      setCompanies(updatedCompanies);
    } catch (error) {
      console.error('Failed to toggle saved company:', error);
    }
  };

  // Save new User Settings to backend & recalculate scores
  const handleSaveSettings = async (newSettings: UserSettings) => {
    try {
      const saved = await saveSettingsAPI(newSettings);
      setSettings(saved);
      saveSettingsToLocal(saved);

      // Trigger backend rescore of all leads against updated criteria
      await rescoreAllLeads().catch((err) => console.warn('Rescore failed:', err));

      // Reload fresh leads and today's batch from backend
      const [freshLeads, todaysBatch] = await Promise.all([
        getLeads(),
        getTodaysBatch().catch(() => null),
      ]);
      const todayLeadIds = new Set(
        (todaysBatch?.items || []).map((item) => String(item.lead_id))
      );
      setLeads(freshLeads.map((l) => ({ ...l, isDailyLead: todayLeadIds.has(l.id) })));
    } catch (error) {
      console.error('Failed to save settings to backend:', error);
    }
  };

  // Reset database back to default demo data via backend development reset endpoint
  const handleResetToDefaults = async () => {
    try {
      await resetBackendData();
      resetAllToDefault();

      const [
        freshLeads,
        freshCompanies,
        freshJobs,
        freshOutreach,
        freshSettings,
        todaysBatch,
      ] = await Promise.all([
        getLeads(),
        getCompanies(),
        getJobs(),
        getOutreachEvents(),
        getSettings(),
        getTodaysBatch().catch(() => null),
      ]);

      const todayLeadIds = new Set(
        (todaysBatch?.items || []).map((item) => String(item.lead_id))
      );
      setLeads(freshLeads.map((l) => ({ ...l, isDailyLead: todayLeadIds.has(l.id) })));
      setCompanies(freshCompanies);
      setJobs(freshJobs);
      setOutreachEvents(freshOutreach);
      setSettings(freshSettings);
      saveSettingsToLocal(freshSettings);

      setActiveLeadModal(null);
      setIsMessageModalOpen(false);
    } catch (err) {
      console.error('Failed to reset demo data on backend:', err);
    }
  };

  // Export current leads
  const handleExportCsv = () => {
    exportLeadsToCsv(
      leads,
      `connection_finder_leads_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  // Discovery completion handler
  const handleDiscoveryComplete = async () => {
    try {
      const [updatedLeads, updatedEvents, todaysBatch] = await Promise.all([
        getLeads(),
        getOutreachEvents(),
        getTodaysBatch().catch(() => null),
      ]);
      const todayLeadIds = new Set(
        (todaysBatch?.items || []).map((item) => String(item.lead_id))
      );
      const markedLeads = updatedLeads.map((lead) => ({
        ...lead,
        isDailyLead: todayLeadIds.has(lead.id),
      }));
      setLeads(markedLeads);
      setOutreachEvents(updatedEvents);
    } catch (error) {
      console.error('Failed to refresh leads after discovery:', error);
    }
  };

  // Import completion handler
  const handleImportComplete = async () => {
    try {
      const [updatedLeads, updatedEvents] = await Promise.all([
        getLeads(),
        getOutreachEvents(),
      ]);
      setLeads(updatedLeads);
      setOutreachEvents(updatedEvents);
    } catch (error) {
      console.error('Failed to refresh leads after import:', error);
    }
  };

  // Metrics for sidebar
  const todaysLeads = leads.filter((l) => l.isDailyLead);
  const contactedTodayCount = todaysLeads.filter((l) =>
    [
      'CONNECTION_SENT',
      'CONNECTED',
      'MESSAGE_SENT',
      'RESUME_SENT',
      'FOLLOW_UP',
      'REPLIED',
      'INTERVIEW',
    ].includes(l.status)
  ).length;

  if (isLoading && leads.length === 0 && companies.length === 0) {
    return (
      <div className="app-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <h2>Connecting to CRM Database...</h2>
          <p>Loading leads, target companies, jobs, and pipeline status.</p>
        </div>
      </div>
    );
  }

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

        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px 16px', margin: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

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
