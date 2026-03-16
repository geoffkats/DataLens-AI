import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';

export interface SheetMetadata {
  name: string;
  sheetNames: string[];
  workbook: XLSX.WorkBook;
  columns: string[];
  rowCount: number;
  columnCount: number;
  previewData: any[];
}

interface FileUploadProps {
  onFilesProcessed: (data: any[], fileName: string) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFilesProcessed, isProcessing }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        
        // If we need to pass metadata to SheetSelector (if it's used)
        // But App.tsx currently calls onFilesProcessed directly with json
        onFilesProcessed(json, file.name);
      };
      reader.readAsBinaryString(file);
    });
  }, [onFilesProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center",
        isDragActive ? "border-emerald-500 bg-emerald-50/50" : "border-zinc-200 hover:border-zinc-400 bg-white",
        isProcessing && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className={cn(
          "mb-4 rounded-full p-4 transition-transform duration-300 group-hover:scale-110",
          isDragActive ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-600"
        )}>
          <Upload className="h-8 w-8" />
        </div>
        
        <h3 className="mb-2 text-xl font-bold text-zinc-900">
          {isDragActive ? "Drop the files here" : "Upload your Data Swamp"}
        </h3>
        <p className="max-w-xs text-sm text-zinc-500">
          Drag and drop your 16+ CSV/Excel files here. We'll semantically merge them into a Golden Record.
        </p>
        
        <div className="mt-6 flex items-center gap-2 text-xs font-medium text-zinc-400">
          <FileText className="h-4 w-4" />
          <span>Supports CSV, XLSX, XLS</span>
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-sm font-bold text-emerald-600">AI is scrubbing your data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
