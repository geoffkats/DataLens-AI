import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Table as TableIcon, 
  Eye, 
  Combine, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { SheetMetadata } from './FileUpload';
import { cn } from '../lib/utils';

interface SheetSelectorProps {
  sheets: SheetMetadata[];
  onSelect: (selectedData: any[], mode: 'single' | 'merged' | 'compare' | 'join', metadata?: any) => void;
  onBack: () => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({ sheets, onSelect, onBack }) => {
  const [selectedSheetNames, setSelectedSheetNames] = useState<string[]>([]);
  const [previewSheet, setPreviewSheet] = useState<SheetMetadata | null>(null);
  const [mode, setMode] = useState<'single' | 'merged' | 'compare' | 'join'>('single');
  const [joinKey, setJoinKey] = useState<string>('');

  const isMonthlyStructure = useMemo(() => {
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const detected = sheets.filter(s => 
      monthNames.some(m => s.name.toLowerCase().includes(m))
    );
    return detected.length >= 3;
  }, [sheets]);

  const toggleSheet = (name: string) => {
    if (selectedSheetNames.includes(name)) {
      setSelectedSheetNames(selectedSheetNames.filter(n => n !== name));
    } else {
      if (mode === 'single') {
        setSelectedSheetNames([name]);
      } else {
        setSelectedSheetNames([...selectedSheetNames, name]);
      }
    }
  };

  const validateMerge = () => {
    if (selectedSheetNames.length < 2) return { valid: false, reason: 'Select at least 2 sheets' };
    
    const selectedSheets = sheets.filter(s => selectedSheetNames.includes(s.name));
    const firstSheetCols = selectedSheets[0].columns.sort().join(',');
    
    const mismatch = selectedSheets.some(s => s.columns.sort().join(',') !== firstSheetCols);
    
    if (mismatch) {
      return { valid: false, reason: 'Selected sheets have different column structures' };
    }
    
    return { valid: true };
  };

  const handleConfirm = () => {
    const selectedSheets = sheets.filter(s => selectedSheetNames.includes(s.name));
    
    if (mode === 'single') {
      onSelect(selectedSheets[0].previewData, 'single', { name: selectedSheets[0].name });
    } else if (mode === 'merged') {
      const validation = validateMerge();
      if (!validation.valid) return;
      onSelect([], 'merged', { sheetNames: selectedSheetNames });
    } else if (mode === 'compare') {
      if (selectedSheetNames.length !== 2) return;
      onSelect([], 'compare', { sheetNames: selectedSheetNames });
    } else if (mode === 'join') {
      if (selectedSheetNames.length !== 2 || !joinKey) return;
      onSelect([], 'join', { sheetNames: selectedSheetNames, joinKey });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Select Data Source</h2>
          <p className="text-zinc-500">Choose how you want to analyze your Excel sheets</p>
        </div>
        <button 
          onClick={onBack}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Back to Upload
        </button>
      </div>

      {isMonthlyStructure && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4">
          <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Detected Monthly Structure</p>
            <p className="text-xs text-emerald-700">We found multiple sheets that look like monthly reports. You can use "Financial Year Mode" to analyze trends across these months.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => { setMode('single'); setSelectedSheetNames([]); }}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            mode === 'single' ? "border-emerald-500 bg-emerald-50/30" : "border-zinc-100 bg-white hover:border-zinc-200"
          )}
        >
          <TableIcon className={cn("w-6 h-6 mb-3", mode === 'single' ? "text-emerald-600" : "text-zinc-400")} />
          <p className="font-bold text-zinc-900">Single Sheet</p>
          <p className="text-xs text-zinc-500">Analyze one specific sheet in detail</p>
        </button>

        <button 
          onClick={() => { setMode('merged'); setSelectedSheetNames([]); }}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            mode === 'merged' ? "border-emerald-500 bg-emerald-50/30" : "border-zinc-100 bg-white hover:border-zinc-200"
          )}
        >
          <Combine className={cn("w-6 h-6 mb-3", mode === 'merged' ? "text-emerald-600" : "text-zinc-400")} />
          <p className="font-bold text-zinc-900">Merge Sheets</p>
          <p className="text-xs text-zinc-500">Combine multiple sheets with same structure</p>
        </button>

        <button 
          onClick={() => { setMode('compare'); setSelectedSheetNames([]); }}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            mode === 'compare' ? "border-emerald-500 bg-emerald-50/30" : "border-zinc-100 bg-white hover:border-zinc-200"
          )}
        >
          <ArrowLeftRight className={cn("w-6 h-6 mb-3", mode === 'compare' ? "text-emerald-600" : "text-zinc-400")} />
          <p className="font-bold text-zinc-900">Compare Sheets</p>
          <p className="text-xs text-zinc-500">Side-by-side analysis of two sheets</p>
        </button>

        <button 
          onClick={() => { setMode('join'); setSelectedSheetNames([]); }}
          className={cn(
            "p-4 rounded-2xl border-2 text-left transition-all",
            mode === 'join' ? "border-emerald-500 bg-emerald-50/30" : "border-zinc-100 bg-white hover:border-zinc-200"
          )}
        >
          <Layers className={cn("w-6 h-6 mb-3", mode === 'join' ? "text-emerald-600" : "text-zinc-400")} />
          <p className="font-bold text-zinc-900">Join Sheets</p>
          <p className="text-xs text-zinc-500">Link two sheets by a common key (ID)</p>
        </button>
      </div>

      {mode === 'join' && selectedSheetNames.length === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-zinc-900 font-bold">
            <Info className="w-4 h-4 text-emerald-600" />
            Select Relationship Key
          </div>
          <p className="text-xs text-zinc-500">Choose the column that exists in both sheets to create a relationship.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              value={joinKey}
              onChange={(e) => setJoinKey(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Select Common Column...</option>
              {sheets.find(s => s.name === selectedSheetNames[0])?.columns.filter(c => 
                sheets.find(s => s.name === selectedSheetNames[1])?.columns.includes(c)
              ).map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-bottom border-zinc-100">
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider w-12">Select</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Sheet Name</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Rows</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Columns</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sheets.map((sheet) => {
              const isSelected = selectedSheetNames.includes(sheet.name);
              const isSummary = sheet.rowCount < 50 && sheet.name.toLowerCase().includes('summary');
              
              return (
                <tr 
                  key={sheet.name}
                  className={cn(
                    "group transition-colors cursor-pointer",
                    isSelected ? "bg-emerald-50/30" : "hover:bg-zinc-50/50"
                  )}
                  onClick={() => toggleSheet(sheet.name)}
                >
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                      isSelected ? "bg-emerald-600 border-emerald-600" : "border-zinc-200 bg-white"
                    )}>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">{sheet.name}</span>
                      {isSummary && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase tracking-tighter">Summary</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{sheet.rowCount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{sheet.columnCount}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewSheet(sheet);
                      }}
                      className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mode === 'merged' && selectedSheetNames.length >= 2 && (
        <div className={cn(
          "p-4 rounded-2xl flex items-start gap-4 border",
          validateMerge().valid ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
        )}>
          {validateMerge().valid ? (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold">Structure Validated</p>
                <p className="text-xs opacity-80">All selected sheets have matching columns. Ready to merge.</p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold">Validation Failed</p>
                <p className="text-xs opacity-80">{validateMerge().reason}</p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          disabled={selectedSheetNames.length === 0 || (mode === 'merged' && !validateMerge().valid) || (mode === 'compare' && selectedSheetNames.length !== 2)}
          onClick={handleConfirm}
          className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue to Analysis
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Preview Modal */}
      {previewSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Preview: {previewSheet.name}</h3>
                <p className="text-xs text-zinc-500">Showing first 5 rows</p>
              </div>
              <button 
                onClick={() => setPreviewSheet(null)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="border border-zinc-100 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      {previewSheet.columns.map(col => (
                        <th key={col} className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {previewSheet.previewData.map((row, i) => (
                      <tr key={i}>
                        {previewSheet.columns.map(col => (
                          <td key={col} className="px-4 py-3 text-sm text-zinc-600 whitespace-nowrap">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={() => setPreviewSheet(null)}
                className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
