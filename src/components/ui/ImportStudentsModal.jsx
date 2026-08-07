import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

const GRADE_OPTIONS = [
  'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];
const SECTION_OPTIONS = ['Section A', 'Section B', 'Section C', 'Section D'];
const FEE_STATUS_OPTIONS = ['Paid', 'Pending', 'Overdue'];

// Accepts loose header variants from real-world spreadsheets (extra spaces,
// different capitalization, common synonyms) and maps them to our fields.
const HEADER_ALIASES = {
  name: ['name', 'studentname', 'fullname', 'student'],
  grade: ['grade', 'class', 'classgrade'],
  section: ['section', 'classsection', 'sec'],
  guardian: ['guardian', 'guardianname', 'parent', 'parentname'],
  guardianContact: ['guardiancontact', 'guardianphone', 'phone', 'contact', 'phonenumber', 'guardiannumber'],
  guardianEmail: ['guardianemail', 'email', 'parentemail'],
  feeStatus: ['feestatus', 'status', 'fee']
};

function normalizeHeader(h) {
  return String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildFieldMap(headers) {
  const map = {};
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const match = normalizedHeaders.find((h) => aliases.includes(h.norm));
    if (match) map[field] = match.raw;
  }
  return map;
}

function closestOption(value, options) {
  if (!value) return null;
  const norm = String(value).trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === norm) || null;
}

function parseRows(rawRows, fieldMap) {
  return rawRows.map((row, idx) => {
    const name = fieldMap.name ? String(row[fieldMap.name] || '').trim() : '';
    const gradeRaw = fieldMap.grade ? String(row[fieldMap.grade] || '').trim() : '';
    const sectionRaw = fieldMap.section ? String(row[fieldMap.section] || '').trim() : '';
    const feeStatusRaw = fieldMap.feeStatus ? String(row[fieldMap.feeStatus] || '').trim() : '';

    const grade = closestOption(gradeRaw, GRADE_OPTIONS);
    const section = closestOption(sectionRaw, SECTION_OPTIONS);
    const feeStatus = closestOption(feeStatusRaw, FEE_STATUS_OPTIONS);

    const warnings = [];
    if (gradeRaw && !grade) warnings.push(`Grade "${gradeRaw}" not recognized — defaulted to ${GRADE_OPTIONS[4]}`);
    if (sectionRaw && !section) warnings.push(`Section "${sectionRaw}" not recognized — defaulted to ${SECTION_OPTIONS[0]}`);
    if (feeStatusRaw && !feeStatus) warnings.push(`Fee status "${feeStatusRaw}" not recognized — defaulted to Pending`);

    const guardianContact = fieldMap.guardianContact ? String(row[fieldMap.guardianContact] || '').trim() : '';
    const guardianEmail = fieldMap.guardianEmail ? String(row[fieldMap.guardianEmail] || '').trim() : '';
    if (!guardianContact && !guardianEmail) warnings.push('No guardian phone or email — reminders will not reach this student\'s guardian');

    return {
      rowNumber: idx + 2, // +2 accounts for 1-indexing and the header row
      error: name ? null : 'Missing student name — this row will be skipped',
      warnings,
      data: {
        name,
        grade: grade || GRADE_OPTIONS[4],
        section: section || SECTION_OPTIONS[0],
        guardian: fieldMap.guardian ? String(row[fieldMap.guardian] || '').trim() : '',
        guardianContact,
        guardianEmail,
        feeStatus: feeStatus || 'Pending',
        avatar: ''
      }
    };
  });
}

