import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
  ComposedChart
} from 'recharts';
import { ChartBar, ChartLine, ChartPie, ChartArea, Download, Image as ImageIcon, Sparkles, Play, Settings2, TrendingUp, XCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn, formatDate } from '../lib/utils';
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
  const [showTrend, setShowTrend] = useState(false);
  const [drillDownPath, setDrillDownPath] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<string>('');
  const [topN, setTopN] = useState<number>(10);
  const [isVertical, setIsVertical] = useState(false);

  const keys = useMemo(() => {
    if (data.length === 0) return [];
    const allKeys = new Set<string>();
    // Scan up to 100 records to find all possible keys (for performance)
    data.slice(0, 100).forEach(row => {
      Object.keys(row).forEach(k => allKeys.add(k));
    });
    return Array.from(allKeys);
  }, [data]);
  const numericKeys = useMemo(() => {
    return keys.filter(key => {
      // Find the first non-null value to check type
      const sample = data.find(row => row[key] !== undefined && row[key] !== null);
      return typeof sample?.[key] === 'number';
    });
  }, [keys, data]);

  const stringKeys = useMemo(() => {
    return keys.filter(key => {
      const sample = data.find(row => row[key] !== undefined && row[key] !== null);
      return (typeof sample?.[key] === 'string' || typeof sample?.[key] === 'object') && key !== '_sheet';
    });
  }, [keys, data]);
  const hasMultipleSheets = keys.includes('_sheet');

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

  // Pivot / Aggregation Logic with Top-N Grouping
  const chartData = useMemo(() => {
    let processedData = data;
    
    if (groupBy) {
      const groups: Record<string, any> = {};
      data.forEach(row => {
        const key = String(row[groupBy]);
        if (!groups[key]) {
          groups[key] = { [groupBy]: key, [yAxis]: 0, count: 0 };
        }
        groups[key][yAxis] += row[yAxis] || 0;
        groups[key].count += 1;
      });
      processedData = Object.values(groups);
    }

    // Sort by yAxis descending
    processedData.sort((a, b) => (b[yAxis] || 0) - (a[yAxis] || 0));

    if (topN > 0 && processedData.length > topN) {
      const top = processedData.slice(0, topN);
      const others = processedData.slice(topN);
      const othersTotal = others.reduce((sum, item) => sum + (item[yAxis] || 0), 0);
      const othersCount = others.reduce((sum, item) => sum + (item.count || 1), 0);
      
      return [
        ...top,
        { [xAxis || groupBy]: 'Others (Aggregated)', [yAxis]: othersTotal, count: othersCount }
      ];
    }

    return processedData.slice(0, 20);
  }, [data, groupBy, yAxis, topN, xAxis]);

  const truncateLabel = (label: string, length: number = 20) => {
    if (typeof label !== 'string') return String(label);
    return label.length > length ? label.substring(0, length) + '...' : label;
  };

  // Simple Linear Regression for Trend Line
  const trendData = useMemo(() => {
    if (!showTrend || chartData.length < 2) return null;
    const n = chartData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += chartData[i][yAxis];
      sumXY += i * chartData[i][yAxis];
      sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return chartData.map((d, i) => ({
      ...d,
      trend: slope * i + intercept
    }));
  }, [chartData, yAxis, showTrend]);

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
      
      // Drill-down logic: if we click a point, we could potentially drill down
      // For this prototype, we'll simulate drill down by filtering and adding to path
      if (onDataPointClick) {
        onDataPointClick(xAxis, payload[xAxis]);
        setDrillDownPath([...drillDownPath, String(payload[xAxis])]);
      }
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fullLabel = label instanceof Date ? formatDate(label) : String(label);
      return (
        <div className="bg-white p-4 border border-zinc-100 shadow-xl rounded-xl max-w-[300px]">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 break-words">{xAxis}: {fullLabel}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-semibold text-zinc-900">
                {entry.name}: <span className="text-emerald-600">{entry.value.toLocaleString()}</span>
              </p>
            </div>
          ))}
          {showTrend && (
            <p className="mt-2 text-[10px] text-zinc-400 italic border-t pt-2">Trend Projection Active</p>
          )}
          <p className="mt-1 text-[10px] text-zinc-400 italic">Click to drill down</p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const activeData = trendData || chartData;
    const commonProps = {
      data: activeData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
      onClick: handlePointClick,
      style: { cursor: 'pointer' }
    };

    if (hasMultipleSheets) {
      const sheetNames = Array.from(new Set(activeData.map(d => d._sheet)));
      
      // Reshape data for multi-series chart
      // We group by xAxis value and create a combined object
      const groupedData: any[] = [];
      const xAxisValues = Array.from(new Set(activeData.map(d => String(d[xAxis]))));
      
      xAxisValues.forEach(val => {
        const entry: any = { [xAxis]: val };
        sheetNames.forEach(sheet => {
          const match = activeData.find(d => String(d[xAxis]) === val && d._sheet === sheet);
          if (match) {
            entry[sheet as string] = match[yAxis];
          }
        });
        groupedData.push(entry);
      });

      const multiProps = {
        data: groupedData,
        margin: { top: 10, right: 10, left: 0, bottom: 0 },
        onClick: handlePointClick,
        style: { cursor: 'pointer' }
      };
      
      switch (chartType) {
        case 'line':
          return (
            <LineChart {...multiProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey={xAxis} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36}/>
              {sheetNames.map((name, index) => (
                <Line 
                  key={String(name)}
                  type="monotone" 
                  dataKey={String(name)}
                  name={String(name)}
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                  isAnimationActive={isAnimated}
                />
              ))}
            </LineChart>
          );
        default:
          return (
            <BarChart {...multiProps} layout={isVertical ? "vertical" : "horizontal"}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              {isVertical ? (
                <>
                  <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey={xAxis} 
                    type="category" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => truncateLabel(val, 30)}
                    width={180}
                  />
                </>
              ) : (
                <>
                  <XAxis 
                    dataKey={xAxis} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                </>
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend verticalAlign="top" height={36}/>
              {sheetNames.map((name, index) => (
                <Bar 
                  key={String(name)}
                  dataKey={String(name)}
                  name={String(name)}
                  fill={COLORS[index % COLORS.length]} 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={isAnimated}
                />
              ))}
            </BarChart>
          );
      }
    }

    switch (chartType) {
      case 'line':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey={xAxis} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
              angle={-45}
              textAnchor="end"
              height={60}
            />
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
            {showTrend && (
              <Line type="monotone" dataKey="trend" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Trend Line" />
            )}
          </ComposedChart>
        );
      case 'area':
        return (
          <ComposedChart {...commonProps}>
            <defs>
              <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey={xAxis} 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
              angle={-45}
              textAnchor="end"
              height={60}
            />
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
            {showTrend && (
              <Line type="monotone" dataKey="trend" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Trend Line" />
            )}
          </ComposedChart>
        );
      default:
        return (
          <ComposedChart {...commonProps} layout={isVertical ? "vertical" : "horizontal"}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            {isVertical ? (
              <>
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  dataKey={xAxis} 
                  type="category" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => truncateLabel(val, 30)}
                  width={180}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey={xAxis} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey={yAxis} 
              fill="#10b981" 
              radius={[6, 6, 0, 0]} 
              isAnimationActive={isAnimated}
              animationDuration={2000}
            />
            {showTrend && (
              <Line type="monotone" dataKey="trend" stroke="#ef4444" strokeDasharray="5 5" dot={false} strokeWidth={2} name="Trend Line" />
            )}
          </ComposedChart>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard 
          id="quick-bar" 
          title="Distribution Overview" 
          icon={<ChartBar className="w-4 h-4" />} 
          onExport={(fmt) => exportChart('quick-bar', 'Distribution_Overview', fmt)}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} onClick={handlePointClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey={xAxis} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey={yAxis} fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={isAnimated} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          id="quick-line" 
          title="Trend Analysis" 
          icon={<ChartLine className="w-4 h-4" />} 
          onExport={(fmt) => exportChart('quick-line', 'Trend_Analysis', fmt)}
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData} onClick={handlePointClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey={xAxis} 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => val instanceof Date ? formatDate(val) : truncateLabel(val)}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey={yAxis} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} isAnimationActive={isAnimated} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Chart Builder Controls */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-zinc-900">Custom Chart Builder</h3>
          </div>
          {drillDownPath.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Drill-down:</span>
              <div className="flex items-center gap-1">
                {drillDownPath.map((p, i) => (
                  <React.Fragment key={i}>
                    <span className="px-2 py-0.5 bg-zinc-100 rounded text-zinc-600 font-medium">{p}</span>
                    {i < drillDownPath.length - 1 && <span className="text-zinc-300">/</span>}
                  </React.Fragment>
                ))}
                <button 
                  onClick={() => { setDrillDownPath([]); onDataPointClick?.('', null); }}
                  className="ml-2 text-red-500 hover:text-red-600"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">X-Axis</label>
            <select 
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {keys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Y-Axis</label>
            <select 
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {numericKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Group By</label>
            <select 
              value={groupBy}
              onChange={(e) => {
                setGroupBy(e.target.value);
                if (e.target.value) setXAxis(e.target.value);
              }}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">None</option>
              {stringKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top N</label>
            <select 
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={0}>Show All</option>
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
                  {type.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Orientation</label>
            <button
              onClick={() => setIsVertical(!isVertical)}
              className={cn(
                "w-full py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1",
                isVertical 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-sm" 
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {isVertical ? "Horizontal Bars" : "Vertical Bars"}
            </button>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Settings</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTrend(!showTrend)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1",
                  showTrend 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <TrendingUp className="w-3 h-3" />
                Trend Line
              </button>
              <button
                onClick={() => setIsAnimated(!isAnimated)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1",
                  isAnimated 
                    ? "bg-amber-50 border-amber-200 text-amber-700" 
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                )}
              >
                <Play className="w-3 h-3" />
                Animations
              </button>
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
        </div>
      </div>

      {/* Main Chart Display */}
      <div id="custom-chart" className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm relative group min-h-[450px] flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">{chartTitle || `${yAxis} by ${xAxis}`}</h3>
            <p className="text-xs text-zinc-400 mt-1">
              {showTrend ? "Forecasting & Trend Projection Active" : `Interactive ${chartType} visualization`}
            </p>
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
          <ResponsiveContainer width="100%" height={isVertical ? Math.max(350, chartData.length * 40) : 350}>
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
      <div className="flex items-center gap-1 transition-all export-ignore">
        <button 
          onClick={() => onExport('png')}
          className="px-2 py-1 text-[10px] font-bold bg-zinc-50 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 border border-zinc-100 rounded transition-all"
          title="Export as PNG"
        >
          PNG
        </button>
        <button 
          onClick={() => onExport('jpeg')}
          className="px-2 py-1 text-[10px] font-bold bg-zinc-50 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 border border-zinc-100 rounded transition-all"
          title="Export as JPEG"
        >
          JPG
        </button>
      </div>
    </div>
    {children}
  </div>
);
