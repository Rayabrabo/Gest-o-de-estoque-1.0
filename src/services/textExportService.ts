import { AuditRecord, PurchaseItem, Product, SystemSettings, ReportExportConfig, DEFAULT_REPORT_CONFIG } from '../types';
import { StorageService } from './storageService';

/**
 * Cleanly abbreviates units according to standard Portuguese notation
 */
export const formatUnitAbbrev = (unit: string | undefined, qty: number = 1): string => {
  if (!unit) return 'un.';
  const u = unit.trim().toLowerCase();
  if (u === 'unidade' || u === 'unidades' || u === 'un' || u === 'un.') return 'un.';
  if (u === 'caixa' || u === 'caixas' || u === 'cx' || u === 'cx.') return 'cx.';
  if (u === 'pacote' || u === 'pacotes' || u === 'pct' || u === 'pct.') return 'pct.';
  if (u === 'litro' || u === 'litros' || u === 'l' || u === 'l.') return 'L';
  if (u === 'kg' || u === 'quilo' || u === 'quilos' || u === 'kilo' || u === 'kilos') return 'kg';
  if (u === 'grama' || u === 'gramas' || u === 'g' || u === 'g.') return 'g';
  if (u === 'bandeja' || u === 'bandejas' || u === 'band' || u === 'band.') return qty > 1 ? 'bandejas' : 'bandeja';
  if (u === 'fardo' || u === 'fardos' || u === 'fd' || u === 'fd.') return 'fd.';
  return unit;
};

/**
 * Removes emojis from string for clean PDF rendering and pure typography
 */
export const stripEmojis = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{1F004}\u{1F0CF}\u{FE0F}]/gu, '')
    .trim();
};

