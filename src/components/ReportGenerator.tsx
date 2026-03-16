import React, { useRef } from 'react';
import { FileText, Download, Printer, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn, formatDate } from '../lib/utils';

interface ReportGeneratorProps {
  data: any[];
  reportContent: string | null;
  fileName: string;
}

type ReportTemplate = 'standard' | 'ministry' | 'procurement';

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data, reportContent, fileName }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = React.useState<ReportTemplate>('standard');

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}_${template.toUpperCase()}_Report.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Template</p>
            <div className="flex gap-2">
              {(['standard', 'ministry', 'procurement'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    template === t ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div 
        ref={reportRef}
        className="bg-white p-12 rounded-2xl border border-zinc-100 shadow-sm print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto"
      >
        {template === 'standard' && (
          <>
            <div className="border-b-2 border-zinc-900 pb-8 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 uppercase tracking-tighter mb-1">DataLens Analysis Report</h1>
                <p className="text-zinc-500 font-mono text-xs">Generated on {formatDate(new Date())} • {new Date().toLocaleTimeString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-zinc-900">{fileName}</p>
                <p className="text-xs text-zinc-500">{data.length} Records Analyzed</p>
              </div>
            </div>

            <div className="space-y-10">
              <section>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-100 pb-2">1. Executive Summary</h2>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Total Volume</p>
                    <p className="text-xl font-bold text-zinc-900">{data.length}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Data Quality</p>
                    <p className="text-xl font-bold text-emerald-600">High</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-1">Key Metric</p>
                    <p className="text-xl font-bold text-zinc-900">N/A</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-100 pb-2">2. Detailed Insights & Observations</h2>
                {reportContent ? (
                  <div className="prose prose-sm max-w-none text-zinc-700 leading-relaxed">
                    {reportContent}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">Run AI Analysis to populate this section.</p>
                )}
              </section>

              <section>
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-100 pb-2">3. Strategic Recommendations</h2>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-zinc-600">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">01</span>
                    Optimize data collection processes to reduce null values in key performance indicators.
                  </li>
                  <li className="flex gap-3 text-sm text-zinc-600">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">02</span>
                    Implement automated validation rules for date columns to ensure temporal consistency.
                  </li>
                </ul>
              </section>
            </div>
          </>
        )}

        {template === 'ministry' && (
          <div className="space-y-8">
            <div className="text-center border-b-4 border-double border-zinc-900 pb-6 mb-8">
              <h1 className="text-2xl font-serif font-bold uppercase tracking-widest mb-2">Ministry of Finance & Planning</h1>
              <p className="text-sm font-bold text-zinc-600">Quarterly Financial Performance Review</p>
              <p className="text-[10px] text-zinc-400 mt-2 italic">Official Document ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-900 border-l-4 border-emerald-600 pl-3 uppercase tracking-wider">Budgetary Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Allocated Budget:</span>
                    <span className="font-bold">$1,250,000,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Actual Expenditure:</span>
                    <span className="font-bold">$1,120,450,000</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-zinc-100 pt-2">
                    <span className="text-zinc-500">Variance:</span>
                    <span className="font-bold text-emerald-600">-$129,550,000 (10.3%)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-900 border-l-4 border-emerald-600 pl-3 uppercase tracking-wider">Compliance Status</h3>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 mb-1">Audit Readiness</p>
                  <p className="text-sm text-emerald-700">All financial records for this period have been validated against standard accounting protocols.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Quarterly Breakdown</h3>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-2 font-bold">Quarter</th>
                      <th className="px-4 py-2 font-bold">Revenue</th>
                      <th className="px-4 py-2 font-bold">Expense</th>
                      <th className="px-4 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="px-4 py-2">Q1 2024</td>
                      <td className="px-4 py-2">$320M</td>
                      <td className="px-4 py-2">$280M</td>
                      <td className="px-4 py-2 text-emerald-600 font-bold">ON TRACK</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Q2 2024</td>
                      <td className="px-4 py-2">$345M</td>
                      <td className="px-4 py-2">$310M</td>
                      <td className="px-4 py-2 text-emerald-600 font-bold">ON TRACK</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {template === 'procurement' && (
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-8">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">Procurement Audit Summary</h1>
                <p className="text-sm text-zinc-500">Vendor Performance & Compliance Report</p>
              </div>
              <div className="p-4 bg-zinc-900 text-white rounded-2xl text-center min-w-[120px]">
                <p className="text-[10px] font-bold uppercase opacity-60">Audit Score</p>
                <p className="text-2xl font-bold">94/100</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Total Vendors</p>
                <p className="text-2xl font-bold text-zinc-900">124</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Active Contracts</p>
                <p className="text-2xl font-bold text-zinc-900">86</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Compliance Rate</p>
                <p className="text-2xl font-bold text-emerald-600">98.2%</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Critical Observations</h3>
              <div className="space-y-3">
                {[
                  "Vendor response times improved by 12% in the current period.",
                  "Minor documentation gaps identified in 3 contracts (remediation in progress).",
                  "Cost savings of $45k achieved through bulk procurement optimization."
                ].map((obs, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-white border border-zinc-100 rounded-xl text-sm text-zinc-600">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                    {obs}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 pt-8 border-t border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
          <p>© {new Date().getFullYear()} DataLens AI • Government Analytics Division</p>
          <p>Page 01 of 01</p>
        </div>
      </div>
    </div>
  );
};