const TEMPLATE_CSV = `Name,Grade,Section,Guardian Name,Guardian Contact,Guardian Email,Fee Status
Tosin Adeyemi,Grade 10,Section A,Tunde Adeyemi,+234 801 234 5678,tunde@example.com,Pending
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scholarq-student-import-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ImportStudentsModal({ onClose, onImported }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [unmappedRequired, setUnmappedRequired] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setImportError('');
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (rawRows.length === 0) {
        setImportError('This file has no data rows. Please check the file and try again.');
        return;
      }

      const headers = Object.keys(rawRows[0]);
      const fieldMap = buildFieldMap(headers);

      if (!fieldMap.name) {
        setUnmappedRequired(true);
        setImportError('Could not find a "Name" column in this file. Rename your name column to "Name" and re-upload, or use the template below.');
        return;
      }

      setUnmappedRequired(false);
      setParsedRows(parseRows(rawRows, fieldMap));
      setStep('preview');
    } catch (err) {
      console.error('Failed to parse import file:', err);
      setImportError('Could not read this file. Make sure it is a valid .csv or .xlsx file.');
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const validRows = parsedRows.filter((r) => !r.error);
  const errorRows = parsedRows.filter((r) => r.error);

  const handleConfirmImport = async () => {
    setStep('importing');
    setImportError('');

    // Firestore batches cap at 500 writes; chunk generously below that.
    const CHUNK_SIZE = 400;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((row) => {
        const ref = doc(collection(db, 'students'));
        batch.set(ref, row.data);
      });
      try {
        await batch.commit();
        successCount += chunk.length;
      } catch (err) {
        console.error('Import batch failed:', err);
        failCount += chunk.length;
      }
    }

    setImportResult({ successCount, failCount, skippedCount: errorRows.length });
    setStep('done');
    if (successCount > 0 && onImported) onImported();
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-md" onClick={onClose}>
      <div
        class="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <h3 class="font-headline-sm text-on-surface font-bold">Import Students</h3>
          <button onClick={onClose} class="text-on-surface-variant hover:text-on-surface text-xl leading-none">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto px-lg py-md">
          {step === 'upload' && (
            <div>
              <p class="text-body-md text-on-surface-variant mb-md">
                Upload a CSV or Excel file to add multiple students at once. Columns are matched automatically —
                include at least a <strong>Name</strong> column; Grade, Section, Guardian, Guardian Contact,
                Guardian Email, and Fee Status are optional.
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                class="border-2 border-dashed border-outline-variant rounded-lg py-xl px-md text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <p class="font-label-lg text-on-surface mb-xs">Click to choose a file, or drag one here</p>
                <p class="text-xs text-on-surface-variant">.csv, .xlsx, or .xls</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  class="hidden"
                  onChange={handleFileInputChange}
                />
              </div>

              {importError && (
                <div class="mt-md p-md bg-error/10 border border-error/30 rounded-lg text-error font-body-sm">
                  {importError}
                </div>
              )}

              <button
                onClick={downloadTemplate}
                class="mt-md text-primary font-label-md hover:underline"
              >
                Download a blank template (.csv)
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div class="flex items-center justify-between mb-md">
                <p class="text-body-md text-on-surface">
                  <strong>{fileName}</strong> — {validRows.length} student{validRows.length === 1 ? '' : 's'} ready to import
                  {errorRows.length > 0 && `, ${errorRows.length} row${errorRows.length === 1 ? '' : 's'} will be skipped`}
                </p>
              </div>

              <div class="border border-outline-variant rounded-lg overflow-hidden">
                <div class="max-h-80 overflow-y-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-surface-container-low sticky top-0">
                      <tr>
                        <th class="text-left px-sm py-xs font-label-sm text-on-surface-variant">Row</th>
                        <th class="text-left px-sm py-xs font-label-sm text-on-surface-variant">Name</th>
                        <th class="text-left px-sm py-xs font-label-sm text-on-surface-variant">Grade / Section</th>
                        <th class="text-left px-sm py-xs font-label-sm text-on-surface-variant">Guardian</th>
                        <th class="text-left px-sm py-xs font-label-sm text-on-surface-variant">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row) => (
                        <tr key={row.rowNumber} class={`border-t border-outline-variant/40 ${row.error ? 'bg-error/5' : ''}`}>
                          <td class="px-sm py-xs text-on-surface-variant">{row.rowNumber}</td>
                          <td class="px-sm py-xs text-on-surface">{row.data.name || <span class="italic text-on-surface-variant">missing</span>}</td>
                          <td class="px-sm py-xs text-on-surface-variant">{row.data.grade} / {row.data.section}</td>
                          <td class="px-sm py-xs text-on-surface-variant">
                            {row.data.guardian || '—'}
                            {row.data.guardianContact && <div class="text-xs">{row.data.guardianContact}</div>}
                          </td>
                          <td class="px-sm py-xs">
                            {row.error ? (
                              <span class="text-error text-xs font-label-sm">Skip — {row.error}</span>
                            ) : row.warnings.length > 0 ? (
                              <span class="text-amber-600 text-xs font-label-sm" title={row.warnings.join('; ')}>
                                ⚠ {row.warnings.length} warning{row.warnings.length === 1 ? '' : 's'}
                              </span>
                            ) : (
                              <span class="text-secondary text-xs font-label-sm">✓ Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {validRows.length === 0 && (
                <p class="mt-md text-error font-body-sm">No valid rows to import — every row is missing a name.</p>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div class="flex flex-col items-center justify-center py-xl">
              <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-md"></div>
              <p class="text-body-md text-on-surface-variant">Importing {validRows.length} students…</p>
            </div>
          )}

          {step === 'done' && importResult && (
            <div class="flex flex-col items-center justify-center py-xl text-center">
              <span class="text-4xl mb-md">{importResult.failCount === 0 ? '✅' : '⚠️'}</span>
              <p class="font-label-lg text-on-surface mb-xs">
                {importResult.successCount} student{importResult.successCount === 1 ? '' : 's'} imported successfully
              </p>
              {importResult.skippedCount > 0 && (
                <p class="text-body-sm text-on-surface-variant">{importResult.skippedCount} row{importResult.skippedCount === 1 ? '' : 's'} skipped (missing name)</p>
              )}
              {importResult.failCount > 0 && (
                <p class="text-body-sm text-error">{importResult.failCount} failed to save — check your connection and try again for those students</p>
              )}
            </div>
          )}
        </div>

        <div class="flex items-center justify-end gap-sm px-lg py-md border-t border-outline-variant">
          {step === 'preview' && (
            <>
              <button
                onClick={() => { setStep('upload'); setParsedRows([]); }}
                class="px-md py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Choose a different file
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={validRows.length === 0}
                class="px-lg py-2 rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {validRows.length} Student{validRows.length === 1 ? '' : 's'}
              </button>
            </>
          )}
          {(step === 'upload' || step === 'done') && (
            <button
              onClick={onClose}
              class="px-lg py-2 rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-opacity"
            >
              {step === 'done' ? 'Done' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
