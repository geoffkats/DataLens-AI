import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Database, 
  RefreshCw, 
  Trash2, 
  Wand2, 
  LayoutDashboard, 
  Table as TableIcon, 
  BarChart3, 
  Brain,
  CheckCircle2,
  XCircle,
  UserCircle,
  Calendar,
  FileText,
  Settings,
  Flag,
  Calculator,
  Plus,
  History,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  PanelLeft,
  Sparkles,
  PieChart as PieChartIcon,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { FileUpload } from './components/FileUpload';
import { DataHealth } from './components/DataHealth';
import { DataTable } from './components/DataTable';
import { ColumnSelector } from './components/ColumnSelector';
import { TemplateManager } from './components/TemplateManager';
import { Visualizations } from './components/Visualizations';
import { ReportGenerator } from './components/ReportGenerator';
import { AIAssistant } from './components/AIAssistant';
import { AIChat } from './components/AIChat';
import { 
  getSemanticSchemaMapping, 
  analyzeDataSwamp, 
  normalizeData, 
  applyCleaningStep,
  suggestCleaning,
  runOrchestrationPipeline,
  processChatCommand
} from './services/geminiService';
import { formatPhoneNumber, standardizeGrade, cn } from './lib/utils';
import { ColumnConfig, AuditLog, ChatAction, Tab, Role } from './types';

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [role, setRole] = useState<Role>('General');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [schemaInsights, setSchemaInsights] = useState<string | null>(null);
  const [recoveryMetrics, setRecoveryMetrics] = useState<any[]>([]);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    duplicatesRemoved: 0,
    formattingFixed: 0,
    schemaMapped: 0
  });

  const logAction = (action: string, details: string) => {
    setAuditLogs(prev => [{
      timestamp: new Date(),
      action,
      details,
      user: role
    }, ...prev]);
  };

  const processFiles = async (newJson: any[], fileName: string) => {
    setIsProcessing(true);
    logAction('File Uploaded', `Started processing ${fileName}`);
    
    try {
      const headers = Object.keys(newJson[0] || {});
      const mappings = await getSemanticSchemaMapping(headers);
      
      const mappedData = newJson.map(row => {
        const newRow: any = { ...row, _source: fileName }; // Preserve original fields
        mappings.forEach(m => {
          if (row[m.originalHeader] !== undefined) {
            newRow[m.mappedHeader] = row[m.originalHeader];
          }
        });
        
        // Fallback logic for common fields if mapping missed them
        if (!newRow.lead_name) newRow.lead_name = row['Name'] || row['Full Name'] || row['lead_name'] || 'Unknown';
        if (!newRow.phone_number) newRow.phone_number = row['Phone'] || row['Contact'] || row['phone_number'] || '';
        if (!newRow.email) newRow.email = row['Email'] || row['email'] || '';
        
        newRow.phone_number = formatPhoneNumber(String(newRow.phone_number));
        newRow.grade = standardizeGrade(String(newRow.grade || row['Grade'] || row['Class'] || ''));
        newRow.status = fileName.toLowerCase().includes('old') ? 'Inactive' : 'Active';
        
        return newRow;
      });

      setData(prev => {
        const combined = [...prev, ...mappedData];
        const unique = new Map();
        let duplicates = 0;
        
        combined.forEach(row => {
          const key = (row.email || row.phone_number || row.lead_name).toLowerCase();
          if (unique.has(key)) {
            duplicates++;
            const existing = unique.get(key);
            unique.set(key, { ...existing, ...row });
          } else {
            unique.set(key, row);
          }
        });

        const finalData = Array.from(unique.values());
        
        // Dynamically update column configs to include any new keys found
        setColumnConfigs(prevCols => {
          const existingIds = new Set(prevCols.map(c => c.id));
          const allKeys = new Set<string>();
          finalData.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
          
          const newCols = Array.from(allKeys)
            .filter(key => !existingIds.has(key))
            .map(key => ({
              id: key,
              header: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              visible: true,
              type: (key.toLowerCase().includes('phone') ? 'text' : 
                    key.toLowerCase().includes('date') ? 'date' : 
                    key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') ? 'number' : 'text') as ColumnConfig['type']
            }));
            
          return [...prevCols, ...newCols];
        });

        setStats(s => ({
          totalRecords: finalData.length,
          duplicatesRemoved: s.duplicatesRemoved + duplicates,
          formattingFixed: s.formattingFixed + mappedData.length,
          schemaMapped: s.schemaMapped + mappings.length
        }));

        return finalData;
      });

      logAction('Data Merged', `Successfully merged ${fileName} into Golden Record`);

    } catch (error) {
      console.error("Processing error:", error);
      logAction('Error', `Failed to process ${fileName}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNormalize = async () => {
    if (data.length === 0) return;
    setIsNormalizing(true);
    logAction('AI Orchestration', 'Started Multi-Pass Inference Pipeline (Fixer, Linker, Doctor, Survivor)');
    try {
      const result = await runOrchestrationPipeline(data);
      if (result.data && result.data.length > 0) {
        setData(result.data);
        setRecoveryMetrics(result.metadataMap);
        setSchemaInsights(result.schemaInsights);
        
        result.cleaningSteps.forEach(step => {
          logAction(`Gate: ${step.gate}`, `${step.description} (${step.count} records)`);
        });
        
        // Re-initialize column configs to reflect the new Golden Record schema + AI fields
        const schemaCols: ColumnConfig[] = [
          { id: 'family_id', header: 'Family ID', visible: true, type: 'text' },
          { id: 'student_id', header: 'Student ID', visible: true, type: 'text' },
          { id: 'lead_name', header: 'Lead Name', visible: true, type: 'text' },
          { id: 'phone_number', header: 'Phone', visible: true, type: 'text' },
          { id: 'email', header: 'Email', visible: true, type: 'text' },
          { id: 'normalized_grade', header: 'Current Grade', visible: true, type: 'text' },
          { id: 'predicted_grade', header: '2026 Prediction', visible: true, type: 'text' },
          { id: 'grade_source', header: 'Grade Source', visible: true, type: 'text' },
          { id: 'school_name', header: 'School', visible: true, type: 'text' },
          { id: 'dob', header: 'DOB', visible: true, type: 'text' },
          { id: 'status', header: 'Status', visible: true, type: 'text' },
          { id: 'validation_flag', header: 'Flags', visible: true, type: 'text' }
        ];
        setColumnConfigs(schemaCols);
        
        logAction('AI Orchestration Complete', `Unified ${result.data.length} records into the Golden Record schema.`);
      }
    } catch (error) {
      console.error("Orchestration failed:", error);
      logAction('Error', 'AI Orchestration pipeline failed');
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Golden Record");
    XLSX.writeFile(wb, "Golden_Record_Leads.xlsx");
    logAction('Export', 'Exported data to CSV');
  };

  const runAiAnalysis = async () => {
    if (data.length === 0) return;
    setIsProcessing(true);
    const analysis = await analyzeDataSwamp(data);
    setAiAnalysis(analysis);
    setIsProcessing(false);
    setActiveTab('ai');
    logAction('AI Audit', 'Generated forensic audit report');
  };

  const currentConfig = useMemo(() => ({
    role,
    activeTab,
    columnConfigs
  }), [role, activeTab, columnConfigs]);

  const loadConfig = (config: any) => {
    if (config.role) setRole(config.role);
    if (config.activeTab) setActiveTab(config.activeTab);
    if (config.columnConfigs) setColumnConfigs(config.columnConfigs);
    logAction('Template Loaded', 'Applied saved configuration template');
  };

  const applyChatActions = useCallback((actions: ChatAction[]) => {
    setData(prevData => {
      let newData = [...prevData];
      let newCols = [...columnConfigs];

      actions.forEach(action => {
        switch (action.type) {
          case 'update_cell':
            const { rowId, columnId, value } = action.payload;
            if (newData[rowId]) {
              newData[rowId] = { ...newData[rowId], [columnId]: value };
            }
            break;
          case 'rename_column':
            const { oldId, newHeader } = action.payload;
            newCols = newCols.map(c => c.id === oldId ? { ...c, header: newHeader } : c);
            break;
          case 'delete_column':
            newCols = newCols.filter(c => c.id !== action.payload.columnId);
            break;
          case 'add_column':
            const { header, logic } = action.payload;
            const newId = header.toLowerCase().replace(/\s+/g, '_');
            newCols.push({ id: newId, header, visible: true, type: 'text' });
            // Logic would ideally be applied here, but for now we just add the column
            break;
          case 'transform_data':
            // Simple transformation logic could be implemented here
            break;
        }
      });

      setColumnConfigs(newCols);
      return newData;
    });
    logAction('AI Chat Action', `Applied ${actions.length} automated data modifications`);
  }, [columnConfigs]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex">
      <AIChat data={data} columns={columnConfigs} onApplyActions={applyChatActions} />
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-100 p-6 z-50 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Database className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tight">DataLens AI</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem 
            icon={<LayoutDashboard className="h-4 w-4" />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem 
            icon={<TableIcon className="h-4 w-4" />} 
            label="Golden Record" 
            active={activeTab === 'table'} 
            onClick={() => setActiveTab('table')}
          />
          <NavItem 
            icon={<PieChartIcon className="h-4 w-4" />} 
            label="Visualizations" 
            active={activeTab === 'charts'} 
            onClick={() => setActiveTab('charts')}
          />
          <NavItem 
            icon={<Brain className="h-4 w-4" />} 
            label="AI Intelligence" 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')}
          />
          <NavItem 
            icon={<FileDown className="h-4 w-4" />} 
            label="Report Generator" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')}
          />
          <NavItem 
            icon={<History className="h-4 w-4" />} 
            label="Audit Trail" 
            active={activeTab === 'audit'} 
            onClick={() => setActiveTab('audit')}
          />
          <NavItem 
            icon={<FileText className="h-4 w-4" />} 
            label="Templates" 
            active={activeTab === 'templates'} 
            onClick={() => setActiveTab('templates')}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className={cn("h-3 w-3 text-emerald-600", (isProcessing || isNormalizing) && "animate-spin")} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">System Status</span>
            </div>
            <p className="text-xs font-medium text-zinc-600">
              {isProcessing ? "Processing Swamp..." : isNormalizing ? "Normalizing..." : "Ready for Ingestion"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              {activeTab === 'dashboard' && "Data Swamp Ingestion"}
              {activeTab === 'table' && "Golden Record Explorer"}
              {activeTab === 'charts' && "Interactive Visualizations"}
              {activeTab === 'ai' && "AI Intelligence Hub"}
              {activeTab === 'reports' && "Professional Reports"}
              {activeTab === 'audit' && "System Audit Trail"}
              {activeTab === 'templates' && "Configuration Templates"}
            </h1>
            <p className="text-xs text-zinc-500">Transforming fragmented silos into a source of truth.</p>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'table' && (
              <div className="flex items-center gap-2 mr-4 pr-4 border-r border-zinc-100">
                <button 
                  onClick={handleNormalize}
                  disabled={isNormalizing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Normalize AI
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isSidebarOpen ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
              </div>
            )}
            
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="General">General User</option>
              <option value="Accountant">Accountant</option>
              <option value="Manager">Manager</option>
              <option value="Analyst">Analyst</option>
              <option value="Government">Government Official</option>
            </select>

            <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <FileUpload onFilesProcessed={processFiles} isProcessing={isProcessing} />
                  
                  {data.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Ingestion Metrics</h2>
                        <button 
                          onClick={() => {
                            setData([]);
                            setStats({ totalRecords: 0, duplicatesRemoved: 0, formattingFixed: 0, schemaMapped: 0 });
                            logAction('Clear', 'Cleared all data from the swamp');
                          }}
                          className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear Swamp
                        </button>
                      </div>
                      <DataHealth stats={stats} />
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'table' && (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <DataTable 
                    data={data} 
                    columnConfigs={columnConfigs}
                    onExport={handleExport} 
                  />
                </motion.div>
              )}

              {activeTab === 'charts' && (
                <motion.div
                  key="charts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Visualizations data={data} role={role} />
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AIAssistant 
                    report={aiAnalysis} 
                    schemaInsights={schemaInsights}
                    recoveryMetrics={recoveryMetrics}
                    isLoading={isProcessing} 
                    onAnalyze={runAiAnalysis} 
                  />
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ReportGenerator 
                    data={data} 
                    reportContent={aiAnalysis} 
                    fileName="Golden_Record_Report" 
                  />
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden"
                >
                  <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                    <h2 className="font-bold text-zinc-900">System Audit Trail</h2>
                    <p className="text-xs text-zinc-500">Immutable record of all data operations and AI interventions.</p>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {auditLogs.length === 0 ? (
                      <div className="p-12 text-center text-zinc-400 italic">No logs recorded yet.</div>
                    ) : (
                      auditLogs.map((log, i) => (
                        <div key={i} className="p-4 flex items-start gap-4 hover:bg-zinc-50 transition-colors">
                          <div className="mt-1">
                            {log.action.includes('Error') ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-zinc-900">{log.action}</span>
                              <span className="text-[10px] font-mono text-zinc-400">{log.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs text-zinc-600">{log.details}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 bg-zinc-100 rounded text-zinc-500 font-medium">User: {log.user}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <TemplateManager currentConfig={currentConfig} onLoadConfig={loadConfig} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Right Sidebar for Column Selection */}
          <AnimatePresence>
            {isSidebarOpen && activeTab === 'table' && (
              <motion.div
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="h-full border-l border-zinc-100"
              >
                <ColumnSelector 
                  columns={columnConfigs} 
                  onChange={setColumnConfigs} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
        active 
          ? "bg-emerald-50 text-emerald-700 shadow-sm" 
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
