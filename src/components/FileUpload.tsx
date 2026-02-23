import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onDataLoaded: (data: any[], fileName: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      onDataLoaded(json, file.name);
    };
    reader.readAsBinaryString(file);
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-all duration-300 ease-in-out",
          isDragActive 
            ? "border-emerald-500 bg-emerald-50/50" 
            : "border-zinc-200 hover:border-zinc-400 bg-white shadow-sm hover:shadow-md",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className={cn(
            "p-4 rounded-full transition-colors",
            isDragActive ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
          )}>
            {isDragActive ? <Upload className="w-8 h-8 animate-bounce" /> : <FileSpreadsheet className="w-8 h-8" />}
          </div>
          <div>
            <p className="text-lg font-medium text-zinc-900">
              {isDragActive ? "Drop your file here" : "Upload your Excel or CSV file"}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Drag and drop or click to browse
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="px-2 py-1 bg-zinc-100 rounded">.xlsx</span>
            <span className="px-2 py-1 bg-zinc-100 rounded">.xls</span>
            <span className="px-2 py-1 bg-zinc-100 rounded">.csv</span>
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Unsupported file format</p>
            <p className="text-xs opacity-80">Please upload an Excel (.xlsx, .xls) or CSV file.</p>
          </div>
        </div>
      )}
    </div>
  );
};
