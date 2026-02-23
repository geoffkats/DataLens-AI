import React, { useRef } from 'react';
import { FileText, Download, Printer, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGeneratorProps {
  data: any[];
  reportContent: string | null;
  fileName: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data, reportContent, fileName }) => {
  const reportRef = useRef<HTMLDivElement>(null);

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
    pdf.save(`${fileName}_Report.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">Report Preview</h3>
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
        <div className="border-b-2 border-zinc-900 pb-8 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 uppercase tracking-tighter mb-1">DataLens Analysis Report</h1>
            <p className="text-zinc-500 font-mono text-xs">Generated on {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</p>
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

        <div className="mt-20 pt-8 border-t border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
          <p>© {new Date().getFullYear()} DataLens AI • Confidential</p>
          <p>Page 01 of 01</p>
        </div>
      </div>
    </div>
  );
};
