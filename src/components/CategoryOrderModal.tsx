import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Layers, 
  GripVertical,
  ArrowUpToLine,
  ArrowDownToLine,
  Sparkles
} from 'lucide-react';
import { DEFAULT_CATEGORIES, SystemSettings } from '../types';
import { StorageService } from '../services/storageService';

interface CategoryOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  existingCategories?: string[];
}

export const CategoryOrderModal: React.FC<CategoryOrderModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  existingCategories = []
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const ordered = StorageService.getOrderedCategories(settings, existingCategories);
      setCategories(ordered);
      setSavedSuccess(false);
    }
  }, [isOpen, settings, existingCategories]);

  if (!isOpen) return null;

  const moveCategory = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const list = [...categories];
    const item = list[index];

    if (direction === 'up' && index > 0) {
      list.splice(index, 1);
      list.splice(index - 1, 0, item);
    } else if (direction === 'down' && index < list.length - 1) {
      list.splice(index, 1);
      list.splice(index + 1, 0, item);
    } else if (direction === 'top' && index > 0) {
      list.splice(index, 1);
      list.unshift(item);
    } else if (direction === 'bottom' && index < list.length - 1) {
      list.splice(index, 1);
      list.push(item);
    }

    setCategories(list);
  };

  const handleResetDefault = () => {
    const defaultList = StorageService.getOrderedCategories(
      { ...settings, categoryOrder: DEFAULT_CATEGORIES },
      existingCategories
    );
    setCategories(defaultList);
  };

  const handleSave = () => {
    const updatedSettings: SystemSettings = {
      ...settings,
      categoryOrder: categories
    };
    onSaveSettings(updatedSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">ORDEM DAS CATEGORIAS</h3>
              <p className="text-[11px] text-slate-400">Defina a sequência das categorias no PDF e nas listas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Organize a posição das categorias subindo ou descendo cada uma. Ao gerar relatórios PDF ou baixar listas, os produtos virão exatamente nesta ordem.
            </p>
          </div>

          {/* Category List */}
          <div className="space-y-1.5">
            {categories.map((cat, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === categories.length - 1;

              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 font-extrabold text-[11px] text-slate-700 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-800 truncate">
                      {cat}
                    </span>
                  </div>

                  {/* Position Controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveCategory(idx, 'top')}
                      title="Mover para o topo"
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveCategory(idx, 'up')}
                      title="Subir posição"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-lg border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveCategory(idx, 'down')}
                      title="Descer posição"
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-white rounded-lg border border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-bold"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveCategory(idx, 'bottom')}
                      title="Mover para o fim"
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Ordem Padrão</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{savedSuccess ? 'Salvo!' : 'SALVAR ORDEM'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
