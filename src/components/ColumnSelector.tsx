import React from 'react';
import { 
  Settings2, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ColumnConfig } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
}

function SortableColumnItem({ 
  col, 
  toggleVisibility, 
  renameColumn, 
  changeType 
}: { 
  col: ColumnConfig;
  toggleVisibility: (id: string) => void;
  renameColumn: (id: string, newHeader: string) => void;
  changeType: (id: string, type: ColumnConfig['type']) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group p-3 rounded-xl border transition-all duration-200 mb-1",
        col.visible 
          ? "bg-white border-zinc-200 shadow-sm" 
          : "bg-zinc-50 border-transparent opacity-60",
        isDragging && "shadow-xl border-emerald-500 ring-2 ring-emerald-500/20 opacity-100"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <button 
          onClick={() => toggleVisibility(col.id)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            col.visible ? "text-emerald-600 bg-emerald-50" : "text-zinc-400 bg-zinc-100"
          )}
        >
          {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        
        <input 
          type="text"
          value={col.header}
          onChange={(e) => renameColumn(col.id, e.target.value)}
          className="flex-1 bg-transparent border-none p-0 text-sm font-semibold text-zinc-900 focus:ring-0"
        />
        
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-100 rounded">
          <GripVertical className="w-4 h-4 text-zinc-300" />
        </div>
      </div>

      {col.visible && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-100">
          <select 
            value={col.type}
            onChange={(e) => changeType(col.id, e.target.value as any)}
            className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="percentage">Percentage</option>
            <option value="date">Date</option>
          </select>
          
          <div className="h-3 w-px bg-zinc-200" />
          
          <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[100px]">
            {col.id}
          </span>
        </div>
      )}
    </div>
  );
}

export function ColumnSelector({ columns, onChange }: ColumnSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id);
      const newIndex = columns.findIndex((col) => col.id === over.id);
      onChange(arrayMove(columns, oldIndex, newIndex));
    }
  };

  const toggleVisibility = (id: string) => {
    onChange(columns.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };

  const renameColumn = (id: string, newHeader: string) => {
    onChange(columns.map(col => 
      col.id === id ? { ...col, header: newHeader } : col
    ));
  };

  const changeType = (id: string, type: ColumnConfig['type']) => {
    onChange(columns.map(col => 
      col.id === id ? { ...col, type } : col
    ));
  };

  const filteredColumns = columns.filter(col => 
    col.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200 w-80">
      <div className="p-4 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-zinc-900">Table Configuration</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={columns.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredColumns.map((col) => (
              <SortableColumnItem 
                key={col.id}
                col={col}
                toggleVisibility={toggleVisibility}
                renameColumn={renameColumn}
                changeType={changeType}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
          <span>{columns.filter(c => c.visible).length} columns visible</span>
          <button 
            onClick={() => onChange(columns.map(c => ({ ...c, visible: true })))}
            className="text-emerald-600 font-semibold hover:underline"
          >
            Show All
          </button>
        </div>
        <button 
          className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all active:scale-[0.98]"
        >
          Apply Layout
        </button>
      </div>
    </div>
  );
}
