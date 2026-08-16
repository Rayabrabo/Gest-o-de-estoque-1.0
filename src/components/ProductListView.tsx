import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Minus, 
  Plus as PlusIcon,
  Flame,
  Snowflake,
  Activity,
  ShoppingCart,
  Utensils
} from 'lucide-react';
import { Product, VelocityClass, SystemSettings, PurchaseItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { AddToCartModal } from './AddToCartModal';
import { StorageService } from '../services/storageService';

interface ProductListViewProps {
  products: Product[];
  settings: SystemSettings;
  shoppingList?: PurchaseItem[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickUpdateQuantity: (productId: string, newQty: number) => void;
  onAddToCart?: (productId: string, quantity: number) => void;
  onRemoveFromCart?: (productId: string) => void;
  onDischargeRecipe?: (recipe: Product) => void;
  categories: string[];
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  settings,
  shoppingList = [],
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickUpdateQuantity,
  onAddToCart,
  onRemoveFromCart,
  onDischargeRecipe,
  categories
}) => {
  const showPrices = settings.showPrices !== false;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productForCart, setProductForCart] = useState<Product | null>(null);

  const availableCategories = Array.from(new Set(products.map(p => p.category)));

  // Filter products by search, status, velocity, category
  const filteredProducts = products.filter(product => {
    // Search match
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Category match
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter === 'recipes_only') {
      return product.isRecipe;
    }
    if (selectedStatusFilter === 'raw_only') {
      return !product.isRecipe;
    }
    if (selectedStatusFilter === 'normal') {
      return product.quantity > product.minStock;
    }
    if (selectedStatusFilter === 'low') {
      return product.quantity <= product.minStock && product.quantity > 0;
    }
    if (selectedStatusFilter === 'buy') {
      return product.quantity <= 0 || product.quantity <= product.minStock;
    }
    if (selectedStatusFilter === 'high_velocity') {
      return product.velocityClass === 'high';
    }
    if (selectedStatusFilter === 'medium_velocity') {
      return product.velocityClass === 'medium';
    }
    if (selectedStatusFilter === 'low_velocity') {
      return product.velocityClass === 'low';
    }

    return true;
  });

  const getStatusBadge = (product: Product) => {
    if (product.isRecipe) {
      const maxPossible = StorageService.calculateRecipeMaxStock(product, products);
      return (
        <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs border ${
          maxPossible <= 0 
            ? 'bg-rose-100 text-rose-800 border-rose-300' 
            : maxPossible <= 5 
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-orange-100 text-orange-900 border-orange-300'
        }`}>
          🍔 {maxPossible <= 0 ? 'FALTA INSUMO' : `${maxPossible} DISPONÍVEIS`}
        </span>
      );
    }

    if (product.quantity <= 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded-full text-xs">
          🔴 COMPRAR (ZERADO)
        </span>
      );
    }
    if (product.quantity <= product.minStock) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-xs">
          🟡 ESTOQUE BAIXO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-xs">
        🟢 ESTOQUE NORMAL
      </span>
    );
  };

  const getVelocityBadge = (velocity?: VelocityClass) => {
    if (velocity === 'high') {
      return (
        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md text-[11px] font-semibold" title="Alta frequência de consumo">
          🔥 Mais Utilizado
        </span>
      );
    }
    if (velocity === 'low') {
      return (
        <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md text-[11px] font-semibold" title="Baixa frequência de consumo">
          ❄️ Menos Utilizado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-semibold" title="Uso intermediário">
        🟡 Uso Médio
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-10">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>ESTOQUE</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie todos os itens do inventário, quantidades e preços em um só lugar.
          </p>
        </div>

        <button
          onClick={onAddProduct}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ ADICIONAR ITEM</span>
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔎 Pesquisar produto por nome ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm text-slate-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filtros:</span>

          <button
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({products.length})
          </button>

          <button
            onClick={() => setSelectedStatusFilter('recipes_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatusFilter === 'recipes_only'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>🍔 Lanches / Fichas ({products.filter(p => p.isRecipe).length})</span>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('raw_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'raw_only'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🥩 Insumos ({products.filter(p => !p.isRecipe).length})
          </button>

          <button
            onClick={() => setSelectedStatusFilter('normal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'normal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🟢 Normal
          </button>

          <button
            onClick={() => setSelectedStatusFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'low'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🟡 Estoque Baixo
          </button>

          <button
            onClick={() => setSelectedStatusFilter('buy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'buy'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            🔴 Comprar
          </button>

          <button
            onClick={() => setSelectedStatusFilter('high_velocity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'high_velocity'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            🔥 Mais Utilizados
          </button>

          <button
            onClick={() => setSelectedStatusFilter('medium_velocity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'medium_velocity'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            🟡 Uso Médio
          </button>

          <button
            onClick={() => setSelectedStatusFilter('low_velocity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedStatusFilter === 'low_velocity'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            ❄️ Menos Utilizados
          </button>
        </div>

        {/* Category Selector */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-500 uppercase">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
            >
              <option value="all">Todas as categorias</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Product List Cards / Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">Nenhum produto encontrado</p>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca ou limpe os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const hasPriceChange = product.previousPrice && product.previousPrice !== product.price;
            const priceIncreased = hasPriceChange && product.price > product.previousPrice!;

            const cartItem = shoppingList.find(item => item.productId === product.id && !item.isPurchased);

            const isRecipe = !!product.isRecipe;
            const maxRecipePossible = isRecipe ? StorageService.calculateRecipeMaxStock(product, products) : 0;
            const unitCost = isRecipe ? StorageService.calculateRecipeUnitCost(product, products) : (product.costPrice ?? product.price ?? 0);

            return (
              <div 
                key={product.id}
                className={`bg-white rounded-2xl border ${
                  isRecipe
                    ? 'border-orange-300 shadow-orange-500/5'
                    : cartItem 
                      ? 'border-purple-200 ring-1 ring-purple-100' 
                      : 'border-slate-200'
                } p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group`}
              >
                <div>
                  {/* Top Header: Name & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{product.name}</h3>
                        {isRecipe && (
                          <span className="bg-orange-100 text-orange-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-300 flex items-center gap-1">
                            <Utensils className="w-2.5 h-2.5 text-orange-600" />
                            <span>FICHA TÉCNICA</span>
                          </span>
                        )}
                        {cartItem && !isRecipe && (
                          <span 
                            onClick={() => setProductForCart(product)}
                            className="cursor-pointer inline-flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors"
                            title="Clique para ajustar a quantidade no carrinho"
                          >
                            <ShoppingCart className="w-2.5 h-2.5" />
                            <span>No Carrinho ({cartItem.suggestedQuantity} {product.unit})</span>
                          </span>
                        )}
                      </div>
                      <span className="inline-block bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md text-[11px] font-medium mt-1">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getStatusBadge(product)}
                      {!isRecipe && getVelocityBadge(product.velocityClass)}
                    </div>
                  </div>

                  {/* Stock Quantity Controls OR Recipe Breakdown */}
                  {isRecipe ? (
                    <div className="bg-orange-50/70 rounded-xl p-3.5 my-3 border border-orange-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-orange-900 uppercase">Capacidade p/ Produzir</p>
                          <p className="text-xl font-black text-orange-950 mt-0.5">
                            {maxRecipePossible} <span className="text-xs font-semibold text-orange-800">unidades</span>
                          </p>
                        </div>

                        {onDischargeRecipe && (
                          <button
                            type="button"
                            onClick={() => onDischargeRecipe(product)}
                            className="bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                            title="Descontar ingredientes automaticamente ao vender este lanche"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Vender / Baixar</span>
                          </button>
                        )}
                      </div>

                      {/* Resumo de insumos consumidos */}
                      <div className="pt-2 border-t border-orange-200/60 text-[11px] text-orange-900">
                        <span className="font-bold block mb-1">Insumos consumidos por lanche:</span>
                        <div className="space-y-0.5 max-h-24 overflow-y-auto">
                          {product.ingredients && product.ingredients.length > 0 ? (
                            product.ingredients.map(ing => (
                              <div key={ing.ingredientId} className="flex items-center justify-between text-[11px] bg-white/70 px-2 py-0.5 rounded border border-orange-100">
                                <span className="truncate mr-2">{ing.ingredientName}</span>
                                <span className="font-semibold shrink-0">{ing.quantity} {ing.unit}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-orange-700 italic">Nenhum ingrediente configurado.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3.5 my-3 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase">Estoque Atual</p>
                        <p className="text-2xl font-black text-slate-900 mt-0.5">
                          {product.quantity} <span className="text-xs font-semibold text-slate-500">{product.unit}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Mínimo: <span className="font-semibold text-slate-700">{product.minStock} {product.unit}</span>
                        </p>
                      </div>

                      {/* Quick Qty Incrementor */}
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 shadow-sm">
                        <button
                          onClick={() => onQuickUpdateQuantity(product.id, Math.max(0, product.quantity - 1))}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                          title="Diminuir 1"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onQuickUpdateQuantity(product.id, product.quantity + 1)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                          title="Aumentar 1"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pricing Details & Price Changes */}
                  {showPrices && (
                    <div className="text-xs space-y-1.5 mb-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      {(() => {
                        const cost = unitCost;
                        const sell = product.sellPrice ?? 0;
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">
                                {isRecipe ? 'Custo dos Insumos (CPV):' : 'Preço de Custo:'}
                              </span>
                              <span className="font-bold text-slate-800">
                                {cost > 0 ? `R$ ${cost.toFixed(2).replace('.', ',')} / ${product.unit}` : 'Não informado'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Preço de Venda:</span>
                              <span className="font-bold text-emerald-700">
                                {sell > 0 ? `R$ ${sell.toFixed(2).replace('.', ',')} / ${product.unit}` : 'Não informado'}
                              </span>
                            </div>

                            {isRecipe && sell > 0 && cost > 0 && (
                              <div className="flex items-center justify-between text-xs bg-emerald-50 p-1.5 rounded border border-emerald-200 text-emerald-900 font-bold">
                                <span>Margem Bruta Unitária:</span>
                                <span>R$ {(sell - cost).toFixed(2).replace('.', ',')} ({(((sell - cost) / sell) * 100).toFixed(0)}%)</span>
                              </div>
                            )}

                            {!isRecipe && hasPriceChange && cost > 0 && (
                              <div className="flex items-center justify-between bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-[11px] my-1">
                                <span className="text-amber-800 flex items-center gap-1 font-semibold">
                                  {priceIncreased ? <TrendingUp className="w-3.5 h-3.5 text-rose-600" /> : <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />}
                                  {priceIncreased ? 'Aumento custo' : 'Redução custo'}
                                </span>
                                <span className="text-slate-600">
                                  De R$ {product.previousPrice?.toFixed(2).replace('.', ',')} p/ R$ {cost.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            )}

                            {!isRecipe && cost > 0 && (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-500 text-[11px]">
                                <span>Valor em Custo no Estoque:</span>
                                <span className="font-extrabold text-slate-900">
                                  R$ {(product.quantity * cost).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Notes / Last Audit */}
                  {product.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic mb-3 border border-slate-100">
                      "{product.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs gap-2">
                  <span className="text-[11px] text-slate-400 truncate">
                    {product.lastAuditedAt ? `Conf.: ${product.lastAuditedAt}` : (isRecipe ? 'Receita ativa' : 'Não conferido')}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Small Intuitive Add To Cart Button */}
                    {!isRecipe && (
                      <button
                        onClick={() => setProductForCart(product)}
                        className={`p-2 rounded-xl transition-all flex items-center gap-1 font-bold text-xs active:scale-95 ${
                          cartItem
                            ? 'bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300 shadow-xs'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80'
                        }`}
                        title={cartItem ? `No carrinho (${cartItem.suggestedQuantity} ${product.unit}). Clique para alterar.` : 'Adicionar ao Carrinho de Compras'}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{cartItem ? `${cartItem.suggestedQuantity} ${product.unit}` : '+ Carrinho'}</span>
                      </button>
                    )}

                    {isRecipe && onDischargeRecipe && (
                      <button
                        onClick={() => onDischargeRecipe(product)}
                        className="p-2 rounded-xl bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300 transition-colors flex items-center gap-1 font-bold"
                        title="Vender Lanche e Baixar Ingredientes"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Vender</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 font-semibold"
                      title={isRecipe ? "Editar Ficha Técnica" : "Editar Produto"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setProductToDelete(product)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add To Cart Modal */}
      <AddToCartModal
        isOpen={!!productForCart}
        product={productForCart}
        currentPurchaseItem={productForCart ? shoppingList.find(i => i.productId === productForCart.id) : null}
        onClose={() => setProductForCart(null)}
        onAddToCart={(productId, quantity) => {
          if (onAddToCart) {
            onAddToCart(productId, quantity);
          }
        }}
        onRemoveFromCart={(productId) => {
          if (onRemoveFromCart) {
            onRemoveFromCart(productId);
          }
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="EXCLUIR PRODUTO"
        message={`Tem certeza de que deseja remover o produto "${productToDelete?.name}" do estoque? Todos os dados associados a este produto serão excluídos.`}
        confirmLabel="SIM, EXCLUIR DEFINITIVAMENTE"
        onConfirm={() => {
          if (productToDelete) {
            onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
