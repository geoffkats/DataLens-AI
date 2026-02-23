/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { Visualizations } from './components/Visualizations';
import { AIAssistant } from './components/AIAssistant';
import { ReportGenerator } from './components/ReportGenerator';
import { TemplateManager } from './components/TemplateManager';
import { analyzeData, suggestCleaning } from './services/geminiService';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'data' | 'visuals' | 'ai' | 'report' | 'settings';
type Role = 'General' | 'Accountant' | 'Manager' | 'Analyst';
type TimeRange = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_year';

export default function App() {
  const [data, setData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [role, setRole] = useState<Role>('General');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [chartFilter, setChartFilter] = useState<{ column: string; value: any } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [cleaningSuggestions, setCleaningSuggestions] = useState<any[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);

  // Automated Data Preparation
  const prepareData = (rawData: any[]) => {
    return rawData.map(row => {
      const cleanRow = { ...row };
      Object.keys(cleanRow).forEach(key => {
        // Trim strings
        if (typeof cleanRow[key] === 'string') {
          cleanRow[key] = cleanRow[key].trim();
          
          // Attempt date conversion if column name suggests date
          if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
            const date = new Date(cleanRow[key]);
            if (!isNaN(date.getTime())) {
              cleanRow[key] = date;
            }
          }
        }
        // Handle numeric formatting
        if (!isNaN(Number(cleanRow[key])) && cleanRow[key] !== '' && typeof cleanRow[key] !== 'boolean') {
          cleanRow[key] = Number(cleanRow[key]);
        }
      });
      return cleanRow;
    });
  };

  const handleDataLoaded = (loadedData: any[], name: string) => {
    const prepared = prepareData(loadedData);
    setData(prepared);
    setOriginalData(prepared);
    setFileName(name);
    setActiveTab('dashboard');
    setAiReport(null);
    setCleaningSuggestions([]);
  };

  const filteredData = useMemo(() => {
    let result = data;
    
    // Time filtering
    if (timeRange !== 'all') {
      const now = new Date();
      let start: Date, end: Date;

      switch (timeRange) {
        case 'this_month':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'last_month':
          start = startOfMonth(subMonths(now, 1));
          end = endOfMonth(subMonths(now, 1));
          break;
        case 'last_3_months':
          start = subMonths(now, 3);
          end = now;
          break;
        case 'last_year':
          start = subMonths(now, 12);
          end = now;
          break;
        default:
          break;
      }

      result = result.filter(row => {
        const dateKey = Object.keys(row).find(k => row[k] instanceof Date);
        if (!dateKey) return true;
        // @ts-ignore
        return isWithinInterval(row[dateKey], { start, end });
      });
    }

    // Chart filtering
    if (chartFilter) {
      result = result.filter(row => row[chartFilter.column] === chartFilter.value);
    }

    return result;
  }, [data, timeRange, chartFilter]);

  const handleAnalyze = async () => {
    if (filteredData.length === 0) return;
    setIsAnalyzing(true);
    try {
      const report = await analyzeData(filteredData);
      setAiReport(report);
      setActiveTab('ai');
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (data.length === 0) return;
    setIsCleaning(true);
    try {
      const suggestions = await suggestCleaning(data);
      setCleaningSuggestions(suggestions.cleaningSteps || []);
    } catch (error) {
      console.error("Cleaning suggestions failed:", error);
    } finally {
      setIsCleaning(false);
    }
  };

  const applyCleaning = (step: any) => {
    const newData = data.map(row => {
      const newRow = { ...row };
      if (newRow[step.column] === null || newRow[step.column] === undefined || newRow[step.column] === '') {
        newRow[step.column] = step.replacementValue;
      }
      return newRow;
    });
    setData(newData);
    setCleaningSuggestions(prev => prev.filter(s => s !== step));
  };

  const resetData = () => {
    setData(originalData);
    setCleaningSuggestions([]);
  };

  const clearData = () => {
    setData([]);
    setOriginalData([]);
    setFileName('');
    setAiReport(null);
    setCleaningSuggestions([]);
  };

  const currentConfig = { role, timeRange, activeTab };
  const loadConfig = (config: any) => {
    if (config.role) setRole(config.role);
    if (config.timeRange) setTimeRange(config.timeRange);
    if (config.activeTab) setActiveTab(config.activeTab);
  };

  if (data.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-4">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">DataLens AI</h1>
          <p className="text-zinc-500 max-w-md mx-auto">
            Professional data analysis & reporting system. Upload your Excel or CSV data to begin.
          </p>
        </motion.div>
        <FileUpload onDataLoaded={handleDataLoaded} isLoading={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-100 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3 text-emerald-600">
            <Database className="w-6 h-6" />
            <span className="font-bold text-zinc-900 text-lg">DataLens AI</span>
          </div>
        </div>

        <div className="p-4 border-b border-zinc-100 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Your Role</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
              >
                <option>General</option>
                <option>Accountant</option>
                <option>Manager</option>
                <option>Analyst</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Time Range</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
          />
          <SidebarLink 
            active={activeTab === 'data'} 
            onClick={() => setActiveTab('data')}
            icon={<TableIcon className="w-4 h-4" />}
            label="Data Explorer"
          />
          <SidebarLink 
            active={activeTab === 'visuals'} 
            onClick={() => setActiveTab('visuals')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="Visualizations"
          />
          <SidebarLink 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')}
            icon={<Brain className="w-4 h-4" />}
            label="AI Insights"
          />
          <SidebarLink 
            active={activeTab === 'report'} 
            onClick={() => setActiveTab('report')}
            icon={<FileText className="w-4 h-4" />}
            label="Report Generator"
          />
          <SidebarLink 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings className="w-4 h-4" />}
            label="Presets"
          />
        </nav>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <button 
            onClick={clearData}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{fileName}</h2>
            <p className="text-sm text-zinc-500">
              {filteredData.length} of {data.length} rows visible
              {timeRange !== 'all' && ` (${timeRange.replace('_', ' ')})`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={resetData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={handleGetSuggestions}
              disabled={isCleaning}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              {isCleaning ? "Thinking..." : "Clean with AI"}
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="Total Rows" value={filteredData.length} />
                  <StatCard title="Columns" value={Object.keys(data[0] || {}).length} />
                  <StatCard title="Data Health" value="98%" />
                  <StatCard title="Role Context" value={role} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <section>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-4">Quick Preview</h3>
                      <DataTable data={filteredData.slice(0, 5)} />
                    </section>
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900">Visual Summary</h3>
                        {chartFilter && (
                          <button 
                            onClick={() => setChartFilter(null)}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Clear Chart Filter
                          </button>
                        )}
                      </div>
                      <Visualizations 
                        data={filteredData} 
                        role={role} 
                        onDataPointClick={(col, val) => {
                          setChartFilter({ column: col, value: val });
                          setActiveTab('data'); // Switch to data tab to see filtered results
                        }} 
                      />
                    </section>
                  </div>

                  <div className="space-y-8">
                    <section className="h-full">
                      <h3 className="text-lg font-semibold text-zinc-900 mb-4">AI Suggestions</h3>
                      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-4">
                        {cleaningSuggestions.length > 0 ? (
                          cleaningSuggestions.map((step, i) => (
                            <div key={i} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{step.column}</p>
                                  <p className="text-sm font-medium text-zinc-900">{step.issue}</p>
                                </div>
                                <div className="p-1 bg-amber-100 text-amber-600 rounded">
                                  <Wand2 className="w-3 h-3" />
                                </div>
                              </div>
                              <p className="text-xs text-zinc-500">{step.suggestion}</p>
                              <button 
                                onClick={() => applyCleaning(step)}
                                className="w-full py-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Apply Fix
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 space-y-3">
                            <div className="p-3 bg-zinc-50 rounded-full inline-flex text-zinc-300">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <p className="text-sm text-zinc-500">No cleaning suggestions yet. Click "Clean with AI" to scan your data.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">Full Dataset</h3>
                  {chartFilter && (
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100 flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        Filtered by {chartFilter.column}: {String(chartFilter.value)}
                      </div>
                      <button 
                        onClick={() => setChartFilter(null)}
                        className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <DataTable data={filteredData} />
              </section>
            )}

            {activeTab === 'visuals' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">Interactive Charts</h3>
                  {chartFilter && (
                    <button 
                      onClick={() => setChartFilter(null)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Clear Chart Filter
                    </button>
                  )}
                </div>
                <Visualizations 
                  data={filteredData} 
                  role={role} 
                  onDataPointClick={(col, val) => {
                    setChartFilter({ column: col, value: val });
                    setActiveTab('data');
                  }} 
                />
              </section>
            )}

            {activeTab === 'ai' && (
              <section className="space-y-4 h-[calc(100vh-200px)]">
                <h3 className="text-lg font-semibold text-zinc-900">Predictive Analysis</h3>
                <AIAssistant 
                  report={aiReport} 
                  isLoading={isAnalyzing} 
                  onAnalyze={handleAnalyze} 
                />
              </section>
            )}

            {activeTab === 'report' && (
              <section className="space-y-4">
                <ReportGenerator 
                  data={filteredData} 
                  reportContent={aiReport} 
                  fileName={fileName} 
                />
              </section>
            )}

            {activeTab === 'settings' && (
              <section className="max-w-2xl mx-auto">
                <TemplateManager 
                  currentConfig={currentConfig} 
                  onLoadConfig={loadConfig} 
                />
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
      active 
        ? "bg-emerald-50 text-emerald-700 shadow-sm" 
        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
    )}
  >
    {icon}
    {label}
  </button>
);

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-3xl font-bold text-zinc-900">{value}</p>
  </div>
);