export const TextExportService = {
  /**
   * Generates formatted text summary of full Inventory with customizable filters and columns
   */
  generateInventoryText(
    products: Product[], 
    settings?: SystemSettings, 
    customConfig?: Partial<ReportExportConfig>
  ): string {
    const config: ReportExportConfig = {
      ...DEFAULT_REPORT_CONFIG,
      ...(settings?.reportConfig || {}),
      ...(customConfig || {})
    };

    const company = settings?.companyName;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    
    // Filter products based on config
    let filteredProducts = [...products];

    // Filter recipes/lanches if disabled
    if (!config.includeRecipes) {
      filteredProducts = filteredProducts.filter(p => !p.isRecipe && !p.category.includes('Lanches'));
    }

    // Filter by stock level
    if (config.stockFilter === 'in_stock') {
      filteredProducts = filteredProducts.filter(p => p.quantity > 0);
    } else if (config.stockFilter === 'zero_only') {
      filteredProducts = filteredProducts.filter(p => p.quantity <= 0);
    } else if (config.stockFilter === 'critical_only') {
      filteredProducts = filteredProducts.filter(p => p.quantity <= p.minStock);
    }

    // Sort products by category priority
    const orderedProducts = StorageService.sortByCategoryOrder(filteredProducts, settings);
    const totalCount = orderedProducts.length;

    // 1. Cabeçalho
    let text = `📦 Resumo de Estoque\n\n`;
    if (company) {
      text += `Estabelecimento: ${company}\n`;
    }
    text += `Data: ${dateStr}\n`;
    text += `Total: ${totalCount} produtos\n`;

    if (config.stockFilter === 'in_stock') {
      text += `Filtro: Apenas itens com estoque atual (> 0)\n`;
    } else if (config.stockFilter === 'critical_only') {
      text += `Filtro: Apenas itens críticos ou zerados\n`;
    } else if (config.stockFilter === 'zero_only') {
      text += `Filtro: Apenas itens zerados\n`;
    }
    text += `\n`;

    // 2. Estoque Crítico (itens zerados e abaixo do estoque mínimo)
    const criticalItems = orderedProducts.filter(p => p.quantity <= p.minStock);
    
    if (config.includeCriticalSection && criticalItems.length > 0 && config.stockFilter !== 'zero_only') {
      // Sort critical items: zero stock first, then ascending quantity
      const sortedCritical = [...criticalItems].sort((a, b) => {
        if (a.quantity === 0 && b.quantity > 0) return -1;
        if (a.quantity > 0 && b.quantity === 0) return 1;
        return a.quantity - b.quantity;
      });

      text += `🚨 Estoque crítico — ${sortedCritical.length} itens\n\n`;
      
      if (config.showMinStock && config.showQuantity) {
        text += `Produto\tEstoque\tMínimo\n`;
        sortedCritical.forEach(p => {
          const qtyUnit = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
          const minUnit = `${p.minStock} ${formatUnitAbbrev(p.unit, p.minStock)}`;
          text += `${p.name}\t${qtyUnit}\t${minUnit}\n`;
        });
      } else if (config.showQuantity) {
        text += `Produto\tEstoque\n`;
        sortedCritical.forEach(p => {
          const qtyUnit = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
          text += `${p.name}\t${qtyUnit}\n`;
        });
      } else {
        sortedCritical.forEach(p => {
          text += `* ${p.name}\n`;
        });
      }
      text += `\n`;
    }

    // 3. Estoque por categoria
    text += `📋 Estoque por categoria\n\n`;

    // Group products by category
    const categoryMap = new Map<string, Product[]>();
    orderedProducts.forEach(p => {
      const cat = p.category || 'Outros';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(p);
    });

    let totalInventoryValue = 0;

    // Output each category with products
    categoryMap.forEach((items, category) => {
      text += `${category}\n\n`;
      items.forEach(p => {
        const costPrice = p.costPrice ?? p.price ?? 0;
        totalInventoryValue += (p.quantity * costPrice);

        let line = `* ${p.name}`;
        
        if (config.showQuantity) {
          const qtyUnit = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
          line += ` — ${qtyUnit}`;
        }

        if (config.showMinStock && p.minStock > 0) {
          line += ` (Mín: ${p.minStock} ${formatUnitAbbrev(p.unit, p.minStock)})`;
        }

        if (config.showCostPrice && costPrice > 0) {
          line += ` | Custo: R$ ${costPrice.toFixed(2).replace('.', ',')}`;
        }

        text += `${line}\n`;
      });
      text += `\n`;
    });

    if (config.showTotalValue && totalInventoryValue > 0 && config.showCostPrice) {
      text += `💵 VALOR ESTIMADO TOTAL DO ESTOQUE: R$ ${totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }

    return text.trim();
  },

  /**
   * Generates formatted text for Daily Audit / Conferência
   */
  generateAuditText(
    audit: AuditRecord, 
    settings?: SystemSettings,
    customConfig?: Partial<ReportExportConfig>
  ): string {
    const config: ReportExportConfig = {
      ...DEFAULT_REPORT_CONFIG,
      ...(settings?.reportConfig || {}),
      ...(customConfig || {})
    };

    const company = settings?.companyName;
    const dateStr = audit.date || new Date().toLocaleDateString('pt-BR');
    const timeStr = audit.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let text = `📋 Resumo de Conferência de Estoque\n\n`;
    if (company) {
      text += `Estabelecimento: ${company}\n`;
    }
    text += `Data: ${dateStr} às ${timeStr}\n`;
    text += `Total de Produtos: ${audit.totalProducts} | Conferidos: ${audit.auditedCount}\n`;
    text += `Status: ${audit.appliedToStock ? 'Estoque Atualizado no Sistema' : 'Salvo sem alterar estoque'}\n\n`;

    // Filter items if recipes excluded
    let displayItems = [...audit.items];
    if (!config.includeRecipes) {
      displayItems = displayItems.filter(i => !i.category.includes('Lanches'));
    }

    // Divergências
    const relevantChanges = audit.changes?.filter(c => {
      if (!config.includeRecipes) {
        const item = audit.items.find(i => i.productId === c.productId);
        if (item && item.category.includes('Lanches')) return false;
      }
      return true;
    }) || [];

    if (relevantChanges.length > 0) {
      text += `🚨 Divergências Encontradas — ${relevantChanges.length} itens\n\n`;
      text += `Produto\tSistema\tContado\tDiferença\n`;
      relevantChanges.forEach(c => {
        const sign = c.diff > 0 ? '+' : '';
        const oldU = `${c.oldQty} ${formatUnitAbbrev(c.unit, c.oldQty)}`;
        const newU = `${c.newQty} ${formatUnitAbbrev(c.unit, c.newQty)}`;
        const diffU = `${sign}${c.diff} ${formatUnitAbbrev(c.unit, Math.abs(c.diff))}`;
        text += `${c.productName}\t${oldU}\t${newU}\t${diffU}\n`;
      });
      text += `\n`;
    } else {
      text += `✅ Nenhuma divergência encontrada em relação ao sistema.\n\n`;
    }

    // Itens por categoria
    text += `📋 Estoque conferido por categoria\n\n`;
    const categoryMap = new Map<string, typeof displayItems>();
    displayItems.forEach(item => {
      const cat = item.category || 'Outros';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(item);
    });

    categoryMap.forEach((items, category) => {
      text += `${category}\n\n`;
      items.forEach(i => {
        const count = i.countedQuantity ?? i.registeredQuantity;
        let line = `* ${i.productName}`;
        if (config.showQuantity) {
          const countStr = `${count} ${formatUnitAbbrev(i.unit, count)}`;
          line += ` — ${countStr}`;
        }
        const statusTag = i.isAudited ? '' : ' (Pendente)';
        line += statusTag;
        text += `${line}\n`;
      });
      text += `\n`;
    });

    return text.trim();
  },

  /**
   * Generates formatted text for Shopping List (clean, direct product and quantity notation)
   */
  generateShoppingListText(
    items: PurchaseItem[], 
    settings?: SystemSettings,
    options?: {
      showCurrentStock?: boolean;
      showMinStock?: boolean;
      showPrices?: boolean;
    }
  ): string {
    const showPrices = options?.showPrices ?? false;
    const showCurrentStock = options?.showCurrentStock ?? false;
    const showMinStock = options?.showMinStock ?? (settings?.showMinStock === true);
    const company = settings?.companyName;
    const pendingItems = StorageService.sortByCategoryOrder(items.filter(i => !i.isPurchased), settings);

    let text = `🛒 Lista de Compras\n\n`;
    if (company) {
      text += `Estabelecimento: ${company}\n`;
    }
    text += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `Itens a comprar: ${pendingItems.length}\n\n`;

    if (pendingItems.length === 0) {
      text += `✅ Nenhum item pendente na lista de compras!\n`;
      return text;
    }

    let totalCost = 0;

    // Group items by category
    const categoryMap = new Map<string, PurchaseItem[]>();
    pendingItems.forEach(item => {
      const cat = item.category || 'Outros';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(item);
    });

    categoryMap.forEach((catItems, category) => {
      text += `${category}\n\n`;
      catItems.forEach(item => {
        const costPrice = item.costPrice ?? item.price ?? 0;
        const subtotal = item.suggestedQuantity * costPrice;
        totalCost += subtotal;

        const buyStr = `${item.suggestedQuantity} ${formatUnitAbbrev(item.unit, item.suggestedQuantity)}`;
        
        // Clean direct format: "* Produto — 2 kg" / "* Produto — 5 un." / "* Produto — 3 pct."
        let line = `* ${item.productName} — ${buyStr}`;

        const extraDetails: string[] = [];
        if (showCurrentStock) {
          const curStr = `${item.currentQuantity} ${formatUnitAbbrev(item.unit, item.currentQuantity)}`;
          extraDetails.push(`Atual: ${curStr}`);
        }
        if (showMinStock && item.minStock > 0) {
          const minStr = `${item.minStock} ${formatUnitAbbrev(item.unit, item.minStock)}`;
          extraDetails.push(`Mín: ${minStr}`);
        }

        if (extraDetails.length > 0) {
          line += ` (${extraDetails.join(' | ')})`;
        }

        if (showPrices && costPrice > 0) {
          line += ` | Custo: R$ ${costPrice.toFixed(2).replace('.', ',')} (Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')})`;
        }

        text += `${line}\n`;
      });
      text += `\n`;
    });

    if (showPrices && totalCost > 0) {
      text += `💵 GASTO ESTIMADO TOTAL: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    }

    return text.trim();
  },

  /**
   * Generates WhatsApp share URL with encoded text
   */
  getWhatsAppShareUrl(text: string): string {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  },

  /**
   * Copies string to system clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        return successful;
      }
    } catch {
      return false;
    }
  }
};
