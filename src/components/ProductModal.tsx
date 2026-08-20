import React, { useState, useEffect } from 'react';
import { X, Save, PackagePlus, Trash2, Layers, Plus, Utensils, Sparkles, Minus, AlertCircle } from 'lucide-react';
import { Product, Unit, UNITS, DEFAULT_CATEGORIES, RecipeIngredient } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  onDelete?: (productId: string) => void;
  productToEdit?: Product | null;
  categories: string[];
  allProducts?: Product[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  productToEdit,
  categories,
  allProducts = []
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [quantity, setQuantity] = useState<number | ''>(0);
  const [unit, setUnit] = useState<Unit>('Unidade');
  const [hasMinStock, setHasMinStock] = useState(false);
  const [minStock, setMinStock] = useState<number | ''>('');
  const [hasPrice, setHasPrice] = useState(true);
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellPrice, setSellPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ficha Técnica / Receita State
  const [isRecipe, setIsRecipe] = useState(false);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState<number | ''>(1);

  const availableCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  // Insumos disponíveis para compor a receita (apenas produtos que não são receitas e que não sejam o próprio produto)
  const rawIngredientsAvailable = allProducts.filter(p => !p.isRecipe && (!productToEdit || p.id !== productToEdit.id));

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setQuantity(productToEdit.quantity);
      setUnit(productToEdit.unit);
      
      const hasDefinedMin = (productToEdit.minStock !== undefined && productToEdit.minStock > 0);
      setHasMinStock(hasDefinedMin);
      setMinStock(hasDefinedMin ? productToEdit.minStock : '');

      const cPrice = productToEdit.costPrice ?? productToEdit.price ?? 0;
      const sPrice = productToEdit.sellPrice ?? 0;
      setHasPrice(cPrice > 0 || sPrice > 0);
      setCostPrice(cPrice > 0 ? cPrice : '');
      setSellPrice(sPrice > 0 ? sPrice : '');
      setNotes(productToEdit.notes || '');

      const isRec = !!productToEdit.isRecipe;
      setIsRecipe(isRec);
      setIngredients(productToEdit.ingredients || []);
    } else {
      setName('');
      setCategory(availableCategories[0] || '📦 Outros');
      setQuantity(0);
      setUnit('Unidade');
      setHasMinStock(false);
      setMinStock('');
      setHasPrice(true);
      setCostPrice('');
      setSellPrice('');
      setNotes('');
      setIsRecipe(false);
      setIngredients([]);
    }
    setSelectedIngredientId(rawIngredientsAvailable[0]?.id || '');
    setIngredientQty(1);
  }, [productToEdit, isOpen]);

  // Recalcula o custo da receita automaticamente somando os ingredientes
  useEffect(() => {
    if (isRecipe) {
      let totalRecipeCost = 0;
      ingredients.forEach(ing => {
        const prod = allProducts.find(p => p.id === ing.ingredientId);
        const itemCost = prod?.costPrice ?? prod?.price ?? ing.costPrice ?? 0;
        totalRecipeCost += itemCost * ing.quantity;
      });
      setCostPrice(totalRecipeCost > 0 ? Number(totalRecipeCost.toFixed(2)) : '');
    }
  }, [ingredients, isRecipe, allProducts]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    if (!selectedIngredientId || typeof ingredientQty !== 'number' || ingredientQty <= 0) return;

    const prod = allProducts.find(p => p.id === selectedIngredientId);
    if (!prod) return;

    const existingIdx = ingredients.findIndex(i => i.ingredientId === selectedIngredientId);
    const cost = prod.costPrice ?? prod.price ?? 0;

    if (existingIdx >= 0) {
      const updated = [...ingredients];
      updated[existingIdx].quantity = Number((updated[existingIdx].quantity + ingredientQty).toFixed(3));
      setIngredients(updated);
    } else {
      const newIng: RecipeIngredient = {
        ingredientId: prod.id,
        ingredientName: prod.name,
        quantity: ingredientQty,
        unit: prod.unit,
        costPrice: cost
      };
      setIngredients([...ingredients, newIng]);
    }

    setIngredientQty(1);
  };

  const handleRemoveIngredient = (ingId: string) => {
    setIngredients(ingredients.filter(i => i.ingredientId !== ingId));
  };

  const handleUpdateIngredientQty = (ingId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveIngredient(ingId);
      return;
    }
    setIngredients(ingredients.map(i => i.ingredientId === ingId ? { ...i, quantity: newQty } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isAddingCategory && newCategoryInput.trim()
      ? newCategoryInput.trim()
      : category;

    const numQty = isRecipe ? 0 : (typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0);
    const numMin = (isRecipe || !hasMinStock) ? 0 : (typeof minStock === 'number' ? minStock : parseFloat(minStock) || 0);
    const numCost = hasPrice ? (typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0) : 0;
    const numSell = hasPrice ? (typeof sellPrice === 'number' ? sellPrice : parseFloat(sellPrice) || 0) : 0;

    let previousPrice = productToEdit?.previousPrice;
    let lastPriceChangeDate = productToEdit?.lastPriceChangeDate;

    const prevCost = productToEdit?.costPrice ?? productToEdit?.price ?? 0;
    if (productToEdit && prevCost !== numCost && numCost > 0) {
      previousPrice = prevCost;
      lastPriceChangeDate = new Date().toISOString().split('T')[0];
    }

    onSave({
      id: productToEdit?.id,
      name: name.trim(),
      category: isRecipe && finalCategory === DEFAULT_CATEGORIES[1] ? '🍔 Lanches & Pratos' : finalCategory,
      quantity: numQty,
      unit,
      minStock: numMin,
      costPrice: numCost > 0 ? numCost : undefined,
      sellPrice: numSell > 0 ? numSell : undefined,
      price: numCost > 0 ? numCost : (numSell > 0 ? numSell : undefined),
      previousPrice,
      lastPriceChangeDate,
      notes: notes.trim(),
      isRecipe,
      ingredients: isRecipe ? ingredients : undefined,
      createdAt: productToEdit?.createdAt || new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isRecipe ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isRecipe ? <Utensils className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {productToEdit 
                  ? (isRecipe ? 'EDITAR LANCHE / FICHA TÉCNICA' : 'EDITAR PRODUTO') 
                  : (isRecipe ? 'CADASTRAR LANCHE / FICHA TÉCNICA' : 'CADASTRAR PRODUTO')}
              </h3>
              <p className="text-xs text-slate-400">
                {isRecipe ? 'Define a composição para baixa automática de estoque' : 'Item avulso ou insumo de estoque'}
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Seletor de Tipo: Insumo Simples vs Lanche Composto (Receita) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsRecipe(false);
                if (category === '🍔 Lanches & Pratos') {
                  setCategory(DEFAULT_CATEGORIES[1]);
                }
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isRecipe
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              <span>Insumo Simples</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecipe(true);
                setCategory('🍔 Lanches & Pratos');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isRecipe
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>🍔 Lanche / Ficha Técnica</span>
            </button>
          </div>

          {/* Nome do produto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {isRecipe ? 'Nome do Lanche / Receita *' : 'Nome do Produto / Insumo *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRecipe ? "Ex: Burger Smash Duplo Cheddar, X-Salada..." : "Ex: Pão Brioche Selado, Hambúrguer Smash 90g, Mussarela..."}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-medium text-slate-800"
            />
          </div>

          {/* Categoria */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Categoria *
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-xs text-emerald-600 hover:underline font-semibold"
              >
                {isAddingCategory ? 'Escolher da lista' : '+ Nova Categoria'}
              </button>
            </div>

            {isAddingCategory ? (
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Digite o nome da nova categoria..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm text-slate-800"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-medium text-slate-800 bg-white"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Se for FICHA TÉCNICA: Seção de Composição de Ingredientes */}
          {isRecipe ? (
            <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <span>Ingredientes da Ficha Técnica (por 1 lanche)</span>
                  </h4>
                  <p className="text-[11px] text-orange-800/80 mt-0.5">
                    Quando este lanche for vendido, estes itens sairão do estoque automaticamente.
                  </p>
                </div>
                <span className="bg-orange-200 text-orange-900 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                  {ingredients.length} itens
                </span>
              </div>

              {/* Lista dos ingredientes adicionados */}
              {ingredients.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-dashed border-orange-300 text-center text-xs text-orange-700">
                  Nenhum ingrediente adicionado ainda. Adicione os insumos abaixo (ex: pão, carne, queijo).
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-orange-200 divide-y divide-orange-100 max-h-48 overflow-y-auto">
                  {ingredients.map(ing => (
                    <div key={ing.ingredientId} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{ing.ingredientName}</p>
                        <p className="text-[11px] text-slate-500">
                          {ing.quantity} {ing.unit} por lanche
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateIngredientQty(ing.ingredientId, Math.max(0.01, ing.quantity - 1))}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-700 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredientQty(ing.ingredientId, parseFloat(e.target.value) || 0)}
                          className="w-14 text-center font-bold text-slate-800 bg-slate-50 rounded border border-slate-200 py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateIngredientQty(ing.ingredientId, ing.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-orange-100 flex items-center justify-center text-slate-700 font-bold"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.ingredientId)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded ml-1"
                          title="Remover ingrediente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para incluir novo ingrediente */}
              <div className="bg-white p-3 rounded-xl border border-orange-200 space-y-2">
                <span className="text-[11px] font-bold text-orange-950 uppercase block">
                  + Incluir Insumo do Estoque
                </span>

                {rawIngredientsAvailable.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Cadastre primeiro insumos como carne, pão e queijo no estoque para selecioná-los.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedIngredientId}
                      onChange={(e) => setSelectedIngredientId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-slate-50"
                    >
                      {rawIngredientsAvailable.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.quantity} {p.unit} em estoque)
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        placeholder="Qtd."
                        value={ingredientQty}
                        onChange={(e) => setIngredientQty(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-20 px-2 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 text-center"
                      />

                      <button
                        type="button"
                        onClick={handleAddIngredient}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Campos normais de estoque físico para Insumos */
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Quantidade Atual *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Unit)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-medium text-slate-800 bg-white"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estoque Mínimo Opcional */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMinStock}
                    onChange={(e) => {
                      setHasMinStock(e.target.checked);
                      if (!e.target.checked) {
                        setMinStock('');
                      } else if (minStock === '' || minStock === 0) {
                        setMinStock(1);
                      }
                    }}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Definir Estoque Mínimo de Segurança (Opcional)
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                      Permite alertar quando o item estiver com estoque baixo. Se desmarcado, o item não terá exigência de estoque mínimo.
                    </span>
                  </div>
                </label>

                {hasMinStock && (
                  <div className="pt-1 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Quantidade Mínima de Segurança
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="Ex: 5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-semibold text-slate-800 bg-white"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Preços e Valores */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPrice}
                onChange={(e) => {
                  setHasPrice(e.target.checked);
                  if (!e.target.checked) {
                    setCostPrice('');
                    setSellPrice('');
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Informar preços / valores unitários
              </span>
            </label>

            {hasPrice ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {isRecipe ? 'Custo da Receita (R$)' : 'Preço de Custo (R$)'}
                  </label>
                  <p className="text-[10px] text-slate-500 mb-1">
                    {isRecipe ? 'Calculado pela soma dos insumos' : 'Valor pago na compra'}
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ex: 8.50"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Preço de Venda (R$)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-1">Valor cobrado do cliente</p>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Ex: 26.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                ℹ️ Este item será cadastrado sem valores financeiros.
              </p>
            )}
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Modo de Preparo (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de preparo, armazenamento, fornecedor..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm text-slate-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div>
              {productToEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
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
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-sm transition-colors"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                className={`flex items-center gap-2 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95 ${
                  isRecipe ? 'bg-orange-600 hover:bg-orange-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>SALVAR {isRecipe ? 'LANCHE' : 'PRODUTO'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="EXCLUIR ITEM"
          message={`Tem certeza de que deseja remover "${productToEdit?.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="EXCLUIR DEFINITIVAMENTE"
          onConfirm={() => {
            if (productToEdit && onDelete) {
              onDelete(productToEdit.id);
              setShowDeleteConfirm(false);
              onClose();
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
};

