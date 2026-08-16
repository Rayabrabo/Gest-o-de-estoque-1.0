import React from 'react';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ShoppingCart, 
  DollarSign, 
  ClipboardCheck, 
  ArrowRight,
  Plus,
  TrendingDown,
  Clock,
  Utensils
} from 'lucide-react';
import { Product, AuditRecord, TabType, SystemSettings } from '../types';
import { StorageService } from '../services/storageService';
import { getThemeConfig } from '../utils/themeUtils';

interface DashboardViewProps {
  products: Product[];
  latestAudit: AuditRecord | null;
  settings: SystemSettings;
  onNavigateTab: (tab: TabType) => void;
  onAddProduct: () => void;
  onDischargeRecipe?: (recipe: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  latestAudit,
  settings,
  onNavigateTab,
  onAddProduct,
  onDischargeRecipe
}) => {
  const showPrices = settings.showPrices !== false;
  const rawProducts = products.filter(p => !p.isRecipe);
  const recipeProducts = products.filter(p => p.isRecipe);

  const totalProducts = products.length;
  const normalProducts = rawProducts.filter(p => p.quantity > p.minStock).length;
  const nearMinProducts = rawProducts.filter(p => p.quantity <= p.minStock && p.quantity > 0).length;
  const belowMinProducts = rawProducts.filter(p => p.quantity <= 0).length;

  const totalShoppingItems = rawProducts.filter(p => p.quantity <= p.minStock).length;
  const totalValuation = rawProducts.reduce((acc, p) => acc + (p.quantity * (p.price || 0)), 0);

  // Today's Audit Metrics (strictly for active products)
  const auditedCount = latestAudit 
    ? products.filter(p => latestAudit.items.some(i => i.productId === p.id && i.isAudited)).length 
    : 0;
  const pendingCount = totalProducts - auditedCount;
  const auditPercent = totalProducts > 0 
    ? Math.round((auditedCount / totalProducts) * 100) 
    : 0;

  const lastAuditDateStr = latestAudit 
    ? `${latestAudit.date} às ${latestAudit.time}`
    : 'Nenhuma conferência recente';

  // Urgent attention items (only raw ingredients)
  const alertItems = rawProducts
    .filter(p => p.quantity <= p.minStock)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  const theme = getThemeConfig(settings);

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            {settings.logoUrl && (
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 overflow-hidden hidden sm:flex">
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <div className={`inline-flex items-center gap-2 ${theme.classes.activeNavBg} ${theme.classes.activeNavText} px-3 py-1 rounded-full text-xs font-medium mb-2 border ${theme.classes.activeNavBorder}`}>
                <span className={`w-2 h-2 rounded-full ${theme.classes.badgeBg} animate-pulse`} />
                <span>{settings.companyName || 'Painel de Controle de Estoque'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Visão Geral do Estoque</h2>
              <p className="text-sm text-slate-300 mt-1">
                Acompanhe o status do inventário, fichas técnicas de lanches, conferências diárias e lista de compras.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onAddProduct}
              className={`flex items-center gap-2 ${theme.classes.btnPrimary} font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95 cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              <span>+ ADICIONAR ITEM</span>
            </button>

            <button
              onClick={() => onNavigateTab('recipes')}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95 cursor-pointer"
            >
              <Utensils className="w-4 h-4" />
              <span>LANCHES & FICHAS</span>
            </button>

            <button
              onClick={() => onNavigateTab('audit')}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl border border-slate-700 shadow-sm transition-all text-sm cursor-pointer"
            >
              <ClipboardCheck className={`w-4 h-4 ${theme.classes.activeNavText}`} />
              <span>CONFERIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {/* Total Products */}
        <div 
          onClick={() => onNavigateTab('stock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Insumos</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{rawProducts.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ingredientes / Itens</p>
        </div>

        {/* Recipes Count */}
        <div 
          onClick={() => onNavigateTab('recipes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Lanches</span>
            <div className="p-2 rounded-lg bg-orange-50 text-orange-600 group-hover:scale-110 transition-transform">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-2">{recipeProducts.length}</p>
          <p className="text-[11px] text-orange-600 mt-0.5">🍔 Fichas Técnicas</p>
        </div>

        {/* Near Min Stock */}
        <div 
          onClick={() => onNavigateTab('stock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Próximo Mín.</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{nearMinProducts}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">🟡 Atenção requerida</p>
        </div>

        {/* Below Min Stock */}
        <div 
          onClick={() => onNavigateTab('stock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Abaixo Mín.</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{belowMinProducts}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">🔴 Crítico / Zerado</p>
        </div>

        {/* Shopping List Items */}
        <div 
          onClick={() => onNavigateTab('shopping')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Compras</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">{totalShoppingItems}</p>
          <p className="text-[11px] text-purple-600 mt-0.5">🛒 Na lista de compras</p>
        </div>

        {/* Audit Progress */}
        <div 
          onClick={() => onNavigateTab('audit')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Conferência</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-teal-700 mt-2">{auditPercent}%</p>
          <p className="text-[11px] text-teal-600 mt-0.5">✅ Concluído hoje</p>
        </div>
      </div>

      {/* Recipes Quick Discharge Section */}
      {recipeProducts.length > 0 && (
        <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-orange-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-lg text-slate-900">🍔 Lanches & Fichas Técnicas (Baixa Automática)</h3>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Venda um lanche e o sistema desconta automaticamente hambúrguer, pão, queijo e outros insumos do estoque.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('recipes')}
              className="text-xs font-bold text-orange-800 hover:text-orange-950 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <span>Gerenciar Fichas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recipeProducts.map(recipe => {
              const maxPossible = StorageService.calculateRecipeMaxStock(recipe, products);
              const cost = StorageService.calculateRecipeUnitCost(recipe, products);

              return (
                <div key={recipe.id} className="bg-white p-4 rounded-xl border border-orange-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{recipe.name}</h4>
                        <span className="text-[11px] text-slate-500">{recipe.category}</span>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                        maxPossible > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {maxPossible > 0 ? `${maxPossible} disponíveis` : 'Sem estoque'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between">
                        <span>Custo dos Insumos:</span>
                        <span className="font-bold text-slate-800">R$ {cost.toFixed(2).replace('.', ',')}</span>
                      </div>
                      {recipe.sellPrice && recipe.sellPrice > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Preço de Venda:</span>
                          <span>R$ {recipe.sellPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      {recipe.ingredients?.length || 0} insumos configurados
                    </span>

                    {onDischargeRecipe && (
                      <button
                        onClick={() => onDischargeRecipe(recipe)}
                        disabled={maxPossible <= 0}
                        className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Vender / Baixar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estimated Stock Total Valuation Banner */}
      {showPrices && (
        <div className="bg-emerald-950 text-emerald-100 p-4 md:p-5 rounded-2xl border border-emerald-800/60 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-300 uppercase tracking-wider">Valor Estimado do Estoque de Insumos</p>
              <p className="text-2xl md:text-3xl font-extrabold text-white mt-0.5">
                R$ {totalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="text-xs text-emerald-300/80 bg-emerald-900/50 px-3 py-2 rounded-xl border border-emerald-800/40">
            Cálculo baseado na Quantidade × Preço Unitário de Insumos
          </div>
        </div>
      )}

      {/* Daily Audit Callout Card ("CONFERÊNCIA DE HOJE") */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-slate-800">CONFERÊNCIA DE HOJE</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Última conferência: <span className="font-semibold text-slate-700">{lastAuditDateStr}</span>
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('audit')}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all text-sm active:scale-95"
          >
            <span>CONFERIR ESTOQUE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Audit Stats Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Produtos Conferidos</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{auditedCount} <span className="text-sm font-normal text-slate-400">/ {totalProducts}</span></p>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${auditPercent}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Produtos Pendentes</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-amber-700 mt-3 font-medium">
              {pendingCount > 0 ? '⚠️ Requer conferência diária' : '✅ Todos conferidos!'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Progresso da Conferência</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{auditPercent}%</p>
            <p className="text-[11px] text-slate-500 mt-3">
              {auditedCount} de {totalProducts} produtos validados
            </p>
          </div>
        </div>
      </div>

      {/* Urgent Replenishment / Alert Items List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-base text-slate-800">Insumos com Estoque Crítico ou Próximo ao Mínimo</h3>
          </div>
          <button
            onClick={() => onNavigateTab('shopping')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Ver Lista de Compras <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {alertItems.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tudo sob controle!</p>
            <p className="text-xs text-slate-500 mt-0.5">Nenhum insumo está com estoque abaixo ou próximo do mínimo.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alertItems.map(item => {
              const isZero = item.quantity <= 0;
              const percentOfMin = Math.round((item.quantity / item.minStock) * 100);

              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800 truncate">{item.name}</span>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atual: <span className="font-bold text-slate-700">{item.quantity} {item.unit}</span> | Mínimo: {item.minStock} {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        isZero 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isZero ? '🔴 COMPRAR' : `🟡 ${percentOfMin}% do mínimo`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
