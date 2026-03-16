import React from 'react';
import { NormalizedLead } from '../services/geminiService';
import { User, Phone, Mail, Tag, Info, ShieldCheck } from 'lucide-react';

interface LeadTableProps {
  leads: NormalizedLead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  if (leads.length === 0) return null;

  return (
    <div className="w-full overflow-hidden bg-white border border-zinc-200 rounded-2xl shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-zinc-900">Golden Records (Unified Leads)</h2>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
          {leads.length} Records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <th className="px-6 py-3 border-b border-zinc-100">Lead Details</th>
              <th className="px-6 py-3 border-b border-zinc-100">Contact</th>
              <th className="px-6 py-3 border-b border-zinc-100">Status & Source</th>
              <th className="px-6 py-3 border-b border-zinc-100">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leads.map((lead, idx) => (
              <tr key={`${lead.email}-${lead.phone}-${idx}`} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{lead.lead_name}</p>
                      <p className="text-xs text-zinc-500">{lead.grade || 'No Grade'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      lead.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      lead.status === 'potential' ? 'bg-amber-100 text-amber-700' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                      {lead.status}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Tag className="w-3 h-3" />
                      {lead.source_file}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(lead.metadata || {}).map(([key, value]) => (
                      <span key={key} className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
