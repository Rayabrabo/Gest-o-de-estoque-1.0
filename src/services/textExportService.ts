import { AuditRecord, PurchaseItem, Product, SystemSettings } from '../types';
import { StorageService } from './storageService';

export const TextExportService = {
  /**
   * Generates formatted text for Daily Audit / Conferência
   */
  generateAuditText(audit: AuditRecord, settings?: SystemSettings): string {
    const showPrices = settings?.showPrices !== false;
    const company = settings?.companyName || 'Estoque';

    let text = `📋 *CONFERÊNCIA DE ESTOQUE - ${company}*\n`;
    text += `📅 *Data:* ${audit.date} às ${audit.time}\n`;
    text += `📊 *Progresso:* ${audit.auditedCount} de ${audit.totalProducts} itens (${Math.round((audit.auditedCount / (audit.totalProducts || 1)) * 100)}%)\n`;
    text += `⚡ *Status:* ${audit.appliedToStock ? 'Estoque Atualizado no Sistema' : 'Salvo sem alterar estoque'}\n\n`;

    if (audit.changes && audit.changes.length > 0) {
      text += `🚨 *DIVERGÊNCIAS ENCONTRADAS (${audit.changes.length}):*\n`;
      audit.changes.forEach(c => {
        const sign = c.diff > 0 ? '+' : '';
        text += `• *${c.productName}:* sistema tinha ${c.oldQty} ${c.unit} ➔ encontrado ${c.newQty} ${c.unit} (${sign}${c.diff} ${c.unit})\n`;
      });
      text += `\n`;
    } else {
      text += `✅ *Nenhuma divergência encontrada em relação ao sistema.*\n\n`;
    }

    const auditedItems = StorageService.sortByCategoryOrder(audit.items.filter(i => i.isAudited), settings);
    if (auditedItems.length > 0) {
      text += `📦 *ITENS CONFERIDOS:* \n`;
      auditedItems.forEach(i => {
        const priceInfo = showPrices && i.price && i.price > 0 ? ` | R$ ${i.price.toFixed(2)}` : '';
        text += `• ${i.productName}: ${i.countedQuantity ?? i.registeredQuantity} ${i.unit}${priceInfo}\n`;
      });
    }

    const unAuditedItems = StorageService.sortByCategoryOrder(audit.items.filter(i => !i.isAudited), settings);
    if (unAuditedItems.length > 0) {
      text += `\n⏳ *ITENS NÃO CONFERIDOS (${unAuditedItems.length}):*\n`;
      unAuditedItems.forEach(i => {
        text += `• ${i.productName} (${i.category})\n`;
      });
    }

    return text.trim();
  },

  /**
   * Generates formatted text for Shopping List
   */
  generateShoppingListText(items: PurchaseItem[], settings?: SystemSettings): string {
    const showPrices = settings?.showPrices !== false;
    const company = settings?.companyName || 'Estoque';
    const pendingItems = StorageService.sortByCategoryOrder(items.filter(i => !i.isPurchased), settings);

    let text = `🛒 *LISTA DE COMPRAS - ${company}*\n`;
    text += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `📌 *Itens a comprar:* ${pendingItems.length}\n\n`;

    if (pendingItems.length === 0) {
      text += `✅ Nenhum item pendente na lista de compras!\n`;
      return text;
    }

    let totalCost = 0;
    let totalSell = 0;

    pendingItems.forEach((item, idx) => {
      const costPrice = item.costPrice ?? item.price ?? 0;
      const sellPrice = item.sellPrice ?? 0;
      const subtotalCost = item.suggestedQuantity * costPrice;
      const subtotalSell = item.suggestedQuantity * sellPrice;

      totalCost += subtotalCost;
      totalSell += subtotalSell;

      let priceText = '';
      if (showPrices) {
        if (costPrice > 0 && sellPrice > 0) {
          priceText = ` (Custo: R$ ${costPrice.toFixed(2)} un ➔ Total: R$ ${subtotalCost.toFixed(2)} | Venda: R$ ${sellPrice.toFixed(2)} un)`;
        } else if (costPrice > 0) {
          priceText = ` (Custo: R$ ${costPrice.toFixed(2)} un ➔ Total: R$ ${subtotalCost.toFixed(2)})`;
        } else if (sellPrice > 0) {
          priceText = ` (Venda: R$ ${sellPrice.toFixed(2)} un)`;
        }
      }

      text += `${idx + 1}. *${item.productName}* [${item.category}]: ${item.suggestedQuantity} ${item.unit}${priceText}\n`;
      text += `   ↳ Estoque atual: ${item.currentQuantity} ${item.unit} | Mín: ${item.minStock} ${item.unit}\n`;
    });

    if (showPrices) {
      if (totalCost > 0) {
        text += `\n💵 *TOTAL ESTIMADO A GASTAR (CUSTO):* R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      }
      if (totalSell > 0) {
        text += `📈 *VALOR TOTAL DE VENDA POTENCIAL:* R$ ${totalSell.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      }
    }

    return text.trim();
  },

  /**
   * Generates formatted text summary of full Inventory
   */
  generateInventoryText(products: Product[], settings?: SystemSettings): string {
    const showPrices = settings?.showPrices !== false;
    const company = settings?.companyName || 'Estoque';
    const orderedProducts = StorageService.sortByCategoryOrder(products, settings);

    let text = `📦 *RESUMO DE ESTOQUE - ${company}*\n`;
    text += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `📊 *Total de Produtos:* ${orderedProducts.length}\n\n`;

    const lowStock = orderedProducts.filter(p => p.quantity <= p.minStock);
    if (lowStock.length > 0) {
      text += `🚨 *PRODUTOS COM ESTOQUE CRÍTICO/BAIXO (${lowStock.length}):*\n`;
      lowStock.forEach(p => {
        text += `• *${p.name}*: ${p.quantity} ${p.unit} (Mínimo: ${p.minStock} ${p.unit})\n`;
      });
      text += `\n`;
    }

    text += `📋 *LISTA COMPLETA:* \n`;
    orderedProducts.forEach(p => {
      const cost = p.costPrice ?? p.price ?? 0;
      const sell = p.sellPrice ?? 0;
      let priceStr = '';
      if (showPrices) {
        if (cost > 0 && sell > 0) {
          priceStr = ` | Custo: R$ ${cost.toFixed(2)} - Venda: R$ ${sell.toFixed(2)}`;
        } else if (cost > 0) {
          priceStr = ` | Custo: R$ ${cost.toFixed(2)}`;
        } else if (sell > 0) {
          priceStr = ` | Venda: R$ ${sell.toFixed(2)}`;
        }
      }
      text += `• ${p.name}: ${p.quantity} ${p.unit} (${p.category})${priceStr}\n`;
    });

    if (showPrices) {
      const totalCostVal = orderedProducts.reduce((acc, p) => acc + (p.quantity * (p.costPrice ?? p.price ?? 0)), 0);
      const totalSellVal = orderedProducts.reduce((acc, p) => acc + (p.quantity * (p.sellPrice ?? 0)), 0);

      if (totalCostVal > 0) {
        text += `\n💵 *PATRIMÔNIO EM CUSTO NO ESTOQUE:* R$ ${totalCostVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
      if (totalSellVal > 0) {
        text += `📈 *VALOR POTENCIAL DE VENDA EM ESTOQUE:* R$ ${totalSellVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
    }

    return text.trim();
  },

  /**
   * Copies string to system clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch {
      return false;
    }
  },

  /**
   * Generates WhatsApp direct web/app link
   */
  getWhatsAppShareUrl(text: string): string {
    const encoded = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?text=${encoded}`;
  }
};
