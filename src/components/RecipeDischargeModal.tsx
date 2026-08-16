import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Minus, 
  Plus, 
  Layers, 
  ArrowRight,
  Flame,
  Check,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Product, RecipeIngredient, SystemSettings } from '../types';
import { StorageService } from '../services/storageService';

interface RecipeDischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Product | null;
  allProducts: Product[];
  settings: SystemSettings;
  onConfirmDischarge: (recipe: Product, quantity: number, notes?: string) => void;
}

export const RecipeDischargeModal: React.FC<RecipeDischargeModalProps> = ({
  isOpen,
  onClose,
  recipe,
  allProducts,
  settings,
  onConfirmDischarge
}) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const recipes = allProducts.filter(p => p.isRecipe);

  React.useEffect(() => {
    if (recipe) {
      setSelectedRecipeId(recipe.id);
    } else if (recipes.length > 0) {
      setSelectedRecipeId(recipes[0].id);
    }
    setQuantity(1);
    setNotes('');
    setIsSuccess(false);
  }, [recipe, isOpen]);

  if (!isOpen) return null;

  const currentRecipe = allProducts.find(p => p.id === selectedRecipeId) || recipe;

  if (!currentRecipe) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum Lanche / Receita Encontrado</h3>
          <p className="text-xs text-slate-500">
            Cadastre primeiro uma Ficha Técnica na aba "Lanches & Fichas" para realizar a baixa automática dos ingredientes.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const showPrices = settings.showPrices !== false;
  const ingredients: RecipeIngredient[] = currentRecipe.ingredients || [];
  const numQuantity = typeof quantity === 'number' ? quantity : (parseInt(quantity) || 1);

  // Max possible servings based on stock
  const maxPossible = StorageService.calculateRecipeMaxStock(currentRecipe, allProducts);
  const unitCost = StorageService.calculateRecipeUnitCost(currentRecipe, allProducts);
  const unitPrice = currentRecipe.sellPrice ?? currentRecipe.price ?? 0;

  const totalSale = unitPrice * numQuantity;
  const totalCost = unitCost * numQuantity;
  const totalProfit = totalSale - totalCost;

  // Check which ingredients have sufficient stock
  const ingredientStatus = ingredients.map(ing => {
    const rawProduct = allProducts.find(p => p.id === ing.ingredientId);
    const requiredTotal = Number((ing.quantity * numQuantity).toFixed(3));
    const currentStock = rawProduct ? rawProduct.quantity : 0;
    const isSufficient = currentStock >= requiredTotal;
    const remainingAfter = Number(Math.max(0, currentStock - requiredTotal).toFixed(3));

    return {
      ...ing,
      currentStock,
      requiredTotal,
      isSufficient,
      remainingAfter,
      unitCost: rawProduct?.costPrice ?? rawProduct?.price ?? ing.costPrice ?? 0
    };
  });

  const hasInsufficientStock = ingredientStatus.some(i => !i.isSufficient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQuantity <= 0 || !currentRecipe) return;

    onConfirmDischarge(currentRecipe, numQuantity, notes.trim() || undefined);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setQuantity(1);
      setNotes('');
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">
                LANÇAR SAÍDA / VENDA DE LANCHE
              </h3>
              <p className="text-xs text-slate-400">
                Desconto automático dos ingredientes da ficha técnica
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h4 className="text-xl font-black text-slate-900">Baixa Realizada com Sucesso!</h4>
            <p className="text-sm text-slate-600">
              Foram descontados os ingredientes de <strong>{numQuantity}x {currentRecipe.name}</strong> do estoque.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Lanche selecionado card / seletor */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider bg-orange-100 px-2 py-0.5 rounded-full">
                    Lanche / Ficha Técnica
                  </span>
                  {recipes.length > 1 ? (
                    <select
                      value={currentRecipe.id}
                      onChange={(e) => setSelectedRecipeId(e.target.value)}
                      className="mt-1 block w-full px-3 py-1.5 rounded-xl border border-slate-300 font-black text-slate-900 text-base bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <h4 className="font-black text-slate-900 text-lg mt-1">{currentRecipe.name}</h4>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    Composto por <strong>{ingredients.length} insumos</strong> cadastrados
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 block">Estoque Potencial:</span>
                  <span className={`text-base font-black px-2.5 py-1 rounded-xl inline-block mt-0.5 ${
                    maxPossible > 0 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {maxPossible} un {maxPossible > 0 ? 'possíveis' : 'indisponível'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper de Quantidade de Lanches */}
            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-orange-950 uppercase tracking-wider">
                  Quantidade a Lançar / Vender
                </label>
                <span className="text-xs text-orange-700 font-semibold">
                  {numQuantity} {currentRecipe.unit || 'Lanche(s)'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, numQuantity - 1))}
                  className="w-11 h-11 rounded-xl bg-white border border-orange-300 text-orange-900 hover:bg-orange-100 flex items-center justify-center font-extrabold text-base shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      setQuantity(Math.max(1, parseInt(val) || 1));
                    }
                  }}
                  className="w-28 py-2 text-center font-black text-2xl text-orange-950 bg-white rounded-xl border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                  placeholder="1"
                />

                <button
                  type="button"
                  onClick={() => setQuantity(numQuantity + 1)}
                  className="w-11 h-11 rounded-xl bg-white border border-orange-300 text-orange-900 hover:bg-orange-100 flex items-center justify-center font-extrabold text-base shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Botões rápidos de quantidade */}
              <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
                {[1, 2, 3, 5, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuantity(val)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      numQuantity === val
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-white text-orange-900 border border-orange-200 hover:bg-orange-100'
                    }`}
                  >
                    {val} un
                  </button>
                ))}
              </div>
            </div>

            {/* Decomposição em cascata dos ingredientes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>Desconto Automático no Estoque:</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {numQuantity}x cada porção
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 divide-y divide-slate-200/80 max-h-48 overflow-y-auto">
                {ingredientStatus.map((ing, idx) => (
                  <div key={ing.ingredientId || idx} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 truncate">{ing.ingredientName}</span>
                        {!ing.isSufficient && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">
                            Estoque Baixo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Por lanche: {ing.quantity} {ing.unit} | <strong>Total a sair: {ing.requiredTotal} {ing.unit}</strong>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-slate-500">{ing.currentStock}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={`font-bold ${ing.isSufficient ? 'text-slate-900' : 'text-rose-600'}`}>
                          {ing.remainingAfter} {ing.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de estoque insuficiente */}
            {hasInsufficientStock && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Atenção:</strong> Um ou mais ingredientes não possuem estoque suficiente para {numQuantity} lanches. A baixa será registrada e o estoque atingirá zero.
                </p>
              </div>
            )}

            {/* Resumo Financeiro */}
            {showPrices && unitPrice > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Custo Total Insumos</span>
                  <span className="text-sm font-black text-slate-800">
                    R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-x border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total da Venda</span>
                  <span className="text-sm font-black text-emerald-950">
                    R$ {totalSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Lucro Bruto</span>
                  <span className="text-sm font-black text-emerald-700">
                    R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Campo Opcional de Observação / Identificação do Pedido */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Identificação do Pedido / Mesa (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Mesa 04, Pedido iFood #123, Balcão..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Rodapé de Ações */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-sm transition-colors"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg transition-all text-sm active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRMAR BAIXA NO ESTOQUE</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
