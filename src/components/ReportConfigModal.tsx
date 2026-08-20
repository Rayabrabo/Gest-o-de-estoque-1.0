import React, { useState } from 'react';
import { 
  Settings2, 
  X, 
  FileText, 
  MessageSquare, 
  Check, 
  Layers, 
  DollarSign, 
  Hash, 
  AlertTriangle, 
  SlidersHorizontal,
  UtensilsCrossed,
  ShieldAlert,
  Save
} from 'lucide-react';
import { ReportExportConfig, DEFAULT_REPORT_CONFIG, SystemSettings } from '../types';
import { StorageService } from '../services/storageService';

interface ReportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveConfig?: (config: ReportExportConfig) => void;
  onGeneratePDF?: (config: ReportExportConfig) => void;
  onGenerateWhatsApp?: (config: ReportExportConfig) => void;
}

export const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveConfig,
  onGeneratePDF,
  onGenerateWhatsApp
}) => {
  const [config, setConfig] = useState<ReportExportConfig>(() => {
    return StorageService.getReportConfig();
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof ReportExportConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveAsDefault = () => {
    StorageService.saveReportConfig(config);
    if (onSaveConfig) {
      onSaveConfig(config);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handlePDFClick = () => {
    StorageService.saveReportConfig(config);
    if (onSaveConfig) onSaveConfig(config);
    if (onGeneratePDF) onGeneratePDF(config);
    onClose();
  };

  const handleWhatsAppClick = () => {
    StorageService.saveReportConfig(config);
    if (onSaveConfig) onSaveConfig(config);
    if (onGenerateWhatsApp) onGenerateWhatsApp(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Configurações de Exportação (PDF & Texto)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha o que deve ser exibido no PDF e no texto para WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* 1. Filtro Principal de Itens */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Quais produtos incluir no relatório?</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, stockFilter: 'all' }))}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between cursor-pointer ${
                  config.stockFilter === 'all'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <p className="font-bold">📦 Todos os Produtos</p>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Lista completa de todos os itens cadastrados
                  </p>
                </div>
                {config.stockFilter === 'all' && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
              </button>

              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, stockFilter: 'in_stock' }))}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between cursor-pointer ${
                  config.stockFilter === 'in_stock'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <p className="font-bold">✅ Apenas Estoque Atual (&gt; 0)</p>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Mostra somente itens que têm estoque físico hoje
                  </p>
                </div>
                {config.stockFilter === 'in_stock' && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
              </button>

              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, stockFilter: 'critical_only' }))}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between cursor-pointer ${
                  config.stockFilter === 'critical_only'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <p className="font-bold">⚠️ Apenas Críticos / Baixos</p>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Apenas itens abaixo do estoque mínimo
                  </p>
                </div>
                {config.stockFilter === 'critical_only' && <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />}
              </button>

              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, stockFilter: 'zero_only' }))}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between cursor-pointer ${
                  config.stockFilter === 'zero_only'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <p className="font-bold">🚨 Apenas Itens Zerados</p>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Itens que acabaram totalmente no estoque
                  </p>
                </div>
                {config.stockFilter === 'zero_only' && <Check className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
              </button>
            </div>
          </div>

          {/* 2. Seção de Lanches & Fichas Técnicas */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-bold text-slate-800">
                  Seção de Lanches & Pratos (Fichas Técnicas)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.includeRecipes}
                  onChange={() => handleToggle('includeRecipes')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {config.includeRecipes
                ? 'Os lanches cadastrados e pratos compostos serão incluídos no relatório.'
                : 'Os lanches serão ocultados do relatório, exportando apenas os insumos e matérias-primas.'}
            </p>
          </div>

          {/* 3. Colunas e Informações a Exibir */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span>Colunas & Informações Visíveis</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Quantidade */}
              <button
                type="button"
                onClick={() => handleToggle('showQuantity')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  config.showQuantity ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Mostrar Quantidade Atual</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${config.showQuantity ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {config.showQuantity && <Check className="w-3 h-3" />}
                </div>
              </button>

              {/* Estoque Mínimo */}
              <button
                type="button"
                onClick={() => handleToggle('showMinStock')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  config.showMinStock ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Mostrar Estoque Mínimo</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${config.showMinStock ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {config.showMinStock && <Check className="w-3 h-3" />}
                </div>
              </button>

              {/* Preços e Valores */}
              <button
                type="button"
                onClick={() => handleToggle('showCostPrice')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  config.showCostPrice ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preço de Custo / Valor</span>
                </div>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${config.showCostPrice ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {config.showCostPrice && <Check className="w-3 h-3" />}
                </div>
              </button>

              {/* Situação / Status */}
              <button
                type="button"
                onClick={() => handleToggle('showStatus')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  config.showStatus ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Status (Normal/Baixo/Zerado)</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${config.showStatus ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {config.showStatus && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>
          </div>

          {/* 4. Seções em Destaque */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Seções Especiais no Relatório</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleToggle('includeSummaryBox')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  config.includeSummaryBox ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Quadro Resumo no Topo</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${config.includeSummaryBox ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {config.includeSummaryBox && <Check className="w-3 h-3" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggle('includeCriticalSection')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                  config.includeCriticalSection ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 font-semibold' : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <span>Destaque de Estoque Crítico</span>
                <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${config.includeCriticalSection ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                  {config.includeCriticalSection && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveAsDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedSuccess ? '✅ Salvo como padrão!' : 'Salvar como padrão'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onGenerateWhatsApp && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>
            )}

            {onGeneratePDF && (
              <button
                type="button"
                onClick={handlePDFClick}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>📄 Gerar PDF</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
