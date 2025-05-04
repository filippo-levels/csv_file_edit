'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableColumnItem } from './SortableColumnItem';

interface ColumnFilter {
  id: string;
  name: string;
  description: string;
  filter: {
    type: 'prefix' | 'exactMatch' | 'all' | 'none';
    exclude: string[];
    include: string[];
  };
}

interface ColumnManagerProps {
  fileId: string;
  columnOrder: string[];
  selectedColumns: Record<string, boolean>;
  onColumnToggle: (columnName: string) => void;
  onColumnOrderChange: (newOrder: string[]) => void;
}

export const ColumnManager: React.FC<ColumnManagerProps> = ({
  fileId,
  columnOrder,
  selectedColumns,
  onColumnToggle,
  onColumnOrderChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ColumnFilter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('');

  // Load available filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch('/column-filters.json');
        const data = await response.json();
        setFilters(data.filters || []);
      } catch (error) {
        console.error('Error loading column filters:', error);
      }
    };

    loadFilters();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) {
        console.warn('Could not find dragged item index in original order');
        return;
      }
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      onColumnOrderChange(newOrder);
    }
  };

  // Function to apply a predefined filter
  const applyFilter = (filterId: string) => {
    if (!filterId) return;
    
    setSelectedFilter(filterId);
    const selectedFilter = filters.find(f => f.id === filterId);
    if (!selectedFilter) return;

    const newSelectedColumns = { ...selectedColumns };

    // Apply filter logic
    columnOrder.forEach(column => {
      if (selectedFilter.filter.type === 'all') {
        // Select all columns
        newSelectedColumns[column] = true;
      } 
      else if (selectedFilter.filter.type === 'none') {
        // Deselect all columns
        newSelectedColumns[column] = false;
      }
      else if (selectedFilter.filter.type === 'prefix') {
        // Check exclusions
        const shouldExclude = selectedFilter.filter.exclude.some(prefix => 
          column.startsWith(prefix)
        );
        
        // Check inclusions (overrides exclusions)
        const shouldInclude = selectedFilter.filter.include.some(prefix => 
          column.startsWith(prefix)
        );
        
        newSelectedColumns[column] = shouldInclude || (!shouldExclude);
      } 
      else if (selectedFilter.filter.type === 'exactMatch') {
        // For exact match, include only what's in the include list if it's not empty
        if (selectedFilter.filter.include.length > 0) {
          newSelectedColumns[column] = selectedFilter.filter.include.includes(column);
        }
        // If exclude list exists, remove these items
        if (selectedFilter.filter.exclude.length > 0) {
          if (selectedFilter.filter.exclude.includes(column)) {
            newSelectedColumns[column] = false;
          }
        }
      }
    });

    // Apply the new selection state by toggling only what needs to be changed
    columnOrder.forEach(col => {
      if (selectedColumns[col] !== newSelectedColumns[col]) {
        onColumnToggle(col);
      }
    });
  };

  const filteredColumns = columnOrder.filter(header => 
    header.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full lg:w-1/3 bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Gestisci Colonne (ID File: {fileId})</h2>
      
      {/* Filter selector */}
      <div className="mb-3">
        <label htmlFor="filter-select" className="block text-sm font-medium text-gray-700 mb-1">
          Filtri predefiniti:
        </label>
        <select
          id="filter-select"
          value={selectedFilter}
          onChange={(e) => applyFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleziona un filtro...</option>
          {filters.map(filter => (
            <option key={filter.id} value={filter.id}>
              {filter.name}
            </option>
          ))}
        </select>
        {selectedFilter && (
          <p className="text-xs text-gray-500 mt-1">
            {filters.find(f => f.id === selectedFilter)?.description}
          </p>
        )}
      </div>

      {/* Search Input */}
      <input 
        type="text" 
        placeholder="Cerca colonna..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        className="mb-3 px-3 py-2 border border-gray-300 rounded w-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
      />

      <h3 className="text-lg mb-2">Seleziona e Riordina:</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columnOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1 mt-4 max-h-[55vh] overflow-y-auto pr-2">
            {filteredColumns.map(header => (
              <SortableColumnItem
                key={header}
                id={header}
                label={header}
                isChecked={selectedColumns[header] ?? false}
                onToggle={onColumnToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}; 