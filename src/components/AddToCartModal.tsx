import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Check, Trash2, Package, Tag, DollarSign, PlusCircle } from 'lucide-react';
import { Product, PurchaseItem, Unit, UNITS, DEFAULT_CATEGORIES } from '../types';

interface AddToCartModalProps {
  isOpen: boolean;
  product: Product | null;
  currentPurchaseItem?: PurchaseItem | null;
  availableCategories?: string[];
  onClose: () => void;
  onAddToCart: (
    productId: string,
    quantity: number,
    customFields?: {
      unit?: Unit;
      costPrice?: number;
      category?: string;
    }
  ) => void;
  onRemoveFromCart?: (productId: string) => void;
  onAddCategory?: (newCategory: string) => void;
}

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  product,
  currentPurchaseItem,
  availableCategories = DEFAULT_CATEGORIES,
  onClose,
  onAddToCart,
  onRemoveFromCart,
  onAddCategory
}) => {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState<Unit>('Unidade');
  const [costPrice, setCostPrice] = useState<number | string>('');
  const [category, setCategory] = useState<string>('📦 Outros');
  
  // Custom Category creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const isDecimalUnit = ['Kg', 'Grama', 'Litro'].includes(unit);
  const stepVal = isDecimalUnit ? 0.5 : 1;

  useEffect(() => {
    if (product && isOpen) {
      const initialUnit = currentPurchaseItem?.unit || product.unit || 'Unidade';
      setUnit(initialUnit);

      const initialCategory = currentPurchaseItem?.category || product.category || availableCategories[0] || '📦 Outros';
      setCategory(initialCategory);

      const rawCost = currentPurchaseItem?.costPrice ?? currentPurchaseItem?.price ?? product.costPrice ?? product.price ?? 0;
      setCostPrice(rawCost > 0 ? rawCost : '');

      setIsAddingCategory(false);
      setNewCategoryInput('');

      // Calculate initial quantity cleanly
      const isInitialDecimal = ['Kg', 'Grama', 'Litro'].includes(initialUnit);
      if (currentPurchaseItem && currentPurchaseItem.suggestedQuantity > 0) {
        setQuantity(currentPurchaseItem.suggestedQuantity);
      } else {
        if (product.minStock > product.quantity) {
          const diff = product.minStock - product.quantity;
          if (isInitialDecimal) {
            setQuantity(Number(diff.toFixed(2)));
          } else {
            setQuantity(Math.max(1, Math.ceil(diff)));
          }
        } else {
          // If stock is sufficient or manual add, default strictly to clean whole 1
          setQuantity(1);
        }
      }
    }
  }, [product, currentPurchaseItem, isOpen]);

  if (!isOpen || !product) return null;

  const numQuantity = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0;
  const numCost = typeof costPrice === 'number' ? costPrice : parseFloat(costPrice) || 0;
  const subtotal = numQuantity * numCost;
  const isAlreadyInCart = !!currentPurchaseItem && !currentPurchaseItem.isPurchased;

  const handleIncrement = (amount: number = 1) => {
    const current = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0;
    const nextVal = Number((current + amount).toFixed(2));
    setQuantity(Math.max(isDecimalUnit ? 0.1 : 1, nextVal));
  };

  const handleDecrement = (amount: number = 1) => {
    const current = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0;
    const nextVal = Number((current - amount).toFixed(2));
    setQuantity(Math.max(isDecimalUnit ? 0.1 : 1, nextVal));
  };

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
    const newIsDecimal = ['Kg', 'Grama', 'Litro'].includes(newUnit);
    const currNum = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 1;
    if (!newIsDecimal) {
      setQuantity(Math.max(1, Math.round(currNum)));
    }
  };

  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (trimmed) {
      if (onAddCategory) {
        onAddCategory(trimmed);
      }
      setCategory(trimmed);
      setIsAddingCategory(false);
      setNewCategoryInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    if (finalQty && finalQty > 0) {
      const finalCategory = isAddingCategory && newCategoryInput.trim() ? newCategoryInput.trim() : category;
      
      if (isAddingCategory && newCategoryInput.trim() && onAddCategory) {
        onAddCategory(newCategoryInput.trim());
      }

      onAddToCart(product.id, finalQty, {
        unit,
        costPrice: numCost > 0 ? numCost : undefined,
        category: finalCategory
      });
      onClose();
    }
  };

  // Combine available categories with current selection
  const allCategoryOptions = Array.from(new Set([...availableCategories, category]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-6 p-6 space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isAlreadyInCart ? 'EDITAR ITEM NO CARRINHO' : 'ADICIONAR AO CARRINHO'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ajuste a quantidade, unidade de medida e valor de compra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Header Box */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-600" />
              {product.name}
            </h4>
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[11px] font-bold">
              {category}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>
              Estoque Atual:{' '}
              <strong className={product.quantity <= 0 ? 'text-rose-600 font-bold' : (product.minStock > 0 && product.quantity <= product.minStock) ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                {product.quantity} {product.unit}
              </strong>
            </span>
            {product.minStock > 0 && (
              <span>
                Estoque Mínimo: <strong>{product.minStock} {product.unit}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Editable Unit & Cost Value in a 2-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            {/* Unit Selector (Unidade, Kg, Bandeja, etc.) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Unidade de Medida:
              </label>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value as Unit)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Unit Price / Cost Value */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Valor Unitário / Custo (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Category Selector + Add New Category */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Categoria:
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  + Nova Categoria
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome da nova categoria (ex: 🥫 Conservas)..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-purple-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleCreateCategory()}
                  disabled={!newCategoryInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryInput('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {allCategoryOptions.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity Controls */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quantidade para Comprar ({unit}):
            </label>

            <div className="flex items-center justify-center gap-3 bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">
              <button
                type="button"
                onClick={() => handleDecrement(stepVal)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
                title={`Diminuir ${stepVal}`}
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 bg-white border border-purple-300 rounded-xl px-4 py-1.5 shadow-inner">
                <input
                  type="number"
                  min={isDecimalUnit ? "0.05" : "1"}
                  step={isDecimalUnit ? "0.1" : "1"}
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = parseFloat(val);
                      setQuantity(isNaN(parsed) ? '' : (isDecimalUnit ? parsed : Math.round(parsed)));
                    }
                  }}
                  className="w-24 text-center font-extrabold text-2xl text-purple-950 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-bold text-slate-500 uppercase">{unit}</span>
              </div>

              <button
                type="button"
                onClick={() => handleIncrement(stepVal)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
                title={`Aumentar ${stepVal}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center flex-wrap gap-2 mt-2.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Atalhos:</span>
              {isDecimalUnit ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleIncrement(0.5)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +0.5 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIncrement(1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +1 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIncrement(5)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +5 {unit}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleIncrement(1)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +1 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIncrement(5)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +5 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIncrement(10)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    +10 {unit}
                  </button>
                </>
              )}
              {product.minStock > 0 && product.minStock > product.quantity && (
                <button
                  type="button"
                  onClick={() => {
                    const diff = product.minStock - product.quantity;
                    setQuantity(isDecimalUnit ? Number(diff.toFixed(2)) : Math.max(1, Math.ceil(diff)));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Repor Mínimo ({isDecimalUnit ? Number((product.minStock - product.quantity).toFixed(2)) : Math.max(1, Math.ceil(product.minStock - product.quantity))} {unit})
                </button>
              )}
            </div>
          </div>

          {/* Subtotal Preview */}
          {numCost > 0 && (
            <div className="bg-slate-100/90 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-200">
              <div className="text-slate-600 font-medium">
                <span>Gasto Estimado de Compra:</span>
                <span className="block text-[11px] text-slate-400">
                  {numQuantity} {unit} × R$ {numCost.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className="font-extrabold text-emerald-800 text-base">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div>
              {isAlreadyInCart && onRemoveFromCart && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveFromCart(product.id);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                CANCELAR
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-xs active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isAlreadyInCart ? 'SALVAR ALTERAÇÕES' : 'ADICIONAR AO CARRINHO'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
