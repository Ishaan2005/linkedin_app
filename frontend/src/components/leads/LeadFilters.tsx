import React from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { LeadFilterState } from '../../types';

interface LeadFiltersProps {
  filters: LeadFilterState;
  onFilterChange: (newFilters: LeadFilterState) => void;
  availableCompanies: string[];
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  totalCount: number;
  filteredCount: number;
}

export const initialFilterState: LeadFilterState = {
  searchQuery: '',
  role: 'all',
  technicalArea: 'all',
  location: 'all',
  company: 'all',
  status: 'all',
  minScore: 0,
  dateDiscovered: 'all',
  sortBy: 'relevance',
  sortOrder: 'desc',
};

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onFilterChange,
  availableCompanies,
  viewMode,
  setViewMode,
  totalCount,
  filteredCount,
}) => {
  const updateField = <K extends keyof LeadFilterState>(key: K, value: LeadFilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFilterChange(initialFilterState);
  };

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.role !== 'all' ||
    filters.technicalArea !== 'all' ||
    filters.location !== 'all' ||
    filters.company !== 'all' ||
    filters.status !== 'all' ||
    filters.minScore > 0 ||
    filters.dateDiscovered !== 'all';

  return (
    <div className="lead-filters-panel">
      {/* Top Search Bar & View Mode */}
      <div className="filters-top-row">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, title, company, skill (e.g. Verilog, APB, RISC-V), or city..."
            value={filters.searchQuery}
            onChange={(e) => updateField('searchQuery', e.target.value)}
          />
          {filters.searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => updateField('searchQuery', '')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="view-mode-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid card view"
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Compact table view"
            aria-label="Table view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Select Dropdown Filters Row */}
      <div className="filters-controls-grid">
        {/* Role Filter */}
        <div className="filter-item">
          <label className="filter-label">Role</label>
          <select
            className="filter-select"
            value={filters.role}
            onChange={(e) => updateField('role', e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="Hiring Manager">Hiring Manager</option>
            <option value="Engineering Manager">Engineering Manager</option>
            <option value="Technical Lead">Technical Lead</option>
            <option value="ASIC Design Manager">ASIC Design Manager</option>
            <option value="RTL Lead">RTL Lead</option>
            <option value="VLSI Manager">VLSI Manager</option>
            <option value="Verification Lead">Verification Lead</option>
            <option value="Physical Design Lead">Physical Design Lead</option>
            <option value="Recruiter">Recruiter / Talent Acquisition</option>
            <option value="HR">HR</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Technical Area Filter */}
        <div className="filter-item">
          <label className="filter-label">Technical Area</label>
          <select
            className="filter-select"
            value={filters.technicalArea}
            onChange={(e) => updateField('technicalArea', e.target.value)}
          >
            <option value="all">All Technical Areas</option>
            <option value="VLSI">VLSI</option>
            <option value="ASIC">ASIC</option>
            <option value="RTL">RTL</option>
            <option value="Verilog">Verilog</option>
            <option value="SystemVerilog">SystemVerilog</option>
            <option value="SoC">SoC</option>
            <option value="FPGA">FPGA</option>
            <option value="Physical Design">Physical Design</option>
            <option value="Design Verification">Design Verification</option>
            <option value="Computer Architecture">Computer Architecture</option>
            <option value="Semiconductor">Semiconductor</option>
            <option value="AI Hardware">AI Hardware</option>
            <option value="EDA">EDA</option>
            <option value="RISC-V">RISC-V</option>
          </select>
        </div>

        {/* Location Filter */}
        <div className="filter-item">
          <label className="filter-label">Location</label>
          <select
            className="filter-select"
            value={filters.location}
            onChange={(e) => updateField('location', e.target.value)}
          >
            <option value="all">All Locations</option>
            <option value="India">India (All)</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
            <option value="Noida">Noida / Delhi NCR</option>
            <option value="Chennai">Chennai</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        {/* Company Filter */}
        <div className="filter-item">
          <label className="filter-label">Company</label>
          <select
            className="filter-select"
            value={filters.company}
            onChange={(e) => updateField('company', e.target.value)}
          >
            <option value="all">All Companies</option>
            {availableCompanies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Score Filter */}
        <div className="filter-item">
          <label className="filter-label">Min Relevance Score</label>
          <select
            className="filter-select"
            value={filters.minScore}
            onChange={(e) => updateField('minScore', Number(e.target.value))}
          >
            <option value={0}>Any Score</option>
            <option value={90}>90+ (Top Match)</option>
            <option value={80}>80+ (High Relevance)</option>
            <option value={70}>70+ (Good Match)</option>
            <option value={60}>60+ (Moderate)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-item">
          <label className="filter-label">Outreach Status</label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => updateField('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="NEW">New</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="CONNECTION_SENT">Connection Sent</option>
            <option value="CONNECTED">Connected</option>
            <option value="MESSAGE_SENT">Message Sent</option>
            <option value="RESUME_SENT">Resume Sent</option>
            <option value="FOLLOW_UP">Follow Up Due</option>
            <option value="REPLIED">Replied</option>
            <option value="INTERVIEW">Interview</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="filter-item">
          <label className="filter-label">Sort By</label>
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={(e) =>
              updateField(
                'sortBy',
                e.target.value as LeadFilterState['sortBy']
              )
            }
          >
            <option value="relevance">Relevance Score</option>
            <option value="newest">Newest Discovered</option>
            <option value="company">Company Name</option>
            <option value="lastContacted">Last Contacted</option>
            <option value="followUpDate">Follow-up Date</option>
          </select>
        </div>
      </div>

      {/* Filter Stats & Reset Row */}
      <div className="filters-bottom-row">
        <div className="filter-results-count">
          <Filter size={14} />
          <span>
            Showing <strong>{filteredCount}</strong> of {totalCount} leads
          </span>
        </div>

        {isFiltered && (
          <button className="btn-reset-filters" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
