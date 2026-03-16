import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CSVUploaderProps {
  onDataParsed: (filename: string, data: any[]) => void;
  isProcessing: boolean;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({ onDataParsed, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            onDataParsed(file.name, results.data);
          }
        });
      }
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 flex flex-col items-center justify-center gap-4",
          dragActive ? "border-emerald-500 bg-emerald-50/50" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/50",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        <div className="p-4 bg-white rounded-full shadow-sm">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-zinc-400" />
          )}
        </div>
        
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">
            {isProcessing ? "Normalizing Data..." : "Upload your CSV files"}
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Drag and drop your "Data Swamp" files here
          </p>
        </div>

        <input
          type="file"
          multiple
          accept=".csv"
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Semantic Mapping
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          E.164 Standardization
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Deduplication
        </div>
      </div>
    </div>
  );
};
