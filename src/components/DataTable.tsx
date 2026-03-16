import React, { useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  Download, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileJson, 
  Image as ImageIcon,
  Table as TableIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { cn } from '../lib/utils';
import { ColumnConfig } from '../types';

interface DataTableProps {
  data: any[];
  columnConfigs: ColumnConfig[];
  onExport: () => void;
}

export function DataTable({ data, columnConfigs, onExport }: DataTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [search, setSearch] = React.useState('');
  const [exportMode, setExportMode] = React.useState(false);

  const columnDefs = useMemo(() => {
    return columnConfigs
      .filter(col => col.visible)
      .map(col => ({
        field: col.id,
        headerName: col.header,
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) return '';
          
          switch (col.type) {
            case 'currency':
              return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX' }).format(params.value);
            case 'percentage':
              return `${params.value}%`;
            case 'date':
              try {
                return new Date(params.value).toLocaleDateString();
              } catch (e) {
                return params.value;
              }
            default:
              return params.value;
          }
        },
        cellClass: cn(
          col.type === 'number' || col.type === 'currency' ? 'text-right font-mono' : '',
          col.type === 'date' ? 'text-center' : ''
        )
      }));
  }, [columnConfigs]);

  const onFilterTextBoxChanged = useCallback(() => {
    gridRef.current?.api.setGridOption('quickFilterText', search);
  }, [search]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Golden Record");
    XLSX.writeFile(wb, "Golden_Record_Leads.xlsx");
  };

  const exportToPNG = async () => {
    const element = document.querySelector('.ag-theme-quartz') as HTMLElement;
    if (!element) return;
    
    setExportMode(true);
    // Give it a moment to render without scrollbars if possible
    setTimeout(async () => {
      const canvas = await html2canvas(element);
      const link = document.createElement('a');
      link.download = 'data-snapshot.png';
      link.href = canvas.toDataURL();
      link.click();
      setExportMode(false);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search the Golden Record..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onFilterTextBoxChanged();
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button 
            onClick={exportToPNG}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            PNG Snapshot
          </button>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className={cn(
        "ag-theme-quartz flex-1 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm",
        exportMode ? "h-auto" : "h-[600px]"
      )}>
        <AgGridReact
          ref={gridRef}
          rowData={data}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[20, 50, 100]}
          animateRows={true}
          quickFilterText={search}
          defaultColDef={{
            flex: 1,
            minWidth: 100,
          }}
        />
      </div>
    </div>
  );
}
