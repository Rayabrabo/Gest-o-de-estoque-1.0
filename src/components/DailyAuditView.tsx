import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  FileCheck, 
  AlertTriangle, 
  X, 
  MessageSquare, 
  Minus, 
  Plus, 
  RotateCcw, 
  Filter, 
  Circle,
  ShoppingCart,
  Download,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { Product, AuditRecord, AuditItem, SystemSettings, PurchaseItem, ReportExportConfig, Unit } from '../types';
import { TextExportService } from '../services/textExportService';
import { PdfService } from '../services/pdfService';
import { StorageService } from '../services/storageService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { AddToCartModal } from './AddToCartModal';
import { ReportConfigModal } from './ReportConfigModal';

interface DailyAuditViewProps {
  products: Product[];
  currentAudit?: AuditRecord | null;
  settings: SystemSettings;
  shoppingList?: PurchaseItem[];
  onSaveAudit: (audit: AuditRecord, applyToStock: boolean) => void;
  onResetAudit?: () => void;
  onAddToCart?: (
    productId: string, 
    quantity: number,
    customFields?: {
      unit?: Unit;
      costPrice?: number;
      category?: string;
    }
  ) => void;
  onRemoveFromCart?: (productId: string) => void;
  onNavigateToReports?: () => void;
}

