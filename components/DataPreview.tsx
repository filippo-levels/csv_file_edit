'use client';

import React from 'react';

interface DataPreviewProps {
  headers: string[];
  rows: Record<string, string>[];
  maxRows?: number;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ headers, rows, maxRows = 50 }) => {
  const displayedRows = rows.slice(0, maxRows);

  return (
    <div className="overflow-x-auto mb-4 max-h-[60vh] overflow-y-auto pr-2">
      {headers.length > 0 && rows.length > 0 ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {headers.map(header => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-white hover:bg-gray-50">
                {headers.map(header => (
                  <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Nessun dato da visualizzare. Seleziona le colonne desiderate.</p>
      )}
      {rows.length > maxRows && (
        <p className="text-sm text-gray-500 mt-2">Visualizzate le prime {maxRows} righe...</p>
      )}
    </div>
  );
}; 