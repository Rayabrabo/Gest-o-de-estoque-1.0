import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  ShieldAlert, 
  Save, 
  X, 
  Database,
  Building,
  Layers,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Check,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { DEFAULT_CATEGORIES, SystemSettings, ThemeColor, ThemeMode } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { StorageService } from '../services/storageService';
import { THEME_PALETTES, ThemeDefinition } from '../utils/themeUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonStr: string) => boolean;
  onRestoreSampleData: () => void;
  onResetAll: () => void;
  existingCategories?: string[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onRestoreSampleData,
  onResetAll,
  existingCategories = []
}) => {
  const [appName, setAppName] = useState(settings.appName || 'Gestão de Estoque');
  const [companyName, setCompanyName] = useState(settings.companyName || 'Meu Estabelecimento');
  const [safetyDays, setSafetyDays] = useState(settings.safetyDays || 7);
  const [showPrices, setShowPrices] = useState(settings.showPrices !== false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(settings.logoUrl);
  const [themeColor, setThemeColor] = useState<ThemeColor>(settings.themeColor || 'emerald');
  const [themeMode, setThemeMode] = useState<ThemeMode>(settings.themeMode || 'light');
  const [logoInputUrl, setLogoInputUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => 
    StorageService.getOrderedCategories(settings, existingCategories)
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const currentTheme = THEME_PALETTES[themeColor] || THEME_PALETTES.emerald;

  // Handle local image file upload & resize via canvas
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize down to max 320x320 to keep storage small and fast
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
          setLogoUrl(compressedDataUrl);
        } else {
          setLogoUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (logoInputUrl.trim()) {
      setLogoUrl(logoInputUrl.trim());
      setLogoInputUrl('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const list = [...categoryOrder];
    const item = list[index];
    if (direction === 'up' && index > 0) {
      list.splice(index, 1);
      list.splice(index - 1, 0, item);
    } else if (direction === 'down' && index < list.length - 1) {
      list.splice(index, 1);
      list.splice(index + 1, 0, item);
    }
    setCategoryOrder(list);
  };

  const handleResetCategories = () => {
    const defaultList = StorageService.getOrderedCategories(
      { ...settings, categoryOrder: DEFAULT_CATEGORIES },
      existingCategories
    );
    setCategoryOrder(defaultList);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      appName: appName.trim(),
      companyName: companyName.trim(),
      safetyDays: Math.max(1, safetyDays),
      showPrices,
      categoryOrder,
      logoUrl,
      themeColor,
      themeMode
    });
    onClose();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = onImportBackup(content);
        if (success) {
          setImportStatus('✅ Dados importados com sucesso! Recarregando...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          setImportStatus('❌ Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg ${currentTheme.classes.btnPrimary} flex items-center justify-center`}>
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">PERSONALIZAÇÃO & CONFIGURAÇÕES</h3>
              <p className="text-[11px] text-slate-400">Logotipo, tema de cores, empresa e dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* 1. SEÇÃO DE LOGOTIPO / IDENTIDADE VISUAL */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ImageIcon className={`w-4 h-4 ${currentTheme.classes.textAccent}`} />
                  <span>Logotipo da Sua Empresa</span>
                </h4>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remover Logo</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 shadow-xs overflow-hidden">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Logo Preview" 
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-2xl">📦</span>
                        <span className="text-[9px] text-slate-400 font-bold mt-0.5">Sem Logo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload & Options Controls */}
                <div className="flex-1 space-y-2 w-full">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sua logo aparecerá no cabeçalho, na barra lateral e nos relatórios PDF emitidos.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoUrl ? 'Trocar Imagem' : 'Escolher do Celular/PC'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      {showUrlInput ? 'Ocultar Link' : 'Colar Link URL'}
                    </button>

                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                    />
                  </div>

                  {showUrlInput && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="url"
                        placeholder="https://suaempresa.com/logo.png"
                        value={logoInputUrl}
                        onChange={(e) => setLogoInputUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyLogoUrl}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. SEÇÃO DE TEMA DE CORES & PALETAS */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Palette className={`w-4 h-4 ${currentTheme.classes.textAccent}`} />
                  <span>Tema & Paleta de Cores</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  {currentTheme.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {(Object.values(THEME_PALETTES) as ThemeDefinition[]).map((palette) => {
                  const isSelected = themeColor === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setThemeColor(palette.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white bg-white dark:bg-slate-900 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-4 h-4 rounded-full shadow-2xs border border-white"
                            style={{ backgroundColor: palette.hex }}
                          />
                          <span className="text-sm">{palette.emoji}</span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {palette.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-1">
                          {palette.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. MODO DE APARÊNCIA (CLARO / ESCURO) */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${currentTheme.classes.textAccent}`} />
                <span>Modo de Exibição</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    themeMode === 'light'
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white bg-white dark:bg-slate-900 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div className="text-left">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Modo Claro</div>
                    <div className="text-[10px] text-slate-500">Visual limpo e brilhante</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    themeMode === 'dark'
                      ? 'border-slate-900 dark:border-white ring-2 ring-slate-900 dark:ring-white bg-white dark:bg-slate-900 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <div className="text-left">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Modo Escuro</div>
                    <div className="text-[10px] text-slate-500">Ideal para cozinha e bares</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. DADOS DO SISTEMA E EMPRESA */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building className={`w-4 h-4 ${currentTheme.classes.textAccent}`} />
                <span>Dados do Sistema & Empresa</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Aplicativo
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Estabelecimento / Empresa (aparece nos relatórios PDF)
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dias de Segurança Padrão (Cálculo de Compras)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={safetyDays}
                  onChange={(e) => setSafetyDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-slate-500"
                />
              </div>

              {/* Toggle para Exibição de Valores e Preços */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrices}
                    onChange={(e) => setShowPrices(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Exibir Preços e Valores dos Produtos
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Quando desativado, oculta os valores em R$ nos cartões, tabelas do estoque, lista de compras e relatórios PDF.
                    </span>
                  </div>
                </label>
              </div>

              {/* Ordem de Exibição das Categorias */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${currentTheme.classes.textAccent}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Ordem das Categorias (PDFs & Listas)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCategories}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Padrão</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ajuste a ordem em que as categorias aparecem no PDF e na listagem de compras:
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {categoryOrder.map((cat, idx) => (
                    <div 
                      key={cat}
                      className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{cat}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategory(idx, 'up')}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Subir categoria"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categoryOrder.length - 1}
                          onClick={() => moveCategory(idx, 'down')}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Descer categoria"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl ${currentTheme.classes.btnPrimary} font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95`}
            >
              <Save className="w-4 h-4" />
              <span>SALVAR TEMA E CONFIGURAÇÕES</span>
            </button>
          </form>

          {/* Backup & Data Controls */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-600" />
              <span>Backup e Importação de Dados</span>
            </h4>

            {importStatus && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                {importStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onExportBackup}
                className="flex items-center justify-center gap-2 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar Backup (JSON)</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer">
                <Upload className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                <span>Importar Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset & Safety Area */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Zona de Segurança</span>
            </h4>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowRestoreConfirm(true)}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Produtos de Teste (Exemplo)</span>
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>LIMPAR E ZERAR TODO O BANCO DE DADOS</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRestoreConfirm}
        title="RESTAURAR DADOS DE EXEMPLO"
        message="Deseja recarregar a lista inicial de produtos de teste? Os produtos de exemplo serão adicionados ao estoque."
        confirmLabel="RESTAURAR DADOS"
        isDanger={false}
        onConfirm={() => {
          onRestoreSampleData();
          setShowRestoreConfirm(false);
          onClose();
        }}
        onCancel={() => setShowRestoreConfirm(false)}
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        title="ZERAR BANCO DE DADOS"
        message="ATENÇÃO: Tem certeza absoluta que deseja apagar TODOS os produtos, conferências e histórico do sistema? Esta ação é irreversível."
        confirmLabel="APAGAR TUDO E ZERAR"
        isDanger={true}
        onConfirm={() => {
          onResetAll();
          setShowResetConfirm(false);
          onClose();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
