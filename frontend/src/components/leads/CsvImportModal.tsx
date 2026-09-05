import React, { useState } from 'react';
import {
  Upload,
  X,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import type { ImportResult } from '../../types';
import { generateSampleCsvContent, importLeadsFromCsv } from '../../services/csvService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [csvText, setCsvText] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content || '');
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (!csvText.trim()) return;
    setIsProcessing(true);

    try {
      const result = await importLeadsFromCsv(csvText);
      setImportResult(result);
      if (result.importedCount > 0) {
        onImportComplete();
      }
    } catch (err: any) {
      setImportResult({
        importedCount: 0,
        skippedCount: 0,
        duplicateCount: 0,
        errors: [err?.message || 'Failed to parse CSV file.'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSample = () => {
    const sample = generateSampleCsvContent();
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_leads_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    const sample = generateSampleCsvContent();
    navigator.clipboard.writeText(sample);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="csv-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="modal-title">Import Leads from CSV</h2>
              <p className="modal-subtitle">
                Add contacts from career fairs, spreadsheets, or legitimate external directories.
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Instructions and Sample Template bar */}
          <div className="csv-template-bar">
            <div className="template-info">
              <strong>Required format:</strong>
              <code>name, title, company, location, linkedin_url, email, source, technical_area</code>
            </div>
            <div className="template-actions">
              <button
                className="btn-secondary btn-xs"
                onClick={handleDownloadSample}
                title="Download sample CSV file"
              >
                <Download size={13} />
                <span>Sample CSV</span>
              </button>
              <button
                className="btn-secondary btn-xs"
                onClick={handleCopySample}
                title="Copy sample data to clipboard"
              >
                {copiedTemplate ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedTemplate ? 'Copied' : 'Copy Sample'}</span>
              </button>
            </div>
          </div>

          {/* File dropzone / input */}
          <div className="file-dropzone">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="file-input-hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="file-dropzone-label">
              <FileText size={28} className="dropzone-icon" />
              <div>
                <strong>Click to choose a CSV file</strong>
                <p>or paste your raw CSV data below</p>
              </div>
            </label>
          </div>

          {/* Raw CSV Text area */}
          <div className="csv-textarea-wrap">
            <label className="input-label">CSV Data Content</label>
            <textarea
              className="csv-textarea"
              rows={6}
              placeholder="name,title,company,location,linkedin_url,email,source,technical_area..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>

          {/* Import Results Box */}
          {importResult && (
            <div className="import-results-card">
              <div className="results-header">
                <CheckCircle2 size={16} className="text-emerald" />
                <strong>Import Summary</strong>
              </div>

              <div className="results-metrics">
                <div className="metric-pill imported">
                  <span>Imported:</span>
                  <strong>{importResult.importedCount}</strong>
                </div>
                <div className="metric-pill skipped">
                  <span>Skipped:</span>
                  <strong>{importResult.skippedCount}</strong>
                </div>
                <div className="metric-pill duplicates">
                  <span>Duplicates:</span>
                  <strong>{importResult.duplicateCount}</strong>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="results-errors-list">
                  <div className="errors-title">
                    <AlertCircle size={14} />
                    <span>Notes / Warnings:</span>
                  </div>
                  <ul>
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleRunImport}
            disabled={!csvText.trim() || isProcessing}
          >
            <Upload size={16} />
            <span>{isProcessing ? 'Importing...' : 'Validate & Import Leads'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