export const DailyAuditView: React.FC<DailyAuditViewProps> = ({
  products,
  settings,
  shoppingList = [],
  onSaveAudit,
  onResetAudit,
  onAddToCart,
  onRemoveFromCart,
  onNavigateToReports
}) => {
  // Helper to build initial audit items merging draft with active products
  const buildInitialAuditItems = (): AuditItem[] => {
    const sortedProducts = StorageService.sortByCategoryOrder(products, settings);
    const draft = StorageService.getAuditDraft() || [];

    return sortedProducts.map(p => {
      const existing = draft.find(item => item.productId === p.id);
      const costPrice = p.costPrice ?? p.price;
      const sellPrice = p.sellPrice;

      if (existing) {
        return {
          ...existing,
          productName: p.name,
          category: p.category,
          unit: p.unit,
          registeredQuantity: p.quantity,
          minStock: p.minStock,
          price: costPrice,
          costPrice,
          sellPrice
        };
      }

      return {
        productId: p.id,
        productName: p.name,
        category: p.category,
        unit: p.unit,
        registeredQuantity: p.quantity,
        countedQuantity: p.quantity,
        isAudited: false,
        minStock: p.minStock,
        price: costPrice,
        costPrice,
        sellPrice
      };
    });
  };

  const [auditItems, setAuditItems] = useState<AuditItem[]>(buildInitialAuditItems);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'audited'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productForCart, setProductForCart] = useState<Product | null>(null);
  const [lastSavedRecord, setLastSavedRecord] = useState<AuditRecord | null>(null);

  // Synchronize audit items strictly with active products in category priority order while preserving counts
  useEffect(() => {
    const sortedProducts = StorageService.sortByCategoryOrder(products, settings);
    const draft = StorageService.getAuditDraft();

    setAuditItems(prev => {
      const reference = prev.length > 0 ? prev : (draft || []);
      const updated = sortedProducts.map(p => {
        const existing = reference.find(item => item.productId === p.id);
        const costPrice = p.costPrice ?? p.price;
        const sellPrice = p.sellPrice;
        if (existing) {
          return {
            ...existing,
            productName: p.name,
            category: p.category,
            unit: p.unit,
            registeredQuantity: p.quantity,
            minStock: p.minStock,
            price: costPrice,
            costPrice,
            sellPrice
          };
        }
        return {
          productId: p.id,
          productName: p.name,
          category: p.category,
          unit: p.unit,
          registeredQuantity: p.quantity,
          countedQuantity: p.quantity,
          isAudited: false,
          minStock: p.minStock,
          price: costPrice,
          costPrice,
          sellPrice
        };
      });

      // Persist draft in storage
      StorageService.saveAuditDraft(updated);
      return updated;
    });
  }, [products, settings]);

  const auditedCount = auditItems.filter(i => i.isAudited).length;
  const totalCount = auditItems.length;
  const pendingCount = totalCount - auditedCount;
  const progressPercent = totalCount > 0 ? Math.round((auditedCount / totalCount) * 100) : 0;

  const categories = useMemo(() => {
    return StorageService.getOrderedCategories(
      settings,
      Array.from(new Set(products.map(p => p.category)))
    );
  }, [products, settings]);

  const filteredItems = useMemo(() => {
    return auditItems.filter(item => {
      if (statusFilter === 'pending' && item.isAudited) return false;
      if (statusFilter === 'audited' && !item.isAudited) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      return true;
    });
  }, [auditItems, statusFilter, selectedCategory]);

  const updateItemsAndDraft = (updater: (prev: AuditItem[]) => AuditItem[]) => {
    setAuditItems(prev => {
      const next = updater(prev);
      StorageService.saveAuditDraft(next);
      return next;
    });
  };

  const handleToggleAudited = (productId: string) => {
    updateItemsAndDraft(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          isAudited: !item.isAudited
        };
      }
      return item;
    }));
  };

  const handleUpdateCounted = (productId: string, val: number) => {
    const safeVal = isNaN(val) ? 0 : Math.max(0, val);
    updateItemsAndDraft(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          countedQuantity: safeVal,
          isAudited: true // auto-check when user modifies counted quantity
        };
      }
      return item;
    }));
  };

  const handleStepQuantity = (productId: string, delta: number) => {
    updateItemsAndDraft(prev => prev.map(item => {
      if (item.productId === productId) {
        const current = item.countedQuantity ?? item.registeredQuantity;
        const newQty = Math.max(0, Math.round((current + delta) * 100) / 100);
        return {
          ...item,
          countedQuantity: newQty,
          isAudited: true
        };
      }
      return item;
    }));
  };

  const handleResetToSystem = (productId: string) => {
    updateItemsAndDraft(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          countedQuantity: item.registeredQuantity,
          isAudited: true
        };
      }
      return item;
    }));
  };

  const handleMarkAllAudited = () => {
    updateItemsAndDraft(prev => prev.map(item => ({
      ...item,
      isAudited: true
    })));
  };

  const handleUnmarkAllAudited = () => {
    updateItemsAndDraft(prev => prev.map(item => ({
      ...item,
      isAudited: false,
      countedQuantity: item.registeredQuantity
    })));
  };

  const createSnapshotRecord = (isCompleted: boolean, appliedToStock: boolean): AuditRecord => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const changes = auditItems
      .filter(item => item.isAudited && item.countedQuantity !== null && item.countedQuantity !== item.registeredQuantity)
      .map(item => ({
        productId: item.productId,
        productName: item.productName,
        oldQty: item.registeredQuantity,
        newQty: item.countedQuantity!,
        diff: item.countedQuantity! - item.registeredQuantity,
        unit: item.unit
      }));

    return {
      id: `audit-${Date.now()}`,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      items: auditItems,
      isCompleted,
      appliedToStock,
      totalProducts: totalCount,
      auditedCount,
      changes
    };
  };

  const handleGenerateAuditPDF = (record?: AuditRecord, customConfig?: Partial<ReportExportConfig>) => {
    const targetRecord = record || lastSavedRecord || createSnapshotRecord(false, false);
    PdfService.generateAuditReport(targetRecord, products, settings, customConfig);
  };

  const handleFinalizeConfirm = (applyToStock: boolean) => {
    const newRecord = createSnapshotRecord(true, applyToStock);
    setLastSavedRecord(newRecord);
    onSaveAudit(newRecord, applyToStock);
    StorageService.clearAuditDraft(); // Clear in-progress draft after successful completion
    setShowFinalizeModal(false);

    // Generate WhatsApp text for easy copying/sharing
    const txt = TextExportService.generateAuditText(newRecord, settings);
    setShareText(txt);
    setIsShareModalOpen(true);
  };

  const handleGenerateCurrentText = (customConfig?: Partial<ReportExportConfig>) => {
    const currentRecord = createSnapshotRecord(false, false);
    const txt = TextExportService.generateAuditText(currentRecord, settings, customConfig);
    setShareText(txt);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-10">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            <span>CONFERÊNCIA DE ESTOQUE</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contagem física dos produtos para atualizar o estoque do sistema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Configurações do Relatório */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            title="Configurar opções de exibição do PDF e WhatsApp"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          {/* Quick PDF Report button */}
          <button
            onClick={() => handleGenerateAuditPDF()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold rounded-xl text-xs border border-indigo-200 transition-colors cursor-pointer"
            title="Gerar e Baixar PDF da Conferência"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Relatório PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            onClick={handleGenerateCurrentText}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs border border-emerald-200 transition-colors cursor-pointer"
            title="Copiar resumo atual em texto para WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Texto WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>

          {onNavigateToReports && (
            <button
              onClick={onNavigateToReports}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              title="Abrir Central de Relatórios"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Relatórios</span>
            </button>
          )}

          <button
            onClick={handleMarkAllAudited}
            className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            title="Marcar todos como conferidos"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Marcar Todos</span>
            <span className="sm:hidden">Todos</span>
          </button>

          <button
            onClick={handleUnmarkAllAudited}
            className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            title="Desmarcar conferências e restaurar contagem"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Desmarcar</span>
          </button>

          <button
            onClick={() => setShowFinalizeModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition-all text-xs sm:text-sm active:scale-95 shrink-0 cursor-pointer ml-auto sm:ml-0"
          >
            <FileCheck className="w-4 h-4" />
            <span>FINALIZAR</span>
          </button>
        </div>
      </div>

      {/* Compact Progress Bar Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              PROGRESSO: <span className="text-emerald-600 font-extrabold">{progressPercent}%</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 font-medium">
              {auditedCount}/{totalCount} conferidos
            </span>
            {pendingCount > 0 && (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Hoje: {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('audited')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'audited'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Conferidos ({auditedCount})
          </button>
        </div>

        {/* Category dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Audit Checklist Items */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <p className="text-sm font-medium text-slate-500">
              {statusFilter === 'pending' ? '🎉 Todos os produtos foram conferidos!' : 'Nenhum produto encontrado neste filtro.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isAudited = item.isAudited;
            const currentCount = item.countedQuantity ?? item.registeredQuantity;
            const diff = Math.round((currentCount - item.registeredQuantity) * 100) / 100;
            const hasDifference = diff !== 0;
            const productObj = products.find(p => p.id === item.productId);
            const cartItem = shoppingList?.find(ci => ci.productId === item.productId && !ci.isPurchased);

            return (
              <div
                key={item.productId}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                  isAudited 
                    ? 'bg-white border-emerald-300/80 shadow-xs' 
                    : 'bg-white border-slate-200/90 shadow-xs'
                }`}
              >
                {/* Header Row: Product Name, Category & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-slate-400 mt-0.5 shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug break-words">
                          {item.productName}
                        </h4>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>Sistema: <strong className="text-slate-800">{item.registeredQuantity} {item.unit}</strong></span>
                        {productObj && (
                          <span className="hidden sm:inline text-slate-400">
                            (Mín: {productObj.minStock} {item.unit})
                          </span>
                        )}
                        {isAudited && hasDifference && (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            diff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {diff > 0 ? `+${diff}` : diff} {item.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Add to Shopping Cart Button */}
                    {productObj && !productObj.isRecipe && (
                      <button
                        type="button"
                        onClick={() => setProductForCart(productObj)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                          cartItem
                            ? 'bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200 shadow-2xs'
                            : 'bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100'
                        }`}
                        title={cartItem ? `No carrinho (${cartItem.suggestedQuantity} ${item.unit}). Clique para alterar.` : 'Adicionar ao Carrinho de Compras'}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />
                        <span>{cartItem ? `${cartItem.suggestedQuantity} ${item.unit}` : '+ Carrinho'}</span>
                      </button>
                    )}

                    {/* Compact Status Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAudited(item.productId)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer active:scale-95 ${
                        isAudited
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title={isAudited ? 'Clique para desmarcar' : 'Clique para marcar como conferido'}
                    >
                      {isAudited ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                          <span>Conferido</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3 h-3 text-slate-400 stroke-[2]" />
                          <span>Pendente</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile-Friendly Quantity Stepper & Quick Adjustment Controls */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600 shrink-0">
                      Contado:
                    </span>
                    
                    {/* Stepper with - / + touch buttons */}
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item.productId, -1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold border-r border-slate-200 cursor-pointer transition-colors"
                        title="Diminuir 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={item.countedQuantity ?? ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateCounted(item.productId, parseFloat(e.target.value))}
                        className="w-16 sm:w-20 h-9 sm:h-8 px-1 text-center font-extrabold text-sm text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item.productId, 1)}
                        className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold border-l border-slate-200 cursor-pointer transition-colors"
                        title="Aumentar 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-slate-500">
                      {item.unit}
                    </span>
                  </div>

                  {/* Quick step chips for easy mobile tapping */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(item.productId, -5)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      title="Diminuir 5"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(item.productId, 5)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      title="Aumentar 5"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetToSystem(item.productId)}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Copiar quantidade do sistema"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>= Sistema</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Finalize Audit Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>FINALIZAR CONFERÊNCIA</span>
              </div>
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning if items remain un-audited */}
            {pendingCount > 0 ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Atenção: Produtos Pendentes
                </p>
                <p>
                  Existem <strong>{pendingCount} produtos</strong> que não foram conferidos nesta sessão.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
                <p className="font-bold flex items-center gap-1 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Todos os produtos conferidos!
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Conferência finalizada. Deseja atualizar o estoque do sistema com os valores informados?
            </p>

            {/* Direct Report & Export Options */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                📄 Gerar Relatórios Desta Conferência:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateAuditPDF()}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Baixar arquivo PDF da conferência"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Baixar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateCurrentText()}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title="Gerar texto para WhatsApp"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Texto WhatsApp</span>
                </button>
              </div>

              {onNavigateToReports && (
                <button
                  type="button"
                  onClick={() => {
                    setShowFinalizeModal(false);
                    onNavigateToReports();
                  }}
                  className="w-full text-center text-xs text-emerald-700 hover:text-emerald-800 font-semibold pt-1 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Central de Relatórios Gerais</span>
                </button>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleFinalizeConfirm(true)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ATUALIZAR ESTOQUE & CONCLUIR</span>
              </button>

              <button
                onClick={() => handleFinalizeConfirm(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                SALVAR SEM ALTERAR ESTOQUE
              </button>

              <button
                onClick={() => setShowFinalizeModal(false)}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Voltar e continuar conferindo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Configuration Modal */}
      {isConfigModalOpen && (
        <ReportConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          settings={settings}
          onGeneratePDF={(cfg) => handleGenerateAuditPDF(undefined, cfg)}
          onGenerateWhatsApp={(cfg) => handleGenerateCurrentText(cfg)}
        />
      )}

      {/* WhatsApp Share Modal */}
      {shareText && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="CONFERÊNCIA CONCLUÍDA — COPIAR PARA WHATSAPP"
          subtitle="O texto da conferência foi gerado com sucesso. Copie ou envie diretamente pelo WhatsApp."
          textToShare={shareText}
          onDownloadPdf={() => handleGenerateAuditPDF()}
        />
      )}

      {/* Add To Cart Modal */}
      {productForCart && (
        <AddToCartModal
          isOpen={!!productForCart}
          product={productForCart}
          currentPurchaseItem={shoppingList.find(item => item.productId === productForCart.id)}
          onClose={() => setProductForCart(null)}
          onAddToCart={(id, qty, customFields) => {
            onAddToCart?.(id, qty, customFields);
            setProductForCart(null);
          }}
          onRemoveFromCart={(id) => {
            onRemoveFromCart?.(id);
            setProductForCart(null);
          }}
        />
      )}
    </div>
  );
};

