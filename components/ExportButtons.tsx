'use client';

import React from 'react';
import * as XLSX from 'xlsx';

// Define type for Excel column width configuration
interface ColumnWidth {
  wch: number;
}

interface ProcessedData {
    headers: string[];
    rows: Record<string, string>[];
}

interface ExportButtonsProps {
  processedData: ProcessedData;
  fileId: string | null;
  disabled: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ processedData, fileId, disabled }) => {

  const exportToExcel = () => {
    if (!processedData || processedData.rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(processedData.rows, { header: processedData.headers });
    
    // Auto-size columns based on content
    const columnWidths: ColumnWidth[] = [];
    processedData.headers.forEach((header, index) => {
      // Start with header width (characters * approx. width)
      let maxWidth = header.length;
      
      // Check width of each cell in this column
      processedData.rows.forEach(row => {
        const cellValue = row[header] || '';
        if (cellValue.length > maxWidth) {
          maxWidth = cellValue.length;
        }
      });
      
      // Set column width with some padding
      columnWidths[index] = { wch: maxWidth + 2 };
    });
    
    worksheet['!cols'] = columnWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dati");

    const fileName = `dati_processati_${fileId || 'export'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex gap-4 mt-4">
      <button
        onClick={exportToExcel}
        disabled={disabled}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition duration-150 ease-in-out"
      >
        Esporta in Excel (.xlsx)
      </button>
    </div>
  );
}; 