import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Utensils, 
  Plus, 
  Trash2, 
  Layers, 
  DollarSign, 
  Search, 
  Check, 
  AlertCircle, 
  Sparkles,
  TrendingUp,
  Package,
  Boxes
} from 'lucide-react';
import { Product, RecipeIngredient, Unit, DEFAULT_CATEGORIES, SystemSettings } from '../types';
import { StorageService } from '../services/storageService';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  onDelete?: (productId: string) => void;
  recipeToEdit?: Product | null;
  allProducts: Product[];
  settings: SystemSettings;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  recipeToEdit,
  allProducts,
  settings
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('🍔 Lanches & Pratos');
  const [sellPrice, setSellPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockCategory, setSelectedStockCategory] = useState('all');

  const showPrices = settings.showPrices !== false;

  // Insumos disponíveis em estoque (apenas produtos que não são fichas técnicas e que não sejam o próprio item)
  const rawStockItems = allProducts.filter(p => !p.isRecipe && (!recipeToEdit || p.id !== recipeToEdit.id));

  // Insumo categories for filtering
  const stockCategories = Array.from(new Set(rawStockItems.map(p => p.category))).filter(Boolean);

  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name || '');
      setCategory(recipeToEdit.category || '🍔 Lanches & Pratos');
      const sPrice = recipeToEdit.sellPrice ?? recipeToEdit.price ?? 0;
      setSellPrice(sPrice > 0 ? sPrice : '');
      setNotes(recipeToEdit.notes || '');
      setIngredients(recipeToEdit.ingredients ? [...recipeToEdit.ingredients] : []);
    } else {
      setName('');
      setCategory('🍔 Lanches & Pratos');
      setSellPrice('');
      setNotes('');
      setIngredients([]);
    }
    setSearchTerm('');
    setSelectedStockCategory('all');
  }, [recipeToEdit, isOpen]);

  if (!isOpen) return null;

  // Filter raw stock items based on search and category
  const filteredStockItems = rawStockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedStockCategory === 'all' || item.category === selectedStockCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate live recipe cost based on ingredients
  let totalIngredientsCost = 0;
  ingredients.forEach(ing => {
    const prod = allProducts.find(p => p.id === ing.ingredientId);
    const itemCost = prod?.costPrice ?? prod?.price ?? ing.costPrice ?? 0;
    totalIngredientsCost += itemCost * ing.quantity;
  });

  // Calculate capacity to produce
  let minServingsPossible = Infinity;
  if (ingredients.length === 0) {
    minServingsPossible = 0;
  } else {
    ingredients.forEach(ing => {
      const prod = allProducts.find(p => p.id === ing.ingredientId);
      const currentStock = prod ? prod.quantity : 0;
      if (ing.quantity <= 0) return;
      const possible = Math.floor(currentStock / ing.quantity);
      if (possible < minServingsPossible) {
        minServingsPossible = possible;
      }
    });
    if (minServingsPossible === Infinity) minServingsPossible = 0;
  }

  const numericSellPrice = typeof sellPrice === 'number' ? sellPrice : (parseFloat(sellPrice) || 0);
  const profitMargin = numericSellPrice > 0 ? numericSellPrice - totalIngredientsCost : 0;
  const profitPercentage = numericSellPrice > 0 ? ((profitMargin / numericSellPrice) * 100).toFixed(0) : '0';

  // Handler to toggle or add ingredient
  const handleToggleIngredient = (product: Product) => {
    const existingIndex = ingredients.findIndex(i => i.ingredientId === product.id);
    if (existingIndex >= 0) {
      // Remove
      setIngredients(ingredients.filter(i => i.ingredientId !== product.id));
    } else {
      // Add with default qty 1
      const defaultQty = product.unit === 'Kg' ? 0.1 : (product.unit === 'Grama' ? 100 : 1);
      const cost = product.costPrice ?? product.price ?? 0;
      const newIng: RecipeIngredient = {
        ingredientId: product.id,
        ingredientName: product.name,
        quantity: defaultQty,
        unit: product.unit,
        costPrice: cost
      };
      setIngredients([...ingredients, newIng]);
    }
  };

  const handleUpdateIngredientQty = (ingredientId: string, newQty: number) => {
    if (newQty <= 0) {
      setIngredients(ingredients.filter(i => i.ingredientId !== ingredientId));
      return;
    }
    setIngredients(ingredients.map(i => 
      i.ingredientId === ingredientId ? { ...i, quantity: newQty } : i
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: recipeToEdit?.id,
      name: name.trim(),
      category: category.trim() || '🍔 Lanches & Pratos',
      quantity: 0,
      unit: 'Unidade',
      minStock: 0,
      isRecipe: true,
      ingredients,
      costPrice: totalIngredientsCost > 0 ? Number(totalIngredientsCost.toFixed(2)) : undefined,
      sellPrice: numericSellPrice > 0 ? numericSellPrice : undefined,
      price: numericSellPrice > 0 ? numericSellPrice : (totalIngredientsCost > 0 ? totalIngredientsCost : undefined),
      notes: notes.trim(),
      createdAt: recipeToEdit?.createdAt || new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>{recipeToEdit ? 'EDITAR LANCHE / FICHA TÉCNICA' : 'CRIAR NOVO LANCHE / FICHA TÉCNICA'}</span>
              </h3>
              <p className="text-xs text-slate-300">
                Selecione os insumos do estoque que compõem este lanche para baixa automática
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Top Details: Nome, Categoria, Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Nome do Lanche / Ficha Técnica *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Burger Smash Duplo Cheddar, X-Salada Especial..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Preço de Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Ex: 28.00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-emerald-800 bg-white"
              />
            </div>
          </div>

          {/* Seletor Visual de Insumos do Estoque */}
          <div className="bg-orange-50/60 p-4 sm:p-5 rounded-2xl border border-orange-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <span>1. Selecionar Insumos do Estoque ({ingredients.length} selecionados)</span>
                </h4>
                <p className="text-[11px] text-orange-800/80 mt-0.5">
                  Clique nos itens do estoque abaixo para incluir no lanche e defina a quantidade gasta por lanche.
                </p>
              </div>

              {/* Indicador de Capacidade */}
              {ingredients.length > 0 && (
                <span className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-xl shadow-xs ${
                  minServingsPossible > 0 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-rose-600 text-white'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{minServingsPossible} lanches disponíveis em estoque</span>
                </span>
              )}
            </div>

            {/* Insumos Adicionados com Controle de Quantidade */}
            {ingredients.length > 0 && (
              <div className="bg-white rounded-xl border border-orange-300 p-3 shadow-xs space-y-2">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                  Ingredientes que compõem este lanche:
                </span>
                
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1 space-y-1">
                  {ingredients.map(ing => {
                    const stockProd = allProducts.find(p => p.id === ing.ingredientId);
                    const currentStock = stockProd ? stockProd.quantity : 0;
                    const itemUnitCost = stockProd?.costPrice ?? stockProd?.price ?? ing.costPrice ?? 0;
                    const itemTotalCost = itemUnitCost * ing.quantity;

                    return (
                      <div key={ing.ingredientId} className="py-2 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{ing.ingredientName}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              Estoque: {currentStock} {ing.unit}
                            </span>
                          </div>
                          {showPrices && itemUnitCost > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Custo no lanche: <strong>R$ {itemTotalCost.toFixed(2).replace('.', ',')}</strong> ({ing.quantity} × R$ {itemUnitCost.toFixed(2)})
                            </p>
                          )}
                        </div>

                        {/* Quantity Controller */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-bold text-slate-500 mr-1">Qtd p/ lanche:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateIngredientQty(ing.ingredientId, Math.max(0.001, Number((ing.quantity - (ing.unit === 'Kg' ? 0.05 : 1)).toFixed(3))))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-800 font-black flex items-center justify-center active:scale-95 transition-all"
                          >
                            -
                          </button>

                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={ing.quantity}
                            onChange={(e) => handleUpdateIngredientQty(ing.ingredientId, parseFloat(e.target.value) || 0)}
                            className="w-16 py-1 text-center font-black text-xs text-orange-950 bg-orange-50/60 rounded-lg border border-orange-300"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateIngredientQty(ing.ingredientId, Number((ing.quantity + (ing.unit === 'Kg' ? 0.05 : 1)).toFixed(3)))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-800 font-black flex items-center justify-center active:scale-95 transition-all"
                          >
                            +
                          </button>

                          <span className="text-xs font-bold text-slate-600 w-8">{ing.unit}</span>

                          <button
                            type="button"
                            onClick={() => handleToggleIngredient({ id: ing.ingredientId } as Product)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                            title="Remover ingrediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & Stock Catalog Selector */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider">
                  2. Itens Disponíveis no Estoque (Clique para incluir ou remover):
                </span>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar insumo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>

                  {stockCategories.length > 0 && (
                    <select
                      value={selectedStockCategory}
                      onChange={(e) => setSelectedStockCategory(e.target.value)}
                      className="py-1 px-2 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="all">Todas Categorias</option>
                      {stockCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {rawStockItems.length === 0 ? (
                <div className="p-6 bg-white rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Nenhum insumo cadastrado no estoque ainda</p>
                  <p className="text-[11px] text-slate-500">
                    Cadastre primeiro os itens básicos (ex: Pão Brioche, Carne Smash, Queijo Cheddar) na aba Estoque.
                  </p>
                </div>
              ) : filteredStockItems.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  Nenhum item encontrado com o filtro "{searchTerm}".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {filteredStockItems.map(item => {
                    const isSelected = ingredients.some(i => i.ingredientId === item.id);
                    const cost = item.costPrice ?? item.price ?? 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleIngredient(item)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-400'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-bold text-xs leading-snug line-clamp-1">
                            {item.name}
                          </span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-white text-orange-600' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="mt-2 pt-1 border-t border-current/15 flex items-center justify-between text-[10px]">
                          <span className={isSelected ? 'text-orange-100 font-semibold' : 'text-slate-500'}>
                            Estoque: <strong>{item.quantity} {item.unit}</strong>
                          </span>
                          {showPrices && cost > 0 && (
                            <span className={isSelected ? 'text-orange-100 font-bold' : 'text-slate-700 font-bold'}>
                              R$ {cost.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resumo Financeiro da Ficha Técnica */}
          {showPrices && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Custo dos Insumos (CPV)
                </span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  R$ {totalIngredientsCost.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] text-slate-400">Soma dos insumos por lanche</span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                  Preço de Venda
                </span>
                <span className="text-base font-black text-emerald-700 mt-0.5 block">
                  {numericSellPrice > 0 ? `R$ ${numericSellPrice.toFixed(2).replace('.', ',')}` : 'Não definido'}
                </span>
                <span className="text-[10px] text-emerald-600">Valor cobrado do cliente</span>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                  Margem de Lucro Bruto
                </span>
                <span className="text-base font-black text-slate-900 mt-0.5 block">
                  {numericSellPrice > 0 ? `R$ ${profitMargin.toFixed(2).replace('.', ',')} (${profitPercentage}%)` : '—'}
                </span>
                <span className="text-[10px] text-slate-400">Lucro por unidade vendida</span>
              </div>
            </div>
          )}

          {/* Observações / Preparo */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
              Observações / Modo de Preparo (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de montagem, ponto da carne, embalagem utilizada..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-800"
            />
          </div>

          {/* Rodapé de Ações */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div>
              {recipeToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir "${recipeToEdit.name}"?`)) {
                      onDelete(recipeToEdit.id);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>EXCLUIR</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-xs transition-colors"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                disabled={!name.trim() || ingredients.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all text-xs active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>SALVAR LANCHE / FICHA TÉCNICA</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
