import { AuditRecord, PurchaseItem, Product, SystemSettings } from '../types';
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
   * Generates formatted text summary of full Inventory following user's exact specification
   */
  generateInventoryText(products: Product[], settings?: SystemSettings): string {
    const company = settings?.companyName;
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    
    // Sort products by category priority
    const orderedProducts = StorageService.sortByCategoryOrder(products, settings);
    const totalCount = orderedProducts.length;

    // 1. Cabeçalho
    let text = `📦 Resumo de Estoque\n\n`;
    if (company) {
      text += `Estabelecimento: ${company}\n`;
    }
    text += `Data: ${dateStr}\n`;
    text += `Total: ${totalCount} produtos\n\n`;

    // 2. Estoque Crítico (itens zerados e abaixo do estoque mínimo)
    const criticalItems = orderedProducts.filter(p => p.quantity <= p.minStock);
    
    if (criticalItems.length > 0) {
      // Sort critical items: zero stock first, then ascending quantity
      const sortedCritical = [...criticalItems].sort((a, b) => {
        if (a.quantity === 0 && b.quantity > 0) return -1;
        if (a.quantity > 0 && b.quantity === 0) return 1;
        return a.quantity - b.quantity;
      });

      text += `🚨 Estoque crítico — ${sortedCritical.length} itens\n\n`;
      text += `Produto\tEstoque\tMínimo\n`;

      sortedCritical.forEach(p => {
        const qtyUnit = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
        const minUnit = `${p.minStock} ${formatUnitAbbrev(p.unit, p.minStock)}`;
        text += `${p.name}\t${qtyUnit}\t${minUnit}\n`;
      });
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

    // Output each category with products
    categoryMap.forEach((items, category) => {
      text += `${category}\n\n`;
      items.forEach(p => {
        const qtyUnit = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
        text += `* ${p.name} — ${qtyUnit}\n`;
      });
      text += `\n`;
    });

    return text.trim();
  },

  /**
   * Generates formatted text for Daily Audit / Conferência
   */
  generateAuditText(audit: AuditRecord, settings?: SystemSettings): string {
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

    // Divergências
    if (audit.changes && audit.changes.length > 0) {
      text += `🚨 Divergências Encontradas — ${audit.changes.length} itens\n\n`;
      text += `Produto\tSistema\tContado\tDiferença\n`;
      audit.changes.forEach(c => {
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
    const categoryMap = new Map<string, typeof audit.items>();
    audit.items.forEach(item => {
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
        const countStr = `${count} ${formatUnitAbbrev(i.unit, count)}`;
        const statusTag = i.isAudited ? '' : ' (Pendente)';
        text += `* ${i.productName} — ${countStr}${statusTag}\n`;
      });
      text += `\n`;
    });

    return text.trim();
  },

  /**
   * Generates formatted text for Shopping List
   */
  generateShoppingListText(items: PurchaseItem[], settings?: SystemSettings): string {
    const showPrices = settings?.showPrices !== false;
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
        const curStr = `${item.currentQuantity} ${formatUnitAbbrev(item.unit, item.currentQuantity)}`;
        const minStr = `${item.minStock} ${formatUnitAbbrev(item.unit, item.minStock)}`;

        let priceText = '';
        if (showPrices && costPrice > 0) {
          priceText = ` | Custo: R$ ${costPrice.toFixed(2)} un (Subtotal: R$ ${subtotal.toFixed(2)})`;
        }

        text += `* ${item.productName} — Comprar ${buyStr} (Atual: ${curStr} | Mín: ${minStr})${priceText}\n`;
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
