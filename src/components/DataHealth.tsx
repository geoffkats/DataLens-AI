import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ShieldCheck, AlertTriangle, Zap, Database } from 'lucide-react';

interface DataHealthProps {
  stats: {
    totalRecords: number;
    duplicatesRemoved: number;
    formattingFixed: number;
    schemaMapped: number;
  };
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export function DataHealth({ stats }: DataHealthProps) {
  const chartData = [
    { name: 'Clean', value: stats.totalRecords },
    { name: 'Duplicates', value: stats.duplicatesRemoved },
    { name: 'Fixed', value: stats.formattingFixed },
    { name: 'Mapped', value: stats.schemaMapped },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Stats Cards */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Golden Records</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{stats.totalRecords}</div>
          <p className="text-xs text-zinc-400 mt-1">Verified unique leads</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Duplicates Purged</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{stats.duplicatesRemoved}</div>
          <p className="text-xs text-zinc-400 mt-1">Cross-file redundancies removed</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Formats Fixed</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{stats.formattingFixed}</div>
          <p className="text-xs text-zinc-400 mt-1">Phone & Email standardizations</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Database className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Schema Mappings</span>
          </div>
          <div className="text-3xl font-bold text-zinc-900">{stats.schemaMapped}</div>
          <p className="text-xs text-zinc-400 mt-1">AI-driven header alignments</p>
        </div>
      </div>

      {/* Health Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
        <h3 className="text-sm font-bold text-zinc-900 mb-6 uppercase tracking-wider">Data Health Composition</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-zinc-500">{item.name}</span>
              </div>
              <span className="font-bold text-zinc-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
