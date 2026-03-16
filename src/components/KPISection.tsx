import React from 'react';
import { TrendingUp, TrendingDown, Target, Activity, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPIProps {
  data: any[];
}

export const KPISection: React.FC<KPIProps> = ({ data }) => {
  if (data.length === 0) return null;

  // Heuristic-based KPI calculation
  const numericKeys = Object.keys(data[0]).filter(k => typeof data[0][k] === 'number' && !k.startsWith('_'));
  
  const calculateKPI = (key: string) => {
    const values = data.map(d => d[key]).filter(v => typeof v === 'number' && !isNaN(v));
    
    if (values.length === 0) return { 
      total: 0, avg: 0, trend: 0, target: 0, progress: 0, anomalies: 0, variance: 0, variancePct: 0, status: 'red' as const, hasData: false 
    };

    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    
    // Standard Deviation for Anomaly Detection
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
    const anomalies = values.filter(v => Math.abs(v - avg) > 2 * stdDev).length;

    // Simple trend: compare first half vs second half
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
    const secondHalf = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid || 1);
    const trend = firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100;
    
    // Mock target (10% above average)
    const target = avg * 1.1;
    const variance = avg - target;
    const variancePct = (variance / target) * 100;
    const progress = (avg / target) * 100;

    // Traffic Light Status: Red < 80%, Amber 80-95%, Green >= 95%
    let status: 'red' | 'amber' | 'green' = 'red';
    if (progress >= 95) status = 'green';
    else if (progress >= 80) status = 'amber';

    return { total, avg, trend, target, progress, anomalies, variance, variancePct, status, hasData: true };
  };

  const kpis = numericKeys.slice(0, 4).map(key => ({
    key,
    ...calculateKPI(key)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          Executive Performance Scorecard
        </h3>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> On Track
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> Warning
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Critical
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.key} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4 relative overflow-hidden group hover:border-emerald-200 transition-all">
            {kpi.anomalies > 0 && (
              <div className="absolute top-0 right-0 p-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-bl-xl border-l border-b border-amber-100 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase">{kpi.anomalies} Anomalies</span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className={cn(
                "p-2 rounded-lg",
                kpi.status === 'green' ? "bg-emerald-50 text-emerald-600" :
                kpi.status === 'amber' ? "bg-amber-50 text-amber-600" :
                "bg-red-50 text-red-600"
              )}>
                <Activity className="w-4 h-4" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                kpi.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {kpi.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(kpi.trend).toFixed(1)}%
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{kpi.key}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-zinc-900">
                  {kpi.hasData ? kpi.avg.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
                </p>
                {kpi.hasData && (
                  <span className={cn(
                    "text-[10px] font-bold",
                    kpi.variance >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {kpi.variance >= 0 ? '+' : ''}{kpi.variance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Target: {kpi.hasData ? kpi.target.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
                </span>
                <span className={cn(
                  kpi.status === 'green' ? "text-emerald-600" :
                  kpi.status === 'amber' ? "text-amber-600" :
                  "text-red-600"
                )}>
                  {kpi.hasData ? `${kpi.progress.toFixed(0)}%` : '0%'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    kpi.status === 'green' ? "bg-emerald-500" :
                    kpi.status === 'amber' ? "bg-amber-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${kpi.hasData ? Math.min(kpi.progress, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
