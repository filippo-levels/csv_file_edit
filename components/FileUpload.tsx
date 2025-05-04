'use client';

import React from 'react';
import { useDropzone, Accept } from 'react-dropzone';

interface FileUploadProps {
  onDrop: (acceptedFiles: File[]) => void;
  accept: Accept;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDrop, accept, disabled = false }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-10 text-center w-full max-w-2xl cursor-pointer mb-6 transition-all duration-200 ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center">
        <svg 
          className={`h-12 w-12 mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        
        {isDragActive ? (
          <p className="text-blue-500 font-medium">Rilascia il file qui...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">Trascina qui un file o clicca per selezionarlo</p>
            <p className="text-gray-500 text-sm">Supporta file CSV o TXT</p>
          </>
        )}
      </div>
    </div>
  );
}; 