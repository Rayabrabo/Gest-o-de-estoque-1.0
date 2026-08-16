import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Utensils, 
  DollarSign,
  Package,
  Search,
  Sparkles,
  ArrowDownRight,
  Zap,
  Check
} from 'lucide-react';
import { Product, RecipeSaleRecord, SystemSettings } from '../types';
import { StorageService } from '../services/storageService';
import { RecipeDischargeModal } from './RecipeDischargeModal';

interface RecipeListViewProps {
  products: Product[];
  settings: SystemSettings;
  recipeSales: RecipeSaleRecord[];
  onAddRecipe: () => void;
  onEditRecipe: (recipe: Product) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onConfirmDischarge: (recipe: Product, quantity: number, notes?: string) => void;
}

export const RecipeListView: React.FC<RecipeListViewProps> = ({
  products,
  settings,
  recipeSales,
  onAddRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onConfirmDischarge
}) => {
  const [search, setSearch] = useState('');
  const [selectedRecipeForDischarge, setSelectedRecipeForDischarge] = useState<Product | null>(null);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<Record<string, boolean>>({});
  const [quickFeedbackId, setQuickFeedbackId] = useState<string | null>(null);

  const showPrices = settings.showPrices !== false;
  const rawProducts = products.filter(p => !p.isRecipe);
  const recipes = products.filter(p => p.isRecipe);

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedRecipeIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleQuickSale = (recipe: Product, qty: number) => {
    onConfirmDischarge(recipe, qty, 'Venda Rápida');
    setQuickFeedbackId(`${recipe.id}-${qty}`);
    setTimeout(() => {
      setQuickFeedbackId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <Utensils className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                LANCHES & FICHAS TÉCNICAS
              </h2>
              <p className="text-xs text-slate-500">
                Selecione os insumos do estoque para criar lanches. Ao lançar saídas, o estoque é descontado automaticamente!
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAddRecipe}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-md transition-all text-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ CRIAR NOVO LANCHE / RECEITA</span>
          </button>
        </div>
      </div>

      {/* Hero Explanation Card */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-orange-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden border border-orange-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-orange-500/30 text-orange-300 border border-orange-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Baixa em Cascata de Insumos</span>
            </div>
            <h3 className="text-lg font-black tracking-tight">Como funciona o controle de lanches?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. Clique em <strong>"+ CRIAR NOVO LANCHE"</strong> e selecione os insumos do seu estoque (pão, carne, cheddar, bacon).<br />
              2. Quando sair uma venda, digite quantos lanches saíram ou clique nos botões rápidos.<br />
              3. Todos os ingredientes são descontados instantaneamente do estoque!
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => {
                if (recipes.length > 0) {
                  setSelectedRecipeForDischarge(recipes[0]);
                } else {
                  onAddRecipe();
                }
              }}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-5 py-3 rounded-xl shadow-md text-sm transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-5 h-5 text-slate-950" />
              <span>LANÇAR SAÍDA / VENDA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar lanche ou receita por nome ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs font-medium"
        />
      </div>

      {/* Recipes Cards List */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
            <Utensils className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Nenhum lanche cadastrado ainda</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Cadastre a composição dos seus lanches para dar baixa automática em pães, carnes, queijos e embalagens a cada venda realizada.
            </p>
          </div>
          <button
            onClick={onAddRecipe}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CRIAR MEU PRIMEIRO LANCHE</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecipes.map(recipe => {
            const ingredients = recipe.ingredients || [];
            const isExpanded = !!expandedRecipeIds[recipe.id];
            const maxPossible = StorageService.calculateRecipeMaxStock(recipe, products);
            const unitCost = StorageService.calculateRecipeUnitCost(recipe, products);
            const sellPrice = recipe.sellPrice ?? recipe.price ?? 0;
            const profit = sellPrice - unitCost;
            const marginPercent = sellPrice > 0 ? ((profit / sellPrice) * 100).toFixed(0) : '0';

            return (
              <div 
                key={recipe.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-black text-slate-900 text-base">{recipe.name}</h3>
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {ingredients.length} insumos
                        </span>
                      </div>
                      <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium mt-1">
                        {recipe.category}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl border ${
                        maxPossible > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <span>Estoque: <strong>{maxPossible} un</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* Financial Mini Bar */}
                  {showPrices && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Custo Insumos</span>
                        <span className="font-extrabold text-slate-800">
                          R$ {unitCost.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Preço Venda</span>
                        <span className="font-black text-emerald-700">
                          R$ {sellPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Margem / Lucro</span>
                        <span className="font-extrabold text-slate-800">
                          {marginPercent}% (R$ {profit.toFixed(2).replace('.', ',')})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ingredientes / Ficha Técnica (Expandível) */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(recipe.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-orange-600 bg-slate-50/80 hover:bg-orange-50/60 p-2.5 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-orange-600" />
                        <span>Ver Insumos ({ingredients.length} itens descontados)</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 divide-y divide-slate-200 text-xs animate-in fade-in duration-150 space-y-1">
                        {ingredients.map((ing, idx) => {
                          const currentProduct = rawProducts.find(p => p.id === ing.ingredientId);
                          const currentStock = currentProduct ? currentProduct.quantity : 0;
                          return (
                            <div key={ing.ingredientId || idx} className="py-1.5 flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-800 truncate">
                                • {ing.ingredientName}
                              </span>
                              <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                                <span className="font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                  {ing.quantity} {ing.unit}
                                </span>
                                <span className="text-slate-400">
                                  (Estoque: {currentStock} {ing.unit})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Discharge Buttons (+1, +2, +5) */}
                  <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-200/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-orange-950 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-orange-600" />
                      <span>Saída rápida:</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 5].map(qty => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => handleQuickSale(recipe, qty)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-600 hover:text-white text-orange-900 border border-orange-200 font-extrabold text-xs rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          {quickFeedbackId === `${recipe.id}-${qty}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <span>+{qty} un</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4 gap-2">
                  <button
                    onClick={() => setSelectedRecipeForDischarge(recipe)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Lançar Saída / Venda</span>
                  </button>

                  <button
                    onClick={() => onEditRecipe(recipe)}
                    className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Editar Ficha Técnica"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir "${recipe.name}"?`)) {
                        onDeleteRecipe(recipe.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Excluir Lanche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico Recente de Baixas de Lanches */}
      {recipeSales.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 mt-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-black text-slate-900 text-base">
                ÚLTIMAS SAÍDAS DE LANCHES REGISTRADAS
              </h3>
            </div>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {recipeSales.length} registros
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {recipeSales.map(sale => (
              <div key={sale.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{sale.recipeName}</span>
                    <span className="bg-orange-100 text-orange-800 font-black px-2 py-0.5 rounded">
                      {sale.quantitySold}x baixados
                    </span>
                    {sale.notes && (
                      <span className="text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded">
                        {sale.notes}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    {sale.date} às {sale.time} • Descontados: {sale.deductions.map(d => `${d.deductedQuantity} ${d.unit} de ${d.ingredientName}`).join(', ')}
                  </p>
                </div>

                {showPrices && sale.totalAmount && (
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-sm block">
                      R$ {sale.totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                    {sale.profit && (
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        + R$ {sale.profit.toFixed(2).replace('.', ',')} lucro
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Baixa de Lanches */}
      <RecipeDischargeModal
        isOpen={!!selectedRecipeForDischarge}
        onClose={() => setSelectedRecipeForDischarge(null)}
        recipe={selectedRecipeForDischarge}
        allProducts={products}
        settings={settings}
        onConfirmDischarge={(recipe, qty, notes) => {
          onConfirmDischarge(recipe, qty, notes);
          setSelectedRecipeForDischarge(null);
        }}
      />
    </div>
  );
};
