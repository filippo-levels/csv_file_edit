'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { FileUpload } from '../components/FileUpload';
import { ColumnManager } from '../components/ColumnManager';
import { DataPreview } from '../components/DataPreview';
import { ExportButtons } from '../components/ExportButtons';

// Define the structure for parsed data
interface ParsedData {
  id: string;
  headers: string[];
  rows: Record<string, string>[];
}

const standardFilterColumns = [
  'Date', 'Time', 'BATCH_NAME', 'H_DRY_1', 'M_DRY_1', 'H_DRY_2', 'M_DRY_2',
  'H_DRY_3', 'M_DRY_3', 'H_COOLING_4', 'M_COOLING_4', 'T_CLEAN_ON_1',
  'T_PAUSE_CLEAN_1', 'T_CLEAN_ON_2', 'T_PAUSE_CLEAN_2', 'T_CLEAN_ON_3',
  'T_PAUSE_CLEAN_3', 'T_CLEAN_ON_4', 'T_PAUSE_CLEAN_4', 'TEMP_AIR_IN',
  'TEMP_PRODUCT_1', 'TEMP_PRODUCT_2', 'TEMP_PRODUCT_3'
];

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeFilterName, setActiveFilterName] = useState<string | null>(null);

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setParsedData(null);
    setSelectedColumns({});
    setColumnOrder([]);
    setIsLoading(true);
    setFileName(null);
    setActiveFilterName(null);

    const file = acceptedFiles[0];
    if (!file) {
      setIsLoading(false);
      return;
    }

    // Store the file name for display
    setFileName(file.name);

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Formato file non supportato. Si prega di caricare un file CSV o TXT.');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const lines = fileContent.split(/\r?\n/);

        if (lines.length < 5) {
          setError("Il file deve contenere almeno 5 righe (ID, 2 righe da scartare, header, dati).");
          setIsLoading(false);
          return;
        }

        // 1. Get ID from the first cell
        const firstLineCells = Papa.parse(lines[0], { delimiter: ',', preview: 1 }).data[0] as string[] || [];
        const fileId = firstLineCells[0]?.trim() || 'N/A';

        // 2. Lines 2 and 3 are ignored
        // 3. Line 4 contains headers
        const headerLine = lines[3];
        // 4. Line 5 onwards contains data
        const dataLines = lines.slice(4).filter(line => line.trim() !== '').join('\n');

        // Combine headers and data for PapaParse
        const csvDataForParsing = `${headerLine}\n${dataLines}`;

        Papa.parse<Record<string, string>>(csvDataForParsing, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              const filteredErrors = results.errors.filter(e => e.code !== 'TooFewFields' && e.code !== 'TooManyFields');
              if (filteredErrors.length > 0) {
                 setError(`Errore durante il parsing: ${filteredErrors[0].message} (riga ${filteredErrors[0].row})`);
                 console.error("Parsing errors:", results.errors);
                 setIsLoading(false);
                 return;
              }
            }
            if (!results.data || results.data.length === 0 || !results.meta.fields || results.meta.fields.length === 0) {
               setError("Errore: Nessun dato valido trovato o header mancanti/vuoti nella riga 4.");
               setIsLoading(false);
               return;
            }

            const headers = results.meta.fields.filter(h => h);
            const initialSelection: Record<string, boolean> = {};
            headers.forEach(header => {
                initialSelection[header] = true;
            });

             if (headers.length === 0) {
               setError("Errore: Nessun nome di colonna valido trovato nella riga 4.");
               setIsLoading(false);
               return;
            }

            // Filter rows to only include keys that are in the valid headers
            const filteredRows = results.data.map(row => {
                const newRow: Record<string, string> = {};
                headers.forEach(header => {
                    newRow[header] = row[header] ?? '';
                });
                return newRow;
            });

            setParsedData({ id: fileId, headers: headers, rows: filteredRows });
            setSelectedColumns(initialSelection);
            setColumnOrder(headers);
            setIsLoading(false);
          },
          error: (err: Error) => {
            setError(`Errore durante il parsing del file: ${err.message}`);
            console.error("Parsing error:", err);
            setIsLoading(false);
          }
        });
      } catch (e) {
        setError(`Errore durante la lettura del file: ${e instanceof Error ? e.message : String(e)}`);
        console.error("File reading error:", e);
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Errore durante la lettura del file.');
      console.error("File reading failed");
      setIsLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const applyFilter = useCallback((filterName: string | null) => {
    if (!parsedData) return;

    setActiveFilterName(filterName);

    if (filterName === 'standard') {
        const availablePresetColumns = standardFilterColumns.filter(col => parsedData.headers.includes(col));
        const newSelectedColumns: Record<string, boolean> = {};
        parsedData.headers.forEach(header => {
            newSelectedColumns[header] = availablePresetColumns.includes(header);
        });
        setSelectedColumns(newSelectedColumns);
        setColumnOrder(availablePresetColumns);
    } else { // 'all' or null
        const allSelected: Record<string, boolean> = {};
        parsedData.headers.forEach(header => {
            allSelected[header] = true;
        });
        setSelectedColumns(allSelected);
        setColumnOrder(parsedData.headers);
    }
  }, [parsedData]);

  const handleColumnToggle = useCallback((columnName: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }));
    setActiveFilterName(null);
  }, []);

  const handleColumnOrderChange = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    setActiveFilterName(null);
  }, []);

  // Memoize processed data to avoid recalculating on every render
  const processedData = useMemo(() => {
    if (!parsedData) return { headers: [], rows: [] };

    const visibleColumns = columnOrder.filter(col => selectedColumns[col]);

    const processedRows = parsedData.rows.map(row => {
      const newRow: Record<string, string> = {};
      visibleColumns.forEach(col => {
        // Check if this is a DATE column and format from MM/DD/YY to DD/MM/YY
        if (col === 'Date' && row[col]) {
          const dateValue = row[col];
          // Check if the date is in MM/DD/YY format
          const dateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(dateValue);
          if (dateMatch) {
            const [_, month, day, year] = dateMatch;
            // Format as DD/MM/YY
            newRow[col] = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
          } else {
            // If not in expected format, keep original value
            newRow[col] = dateValue;
          }
        } else {
          // For non-DATE columns, keep the original value
          newRow[col] = row[col] ?? '';
        }
      });
      return newRow;
    });

    return { headers: visibleColumns, rows: processedRows };
  }, [parsedData, columnOrder, selectedColumns]);

  const isExportDisabled = !processedData || processedData.rows.length === 0 || processedData.headers.length === 0 || isLoading;

  return (
    <div className="container mx-auto p-4 flex flex-col items-center min-h-screen bg-white text-gray-900">
      <header className="w-full max-w-6xl mb-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-2">Editor CSV/TXT</h1>
        <p className="text-gray-600 mb-4">Carica, modifica e esporta facilmente file CSV o TXT strutturati</p>
      </header>

      {!parsedData && !isLoading && (
        <div className="w-full max-w-xl p-6 bg-blue-50 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">Inizia caricando un file</h2>
          <p className="text-gray-600 mb-4">
            Carica un file CSV o TXT nel formato richiesto. Il file deve contenere:
          </p>
          <ul className="list-disc pl-5 mb-4 text-gray-600 space-y-1">
            <li>ID nella prima riga (prima cella)</li>
            <li>Due righe intermedie (ignorate)</li>
            <li>Intestazioni delle colonne nella quarta riga</li>
            <li>Dati effettivi dalla quinta riga in poi</li>
          </ul>
        </div>
      )}

      {/* File Upload Component */}
      <div className="w-full max-w-2xl mb-8">
        <FileUpload
          onDrop={handleFileDrop}
          accept={{ 'text/csv': ['.csv'], 'text/plain': ['.txt'] }}
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="w-full max-w-2xl text-center mb-6 p-4 bg-blue-50 rounded-lg">
           <p className="text-lg text-gray-600 animate-pulse flex items-center justify-center">
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             Caricamento e parsing del file...
           </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-2xl mb-6" role="alert">
          <div className="flex">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold">Errore!</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}

      {parsedData && !isLoading && (
        <>
          <div className="w-full max-w-6xl mb-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <div className="flex flex-wrap items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">File caricato: <span className="font-semibold text-gray-700">{fileName}</span></p>
                  <p className="text-sm text-gray-500">ID: <span className="font-semibold text-gray-700">{parsedData.id}</span></p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Colonne: <span className="font-semibold text-gray-700">{parsedData.headers.length}</span></p>
                  <p>Righe: <span className="font-semibold text-gray-700">{parsedData.rows.length}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Selection Dropdown */}
          <div className="w-full max-w-6xl mb-4">
            <label htmlFor="filter-select" className="block text-sm font-medium text-gray-700 mb-1">
              Applica Filtro Colonne:
            </label>
            <select
              id="filter-select"
              value={activeFilterName ?? 'all'}
              onChange={(e) => applyFilter(e.target.value === 'all' ? null : e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="all">Mostra Tutte le Colonne</option>
              {/* Check if standard filter is applicable */}
              {standardFilterColumns.some(col => parsedData.headers.includes(col)) && (
                  <option value="standard">Filtro Standard</option>
              )}
            </select>
          </div>

          <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
            <ColumnManager
              fileId={parsedData.id}
              columnOrder={columnOrder}
              selectedColumns={selectedColumns}
              onColumnToggle={handleColumnToggle}
              onColumnOrderChange={handleColumnOrderChange}
            />

            <div className="w-full lg:w-2/3 bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Anteprima Dati</h2>
                <div className="text-sm text-gray-500">
                  <span>Colonne selezionate: {processedData.headers.length} / {parsedData.headers.length}</span>
                </div>
              </div>
              <DataPreview
                headers={processedData.headers}
                rows={processedData.rows}
              />
              <ExportButtons
                processedData={processedData}
                fileId={parsedData.id}
                disabled={isExportDisabled}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

