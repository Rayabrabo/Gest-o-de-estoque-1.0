import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Check, Trash2, Package } from 'lucide-react';
import { Product, PurchaseItem } from '../types';

interface AddToCartModalProps {
  isOpen: boolean;
  product: Product | null;
  currentPurchaseItem?: PurchaseItem | null;
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onRemoveFromCart?: (productId: string) => void;
}

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  product,
  currentPurchaseItem,
  onClose,
  onAddToCart,
  onRemoveFromCart
}) => {
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      if (currentPurchaseItem && currentPurchaseItem.suggestedQuantity > 0) {
        setQuantity(currentPurchaseItem.suggestedQuantity);
      } else {
        const needed = Math.max(1, product.minStock - product.quantity);
        setQuantity(needed > 0 ? needed : 1);
      }
    }
  }, [product, currentPurchaseItem, isOpen]);

  if (!isOpen || !product) return null;

  const cost = product.costPrice ?? product.price ?? 0;
  const subtotal = quantity * cost;
  const isAlreadyInCart = !!currentPurchaseItem && !currentPurchaseItem.isPurchased;

  const handleIncrement = (amount: number = 1) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleDecrement = (amount: number = 1) => {
    setQuantity(prev => Math.max(1, prev - amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      onAddToCart(product.id, quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isAlreadyInCart ? 'AJUSTAR NO CARRINHO' : 'ADICIONAR AO CARRINHO'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Lista de Compras e Reposição</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              {product.name}
            </h4>
            <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
              {product.category}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Estoque Atual: <strong className={product.quantity <= product.minStock ? 'text-rose-600 font-bold' : 'text-slate-800'}>{product.quantity} {product.unit}</strong></span>
            <span>Estoque Mínimo: <strong>{product.minStock} {product.unit}</strong></span>
          </div>

          {cost > 0 && (
            <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <span>Preço de Custo Unitário:</span>
              <span className="font-bold text-slate-800">R$ {cost.toFixed(2).replace('.', ',')} / {product.unit}</span>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quantidade para Comprar ({product.unit}):
            </label>

            <div className="flex items-center justify-center gap-3 bg-purple-50/60 p-3 rounded-2xl border border-purple-100">
              <button
                type="button"
                onClick={() => handleDecrement(1)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center py-2 px-3 rounded-xl border border-purple-300 font-extrabold text-xl text-purple-950 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                type="button"
                onClick={() => handleIncrement(1)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Atalhos:</span>
              <button
                type="button"
                onClick={() => handleIncrement(5)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleIncrement(10)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors"
              >
                +10
              </button>
              {product.minStock > product.quantity && (
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, product.minStock - product.quantity))}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                >
                  Repor Mínimo ({product.minStock - product.quantity})
                </button>
              )}
            </div>
          </div>

          {/* Subtotal Preview */}
          {cost > 0 && (
            <div className="bg-slate-100/80 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Gasto Estimado de Compra:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div>
              {isAlreadyInCart && onRemoveFromCart && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveFromCart(product.id);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover do Carrinho</span>
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
                className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-xs active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{isAlreadyInCart ? 'ATUALIZAR CARRINHO' : 'ADICIONAR AO CARRINHO'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
