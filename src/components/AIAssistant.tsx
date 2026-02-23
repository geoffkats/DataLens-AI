import React from 'react';
import Markdown from 'react-markdown';
import { Sparkles, BrainCircuit, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AIAssistantProps {
  report: string | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ report, isLoading, onAnalyze }) => {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">AI Intelligence</h3>
            <p className="text-xs text-zinc-500">Predictive analysis & insights</p>
          </div>
        </div>
        {!report && !isLoading && (
          <button
            onClick={onAnalyze}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <BrainCircuit className="w-4 h-4" />
            Analyze Data
          </button>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-zinc-500 animate-pulse">Gemini is processing your data...</p>
          </div>
        ) : report ? (
          <div className="prose prose-sm max-w-none prose-zinc prose-headings:text-zinc-900 prose-p:text-zinc-600 prose-strong:text-zinc-900">
            <Markdown>{report}</Markdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="p-4 bg-zinc-50 rounded-full text-zinc-300">
              <TrendingUp className="w-12 h-12" />
            </div>
            <div>
              <p className="text-zinc-900 font-medium">No Analysis Yet</p>
              <p className="text-sm text-zinc-500 max-w-[240px] mx-auto">
                Click the button above to generate AI-powered insights and predictions.
              </p>
            </div>
          </div>
        )}
      </div>

      {report && (
        <div className="p-4 bg-zinc-50 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" />
            AI generated content may be inaccurate
          </div>
        </div>
      )}
    </div>
  );
};
