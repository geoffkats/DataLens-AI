import React from 'react';
import Markdown from 'react-markdown';
import { Sparkles, BrainCircuit, TrendingUp, AlertTriangle, Loader2, ShieldCheck, Database, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  report: string | null;
  schemaInsights: string | null;
  recoveryMetrics: any[];
  isLoading: boolean;
  onAnalyze: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  report, 
  schemaInsights, 
  recoveryMetrics, 
  isLoading, 
  onAnalyze 
}) => {
  return (
    <div className="space-y-6">
      {/* Main Analysis Report */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">AI Intelligence Hub</h3>
              <p className="text-xs text-zinc-500">Predictive analysis & forensic insights</p>
            </div>
          </div>
          {!report && !isLoading && (
            <button
              onClick={onAnalyze}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              Generate Audit
            </button>
          )}
        </div>

        <div className="p-6 min-h-[200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-zinc-500 animate-pulse">Gemini is performing forensic analysis...</p>
            </div>
          ) : report ? (
            <div className="prose prose-sm max-w-none prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-600 prose-strong:text-zinc-900">
              <Markdown>{report}</Markdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="p-4 bg-zinc-50 rounded-full text-zinc-300">
                <TrendingUp className="w-12 h-12" />
              </div>
              <div>
                <p className="text-zinc-900 font-medium">No Audit Report</p>
                <p className="text-sm text-zinc-500 max-w-[240px] mx-auto">
                  Click the button above to generate a forensic audit of your data swamp.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schema Insights & Forensic Recovery Metrics */}
      {(schemaInsights || recoveryMetrics.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schema Insights */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Draft Schema Insights</h4>
            </div>
            <div className="p-6">
              {schemaInsights ? (
                <div className="prose prose-sm max-w-none prose-zinc">
                  <Markdown>{schemaInsights}</Markdown>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">Run AI Orchestration to see schema insights.</p>
              )}
            </div>
          </div>

          {/* Recovery Audit */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Forensic Recovery Audit</h4>
            </div>
            <div className="p-0">
              {recoveryMetrics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-tighter font-bold">
                      <tr>
                        <th className="px-4 py-3">Column</th>
                        <th className="px-4 py-3">Intent</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action Taken</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recoveryMetrics.map((m, i) => (
                        <tr key={i} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-zinc-900">{m.column}</td>
                          <td className="px-4 py-3 text-zinc-600">{m.intent}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              m.status === 'Recovered' ? "bg-emerald-100 text-emerald-700" :
                              m.status === 'Partial' ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {m.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 italic">{m.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Search className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400 italic">No recovery metrics available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {report && (
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <AlertTriangle className="w-3 h-3" />
          AI generated content may be inaccurate
        </div>
      )}
    </div>
  );
};
