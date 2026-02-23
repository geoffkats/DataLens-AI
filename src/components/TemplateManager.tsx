import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Play } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  config: any;
  createdAt: string;
}

interface TemplateManagerProps {
  currentConfig: any;
  onLoadConfig: (config: any) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ currentConfig, onLoadConfig }) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('datalens_presets');
    if (saved) setPresets(JSON.parse(saved));
  }, []);

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: crypto.randomUUID(),
      name: newPresetName,
      config: currentConfig,
      createdAt: new Date().toISOString()
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('datalens_presets', JSON.stringify(updated));
    setNewPresetName('');
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('datalens_presets', JSON.stringify(updated));
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FolderOpen className="w-5 h-5 text-zinc-400" />
        <h3 className="font-semibold text-zinc-900">Templates & Presets</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Preset name (e.g. Monthly Sales)"
          className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          value={newPresetName}
          onChange={(e) => setNewPresetName(e.target.value)}
        />
        <button
          onClick={savePreset}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {presets.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4 italic">No saved presets</p>
        ) : (
          presets.map(preset => (
            <div key={preset.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 group">
              <div>
                <p className="text-sm font-medium text-zinc-900">{preset.name}</p>
                <p className="text-[10px] text-zinc-400">{new Date(preset.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onLoadConfig(preset.config)}
                  className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="Load Preset"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete Preset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
