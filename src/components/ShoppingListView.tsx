import React, { useState } from 'react';
import { 
  ShoppingCart, 
  CheckSquare, 
  Square, 
  FileText, 
  ShieldCheck, 
  DollarSign, 
  AlertCircle,
  Clock,
  Sparkles,
  MessageSquare,
  Plus,
  Minus,
  Trash2,
  PackagePlus,
  Search,
  Layers,
  Pencil
} from 'lucide-react';
import { Product, PurchaseItem, SystemSettings, Unit } from '../types';
import { TextExportService } from '../services/textExportService';
import { StorageService } from '../services/storageService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { AddToCartModal } from './AddToCartModal';
import { CategoryOrderModal } from './CategoryOrderModal';

interface ShoppingListViewProps {
  products: Product[];
  shoppingItems: PurchaseItem[];
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onTogglePurchased: (productId: string) => void;
  onUpdateItemQuantity?: (productId: string, quantity: number) => void;
  onRemoveFromCart?: (productId: string) => void;
  onAddToCart?: (
    productId: string, 
    quantity: number,
    customFields?: {
      unit?: Unit;
      costPrice?: number;
      category?: string;
    }
  ) => void;
  onExportPDF: () => void;
  categories?: string[];
  onAddCategory?: (newCategory: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  products,
  shoppingItems,
  settings,
  onUpdateSettings,
  onTogglePurchased,
  onUpdateItemQuantity,
  onRemoveFromCart,
  onAddToCart,
  onExportPDF,
  categories = [],
  onAddCategory
}) => {
  const [safetyDaysInput, setSafetyDaysInput] = useState<number>(settings.safetyDays || 7);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [isSelectProductModalOpen, setIsSelectProductModalOpen] = useState(false);
  const [isCategoryOrderModalOpen, setIsCategoryOrderModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  const showPrices = settings.showPrices !== false;
  const pendingList = StorageService.sortByCategoryOrder(
    shoppingItems.filter(item => !item.isPurchased),
    settings
  );
  const purchasedList = StorageService.sortByCategoryOrder(
    shoppingItems.filter(item => item.isPurchased),
    settings
  );

  const grandTotalPendingCost = pendingList.reduce((acc, item) => {
    const p = products.find(pr => pr.id === item.productId);
    const cost = item.costPrice ?? item.price ?? p?.costPrice ?? p?.price ?? 0;
    return acc + (item.suggestedQuantity * cost);
  }, 0);

  const grandTotalPendingSell = pendingList.reduce((acc, item) => {
    const p = products.find(pr => pr.id === item.productId);
    const sell = item.sellPrice ?? p?.sellPrice ?? 0;
    return acc + (item.suggestedQuantity * sell);
  }, 0);

  const handleSafetyDaysChange = (val: number) => {
    const cleanVal = Math.max(1, Math.min(60, val));
    setSafetyDaysInput(cleanVal);
    onUpdateSettings({ ...settings, safetyDays: cleanVal });
  };

  const handleOpenWhatsAppText = () => {
    const txt = TextExportService.generateShoppingListText(shoppingItems, settings);
    setShareText(txt);
    setIsShareModalOpen(true);
  };

  const availableProductsToAdd = products.filter(p => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-purple-600" />
            <span>LISTA DE COMPRAS E CARRINHO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sugestão automática de reposição e inclusão manual de itens para compras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCategoryOrderModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-all text-xs active:scale-95 shrink-0 cursor-pointer"
            title="Organizar a ordem em que as categorias aparecem no PDF e WhatsApp"
          >
            <Layers className="w-4 h-4 text-purple-700" />
            <span>ORDEM DAS CATEGORIAS</span>
          </button>

          <button
            onClick={() => {
              setCatalogSearch('');
              setIsSelectProductModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-4 py-2.5 rounded-xl border border-purple-300 transition-all text-sm active:scale-95 shrink-0 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4 text-purple-700" />
            <span>+ ADICIONAR ITEM AO CARRINHO</span>
          </button>

          <button
            onClick={handleOpenWhatsAppText}
            disabled={shoppingItems.length === 0}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95 shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>TEXTO WHATSAPP</span>
          </button>

          <button
            onClick={onExportPDF}
            disabled={shoppingItems.length === 0}
            className="flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all text-sm active:scale-95 shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>📄 GERAR PDF</span>
          </button>
        </div>
      </div>

      {/* Shopping Mode & Smart Config Box */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-purple-950 text-white p-5 rounded-2xl border border-purple-800/60 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-300">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                {settings.autoGenerateShopping ? 'Reposição Automática Ativada' : 'Modo Manual de Compras (Ativo)'}
              </h3>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                settings.autoGenerateShopping ? 'bg-purple-500/30 text-purple-200' : 'bg-emerald-500/30 text-emerald-300'
              }`}>
                {settings.autoGenerateShopping ? 'Auto' : 'Manual'}
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-0.5">
              {settings.autoGenerateShopping
                ? `Itens abaixo do mínimo ou com estoque para menos de ${safetyDaysInput} dias entram no carrinho.`
                : 'Você tem controle total: adicione os itens manualmente e edite a quantidade em quilos ou unidades.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, autoGenerateShopping: !settings.autoGenerateShopping })}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              settings.autoGenerateShopping
                ? 'bg-purple-600/40 hover:bg-purple-600/60 border-purple-400 text-purple-100'
                : 'bg-emerald-600/40 hover:bg-emerald-600/60 border-emerald-400 text-emerald-100'
            }`}
          >
            {settings.autoGenerateShopping ? 'Trocar para Manual' : 'Usar Modo Manual'}
          </button>

          {settings.autoGenerateShopping && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-purple-500/30">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <label className="text-xs font-semibold text-slate-200">Segurança:</label>
              <input
                type="number"
                min="1"
                max="60"
                value={safetyDaysInput}
                onChange={(e) => handleSafetyDaysChange(parseInt(e.target.value) || 1)}
                className="w-14 px-1.5 py-0.5 rounded-lg bg-slate-900 border border-purple-400 text-center font-bold text-xs text-purple-300 focus:outline-none"
              />
              <span className="text-xs text-slate-400">dias</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Purchase Pending Items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>🛒 ITENS NO CARRINHO DE COMPRAS</span>
            <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-extrabold">
              {pendingList.length}
            </span>
          </h3>

          {showPrices && (
            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-purple-900 block">
                Gasto Estimado (Custo): R$ {grandTotalPendingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {grandTotalPendingSell > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 block">
                  Valor em Venda Potencial: R$ {grandTotalPendingSell.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          )}
        </div>

        {pendingList.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <div>
              <p className="text-base font-bold text-slate-800">Carrinho de Compras Vazio</p>
              <p className="text-xs text-slate-500 mt-1">
                Nenhum produto está abaixo do estoque mínimo. Você também pode adicionar itens manualmente a qualquer momento.
              </p>
            </div>
            <button
              onClick={() => setIsSelectProductModalOpen(true)}
              className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Adicionar Produto ao Carrinho</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingList.map(item => {
              const product = products.find(p => p.id === item.productId);
              const costPrice = item.costPrice ?? item.price ?? product?.costPrice ?? product?.price ?? 0;
              const sellPrice = item.sellPrice ?? product?.sellPrice ?? 0;
              const estTotalCost = item.suggestedQuantity * costPrice;
              const avgDaily = product?.avgDailyConsumption || 0;
              const daysRemaining = avgDaily > 0 ? (item.currentQuantity / avgDaily).toFixed(1) : '∞';

              return (
                <div key={item.productId} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Interactive Checkbox */}
                    <button
                      onClick={() => onTogglePurchased(item.productId)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                      title="Marcar como comprado"
                    >
                      <Square className="w-5 h-5" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base truncate">{item.productName}</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Estoque Atual: <span className={`font-bold ${item.currentQuantity <= 0 ? 'text-rose-600' : 'text-slate-800'}`}>{item.currentQuantity} {item.unit}</span>
                        {settings.showMinStock === true && item.minStock > 0 && (
                          <span> | Mínimo: <span className="font-semibold text-slate-600">{item.minStock} {item.unit}</span></span>
                        )}
                      </p>

                      {avgDaily > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-500" />
                          Consumo médio: {avgDaily} {item.unit}/dia • Duração estimada: <strong className="text-slate-700">{daysRemaining} dias</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Pricing */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 bg-purple-50/60 p-3 rounded-2xl border border-purple-100 shrink-0">
                    
                    {/* Quantity Stepper */}
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-[10px] font-bold text-purple-900 uppercase">Qtd. a Comprar</span>
                      <div className="flex items-center gap-1.5 mt-1 bg-white p-1 rounded-xl border border-purple-200 shadow-2xs">
                        {(() => {
                          const isDecimalUnit = ['Kg', 'Grama', 'Litro'].includes(item.unit);
                          const step = isDecimalUnit ? 0.5 : 1;
                          return (
                            <>
                              <button
                                onClick={() => {
                                  if (onUpdateItemQuantity) {
                                    const next = Number(Math.max(isDecimalUnit ? 0.1 : 1, item.suggestedQuantity - step).toFixed(2));
                                    onUpdateItemQuantity(item.productId, next);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                title={`Diminuir ${step}`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              
                              <input
                                type="number"
                                min={isDecimalUnit ? "0.05" : "1"}
                                step={isDecimalUnit ? "0.1" : "1"}
                                value={item.suggestedQuantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (onUpdateItemQuantity && !isNaN(val) && val > 0) {
                                    onUpdateItemQuantity(item.productId, val);
                                  }
                                }}
                                className="w-16 text-center font-black text-sm text-purple-950 bg-transparent focus:outline-none"
                              />

                              <span className="text-[11px] font-semibold text-slate-500 pr-1">{item.unit}</span>

                              <button
                                onClick={() => {
                                  if (onUpdateItemQuantity) {
                                    const next = Number((item.suggestedQuantity + step).toFixed(2));
                                    onUpdateItemQuantity(item.productId, next);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                title={`Aumentar ${step}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {showPrices && (
                      <div className="text-right pl-3 border-l border-purple-200 space-y-1">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Gasto p/ Comprar</p>
                          {costPrice > 0 ? (
                            <>
                              <p className="text-sm font-extrabold text-slate-900">
                                R$ {estTotalCost.toFixed(2).replace('.', ',')}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Custo: R$ {costPrice.toFixed(2).replace('.', ',')} / {item.unit}
                              </p>
                            </>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Custo não informado</p>
                          )}
                        </div>

                        {sellPrice > 0 && (
                          <div className="pt-1 border-t border-purple-200/60">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase">Preço de Venda</p>
                            <p className="text-xs font-bold text-emerald-800">
                              R$ {sellPrice.toFixed(2).replace('.', ',')} / {item.unit}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        const prod = products.find(p => p.id === item.productId) || {
                          id: item.productId,
                          name: item.productName,
                          category: item.category,
                          quantity: item.currentQuantity,
                          unit: item.unit,
                          minStock: item.minStock,
                          costPrice: item.costPrice ?? item.price,
                          price: item.costPrice ?? item.price,
                          createdAt: ''
                        } as Product;
                        setSelectedProductForCart(prod);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                      title="Editar quantidade, valor, unidade e categoria"
                    >
                      <Pencil className="w-3.5 h-3.5 text-purple-700" />
                      <span>Editar</span>
                    </button>

                    {/* Remove from cart button */}
                    {onRemoveFromCart && (
                      <button
                        onClick={() => onRemoveFromCart(item.productId)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-100/80 transition-colors ml-1 cursor-pointer"
                        title="Remover do carrinho de compras"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Already Purchased / Completed List Section */}
      {purchasedList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 opacity-80">
          <h3 className="font-bold text-slate-600 text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>ITENS JÁ COMPRADOS ({purchasedList.length})</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {purchasedList.map(item => (
              <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <button onClick={() => onTogglePurchased(item.productId)}>
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  </button>
                  <span className="line-through font-medium">{item.productName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {item.suggestedQuantity} {item.unit} comprados
                  </span>
                  {onRemoveFromCart && (
                    <button
                      onClick={() => onRemoveFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remover do histórico de compras"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select Product To Add Modal */}
      {isSelectProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">SELECIONAR PRODUTO</h3>
                  <p className="text-xs text-slate-500">Escolha um item do estoque para adicionar ao carrinho</p>
                </div>
              </div>
              <button
                onClick={() => setIsSelectProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar produto por nome ou categoria..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-72 border border-slate-100 rounded-xl p-1">
              {availableProductsToAdd.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhum produto encontrado com esse termo.
                </div>
              ) : (
                availableProductsToAdd.map(p => {
                  const alreadyInCart = shoppingItems.find(i => i.productId === p.id && !i.isPurchased);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProductForCart(p);
                        setIsSelectProductModalOpen(false);
                      }}
                      className="p-3 hover:bg-purple-50 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900 group-hover:text-purple-900">{p.name}</p>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Estoque Atual: <strong>{p.quantity} {p.unit}</strong> | Mínimo: {p.minStock} {p.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {alreadyInCart ? (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-lg">
                            {alreadyInCart.suggestedQuantity} no carrinho
                          </span>
                        ) : (
                          <button className="text-xs font-bold text-purple-700 group-hover:bg-purple-200 px-3 py-1.5 rounded-lg bg-purple-100 transition-colors">
                            + Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add To Cart Stepper Modal */}
      <AddToCartModal
        isOpen={!!selectedProductForCart}
        product={selectedProductForCart}
        currentPurchaseItem={selectedProductForCart ? shoppingItems.find(i => i.productId === selectedProductForCart.id) : null}
        availableCategories={categories}
        onClose={() => setSelectedProductForCart(null)}
        onAddToCart={(productId, quantity, customFields) => {
          if (onAddToCart) {
            onAddToCart(productId, quantity, customFields);
          }
        }}
        onRemoveFromCart={(productId) => {
          if (onRemoveFromCart) {
            onRemoveFromCart(productId);
          }
        }}
        onAddCategory={onAddCategory}
      />

      {/* WhatsApp Share Modal */}
      {shareText && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="LISTA DE COMPRAS — COPIAR PARA WHATSAPP"
          subtitle="A lista de compras foi formatada com sucesso em texto para cópia ou envio direto."
          textToShare={shareText}
        />
      )}
      {/* Category Order Modal */}
      <CategoryOrderModal
        isOpen={isCategoryOrderModalOpen}
        onClose={() => setIsCategoryOrderModalOpen(false)}
        settings={settings}
        onSaveSettings={onUpdateSettings}
        existingCategories={categories}
      />
    </div>
  );
};
