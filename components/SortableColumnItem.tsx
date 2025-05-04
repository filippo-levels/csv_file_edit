'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableColumnItemProps {
  id: string;
  label: string;
  isChecked: boolean;
  onToggle: (id: string) => void;
}

export function SortableColumnItem({ id, label, isChecked, onToggle }: SortableColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none', // Prevent scrolling on touch devices when dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between p-3 mb-2 border rounded border-gray-200 bg-white shadow-sm"
    >
      <div className="flex items-center flex-grow">
        {/* Updated Drag Handle with better icon */}
        <button
          {...listeners}
          className="cursor-grab active:cursor-grabbing mr-3 text-gray-400 hover:text-blue-500"
          aria-label={`Riordina colonna ${label}`}
        >
          {/* Improved drag handle icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
        <span className="flex-grow mr-2 break-words">{label}</span>
      </div>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={() => onToggle(id)}
        className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        aria-label={`Seleziona colonna ${label}`}
      />
    </div>
  );
} 