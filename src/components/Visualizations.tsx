import React, { useRef, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
  ComposedChart
} from 'recharts';
import { ChartBar, ChartLine, ChartPie, ChartArea, Download, Image as ImageIcon, Sparkles, Play, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from '../lib/utils';
import { generateChartTitle } from '../services/geminiService';

interface VisualizationsProps {
  data: any[];
  role?: string;
  onDataPointClick?: (column: string, value: any) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Visualizations: React.FC<VisualizationsProps> = ({ data, role = 'General', onDataPointClick }) => {
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [chartTitle, setChartTitle] = useState<string>('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isAnimated, setIsAnimated] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  const numericKeys = keys.filter(key => typeof data[0][key] === 'number');
  const stringKeys = keys.filter(key => typeof data[0][key] === 'string' || typeof data[0][key] === 'object');

  useEffect(() => {
    if (keys.length > 0 && !xAxis) {
      setXAxis(stringKeys[0] || keys[0]);
      setYAxis(numericKeys[0] || keys[1]);
    }
  }, [keys]);

  const handleGenerateTitle = async () => {
    if (!xAxis || !yAxis) return;
    setIsGeneratingTitle(true);
    try {
      const title = await generateChartTitle(xAxis, yAxis, role);
      setChartTitle(title);
    } catch (error) {
      console.error("Failed to generate title", error);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  if (!data || data.length === 0) return null;

  const chartData = data.slice(0, 20);

  const exportChart = async (id: string, title: string, format: 'png' | 'jpeg' = 'png') => {
    const element = document.getElementById(id);
    if (!element) return;
    
    // Hide export buttons during capture
    const buttons = element.querySelectorAll('.export-ignore');
    buttons.forEach(b => (b as HTMLElement).style.visibility = 'hidden');

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 3, // Higher resolution
        useCORS: true,
        logging: false
      });
      
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}.${format}`;
      link.href = canvas.toDataURL(mimeType, 1.0);
      link.click();
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      buttons.forEach(b => (b as HTMLElement).style.visibility = 'visible');
    }
  };

  const handlePointClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const payload = state.activePayload[0].payload;
      if (onDataPointClick) {
        onDataPointClick(xAxis, payload[xAxis]);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-zinc-100 shadow-xl rounded-xl">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{xAxis}: {String(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-semibold text-zinc-900">
                {entry.name}: <span className="text-emerald-600">{entry.value.toLocaleString()}</span>
              </p>
            </div>
          ))}
          <p className="mt-2 text-[10px] text-zinc-400 italic">Click to filter table</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
      onClick: handlePointClick,
      style: { cursor: 'pointer' }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={xAxis} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={yAxis} 
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
              activeDot={{ r: 8, strokeWidth: 0 }}
              isAnimationActive={isAnimated}
              animationDuration={2000}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={xAxis} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey={yAxis} 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCustom)" 
              isAnimationActive={isAnimated}
              animationDuration={2000}
            />
          </AreaChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={xAxis} fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey={yAxis} 
              fill="#10b981" 
              radius={[6, 6, 0, 0]} 
              isAnimationActive={isAnimated}
              animationDuration={2000}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Chart Builder Controls */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-zinc-900">Custom Chart Builder</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">X-Axis (Category)</label>
            <select 
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {keys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Y-Axis (Value)</label>
            <select 
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {numericKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chart Type</label>
            <div className="flex gap-2">
              {(['bar', 'line', 'area'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-medium border transition-all",
                    chartType === type 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chart Title</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Enter title or generate one..."
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full pl-4 pr-12 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button 
                onClick={handleGenerateTitle}
                disabled={isGeneratingTitle}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                title="Generate AI Title"
              >
                <Sparkles className={cn("w-4 h-4", isGeneratingTitle && "animate-pulse")} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-1">
            <button
              onClick={() => setIsAnimated(!isAnimated)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                isAnimated 
                  ? "bg-amber-50 border-amber-200 text-amber-700" 
                  : "bg-zinc-50 border-zinc-200 text-zinc-500"
              )}
            >
              <Play className={cn("w-4 h-4", isAnimated && "fill-current")} />
              {isAnimated ? "Animated Growth" : "Static View"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Display */}
      <div id="custom-chart" className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm relative group min-h-[450px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">{chartTitle || `${yAxis} by ${xAxis}`}</h3>
            <p className="text-xs text-zinc-400 mt-1">Interactive {chartType} visualization</p>
          </div>
          <div className="flex items-center gap-1 export-ignore">
            <button 
              onClick={() => exportChart('custom-chart', chartTitle || 'Custom_Chart', 'png')}
              className="px-2 py-1 text-[10px] font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded transition-all"
              title="Export as PNG"
            >
              PNG
            </button>
            <button 
              onClick={() => exportChart('custom-chart', chartTitle || 'Custom_Chart', 'jpeg')}
              className="px-2 py-1 text-[10px] font-bold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded transition-all"
              title="Export as JPEG"
            >
              JPG
            </button>
          </div>
        </div>
        
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height={350}>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{ id: string; title: string; icon: React.ReactNode; children: React.ReactNode; onExport: (format: 'png' | 'jpeg') => void }> = ({ id, title, icon, children, onExport }) => (
  <div id={id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm relative group">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-zinc-50 rounded-lg text-zinc-500">
          {icon}
        </div>
        <h3 className="font-medium text-zinc-900">{title}</h3>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all export-ignore">
        <button 
          onClick={() => onExport('png')}
          className="px-2 py-1 text-[10px] font-bold bg-zinc-50 text-zinc-500 hover:bg-zinc-100 rounded transition-all"
          title="Export as PNG"
        >
          PNG
        </button>
        <button 
          onClick={() => onExport('jpeg')}
          className="px-2 py-1 text-[10px] font-bold bg-zinc-50 text-zinc-500 hover:bg-zinc-100 rounded transition-all"
          title="Export as JPEG"
        >
          JPG
        </button>
      </div>
    </div>
    {children}
  </div>
);
