import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, AuditRecord, SystemSettings, PurchaseItem } from '../types';
import { StorageService } from './storageService';
import { getThemeConfig } from '../utils/themeUtils';

export class PdfService {
  /**
   * Helper to safely render custom company logo if available in base64 data URL
   */
  private static renderLogoHeader(doc: jsPDF, logoUrl: string | undefined): boolean {
    if (!logoUrl) return false;
    try {
      if (logoUrl.startsWith('data:image/')) {
        doc.addImage(logoUrl, 'PNG', 174, 4, 22, 20);
        return true;
      }
    } catch {
      // Ignore if image rendering fails
    }
    return false;
  }

  /**
   * Generates Inventory & Audit PDF Report
   */
  static generateInventoryReport(
    products: Product[],
    latestAudit: AuditRecord | null,
    settings: SystemSettings
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const theme = getThemeConfig(settings);

    // Sort products by user's preferred category order
    const orderedProducts = StorageService.sortByCategoryOrder(products, settings);

    // Title Header
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 28, 'F');

    // Accent line in theme color
    doc.setFillColor(theme.pdfHeaderRgb[0], theme.pdfHeaderRgb[1], theme.pdfHeaderRgb[2]);
    doc.rect(0, 26, 210, 2, 'F');

    const hasLogo = this.renderLogoHeader(doc, settings.logoUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(settings.appName.toUpperCase() || 'SISTEMA DE GESTÃO DE ESTOQUE', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const compText = settings.companyName ? `${settings.companyName} • ` : '';
    doc.text(`${compText}RELATÓRIO DE ESTOQUE E CONFERÊNCIA`, 14, 20);

    doc.setFontSize(8.5);
    doc.text(`Gerado em: ${formattedDate} às ${formattedTime}`, hasLogo ? 100 : 140, 20);

    // Summary KPIs Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DO ESTOQUE', 14, 36);

    const showPrices = settings.showPrices !== false;
    const totalProducts = orderedProducts.length;
    const normalStock = orderedProducts.filter(p => p.quantity > p.minStock).length;
    const lowStock = orderedProducts.filter(p => p.quantity <= p.minStock && p.quantity > 0).length;
    const zeroStock = orderedProducts.filter(p => p.quantity <= 0).length;
    const totalEstValueCost = orderedProducts.reduce((acc, p) => acc + p.quantity * (p.costPrice ?? p.price ?? 0), 0);
    const totalEstValueSell = orderedProducts.reduce((acc, p) => acc + p.quantity * (p.sellPrice ?? 0), 0);

    const pendingAuditCount = latestAudit
      ? orderedProducts.filter(p => !latestAudit.items.some(i => i.productId === p.id && i.isAudited)).length
      : totalProducts;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 40, 182, 22, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Total de Produtos: ${totalProducts}`, 18, 47);
    doc.text(`• Estoque Normal: ${normalStock}`, 18, 52);
    doc.text(`• Estoque Baixo / Zerado: ${lowStock + zeroStock}`, 18, 57);

    doc.text(`• Produtos Pendentes de Conferência: ${pendingAuditCount}`, 80, 47);
    if (showPrices) {
      doc.text(`• Patrimônio em Custo: R$ ${totalEstValueCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, 52);
      if (totalEstValueSell > 0) {
        doc.text(`• Valor Potencial de Venda: R$ ${totalEstValueSell.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, 57);
      }
    } else {
      doc.text(`• Exibição de Valores Financeiros: Desativada`, 80, 52);
    }

    // Main Table sorted by user defined category order
    const tableData = orderedProducts.map(p => {
      const costVal = p.costPrice ?? p.price ?? 0;
      const sellVal = p.sellPrice ?? 0;
      const totalCostVal = p.quantity * costVal;
      let statusStr = '🟢 NORMAL';
      if (p.quantity <= 0) {
        statusStr = '🔴 COMPRAR (ZERADO)';
      } else if (p.quantity <= p.minStock) {
        statusStr = '🟡 ESTOQUE BAIXO';
      }

      return [
        p.name,
        p.category,
        `${p.quantity} ${p.unit}`,
        showPrices && costVal > 0 ? `R$ ${costVal.toFixed(2).replace('.', ',')}` : '-',
        showPrices && sellVal > 0 ? `R$ ${sellVal.toFixed(2).replace('.', ',')}` : '-',
        showPrices && costVal > 0 ? `R$ ${totalCostVal.toFixed(2).replace('.', ',')}` : '-',
        statusStr
      ];
    });

    autoTable(doc, {
      startY: 68,
      head: [['Produto', 'Categoria', 'Qtd', 'P. Custo', 'P. Venda', 'Total Custo', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 },
        6: { cellWidth: 23 }
      }
    });

    // Add footer with page numbering and app branding
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Página ${i} de ${pageCount} — Relatório de Estoque — ${settings.companyName || settings.appName}`,
        14,
        287
      );
      doc.text(`Emitido em: ${formattedDate} ${formattedTime}`, 145, 287);
    }

    doc.save(`Relatorio_Estoque_${formattedDate.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Generates Shopping List PDF Report
   */
  static generateShoppingListReport(
    shoppingList: PurchaseItem[],
    settings: SystemSettings
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const theme = getThemeConfig(settings);

    // Sort shopping list items by user's configured category order
    const orderedShopping = StorageService.sortByCategoryOrder(shoppingList, settings);

    // Title Header
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, 210, 28, 'F');

    // Accent line in theme color
    doc.setFillColor(theme.pdfHeaderRgb[0], theme.pdfHeaderRgb[1], theme.pdfHeaderRgb[2]);
    doc.rect(0, 26, 210, 2, 'F');

    const hasLogo = this.renderLogoHeader(doc, settings.logoUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE COMPRAS', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const compText = settings.companyName ? `${settings.companyName} • ` : '';
    doc.text(`${compText}LISTA DE SUGESTÃO DE COMPRAS — ${settings.appName.toUpperCase()}`, 14, 20);

    doc.setFontSize(8.5);
    doc.text(`Data: ${formattedDate} às ${formattedTime}`, hasLogo ? 100 : 140, 20);

    const showPrices = settings.showPrices !== false;

    // Main Shopping Table with Category
    const tableData = orderedShopping.map(item => {
      const costVal = item.costPrice ?? item.price ?? 0;
      const sellVal = item.sellPrice ?? 0;
      const totalCostEst = item.suggestedQuantity * costVal;
      return [
        item.productName,
        item.category,
        `${item.currentQuantity} ${item.unit}`,
        `${item.suggestedQuantity} ${item.unit}`,
        showPrices && costVal > 0 ? `R$ ${costVal.toFixed(2).replace('.', ',')}` : '-',
        showPrices && totalCostEst > 0 ? `R$ ${totalCostEst.toFixed(2).replace('.', ',')}` : '-',
        showPrices && sellVal > 0 ? `R$ ${sellVal.toFixed(2).replace('.', ',')}` : '-'
      ];
    });

    autoTable(doc, {
      startY: 36,
      head: [['Produto', 'Categoria', 'Est. Atual', 'Comprar', 'P. Custo', 'Gasto Custo', 'P. Venda']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      }
    });

    if (showPrices) {
      const grandTotalCost = orderedShopping.reduce((acc, item) => acc + (item.suggestedQuantity * (item.costPrice ?? item.price ?? 0)), 0);
      const grandTotalSell = orderedShopping.reduce((acc, item) => acc + (item.suggestedQuantity * (item.sellPrice ?? 0)), 0);
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, finalY + 6, 182, grandTotalSell > 0 ? 20 : 14, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('GASTO ESTIMADO DA COMPRA (CUSTO):', 20, finalY + 13);
      doc.text(`R$ ${grandTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 130, finalY + 13);

      if (grandTotalSell > 0) {
        doc.setFontSize(9);
        doc.setTextColor(5, 150, 105); // Emerald-600
        doc.text('VALOR POTENCIAL DE VENDA:', 20, finalY + 19);
        doc.text(`R$ ${grandTotalSell.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 130, finalY + 19);
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Página ${i} de ${pageCount} — Lista de Compras — ${settings.companyName || settings.appName}`,
        14,
        287
      );
      doc.text(`Emitido em: ${formattedDate} ${formattedTime}`, 145, 287);
    }

    doc.save(`Lista_de_Compras_${formattedDate.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Generates Stock Audit (Conferência) PDF Report
   */
  static generateAuditReport(
    audit: AuditRecord,
    products: Product[],
    settings: SystemSettings
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = audit.date || now.toLocaleDateString('pt-BR');
    const formattedTime = audit.time || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const theme = getThemeConfig(settings);

    // Title Header
    doc.setFillColor(15, 23, 42); // Dark Navy
    doc.rect(0, 0, 210, 28, 'F');

    // Accent line in theme color
    doc.setFillColor(theme.pdfHeaderRgb[0], theme.pdfHeaderRgb[1], theme.pdfHeaderRgb[2]);
    doc.rect(0, 26, 210, 2, 'F');

    const hasLogo = this.renderLogoHeader(doc, settings.logoUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE CONFERÊNCIA DE ESTOQUE', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const compText = settings.companyName ? `${settings.companyName} • ` : '';
    doc.text(`${compText}AUDITORIA FÍSICA — ${settings.appName.toUpperCase()}`, 14, 20);

    doc.setFontSize(8.5);
    doc.text(`Data: ${formattedDate} às ${formattedTime}`, hasLogo ? 100 : 140, 20);

    // Summary Box
    const totalItems = audit.totalProducts || audit.items.length;
    const auditedItems = audit.auditedCount || audit.items.filter(i => i.isAudited).length;
    const pendingItems = totalItems - auditedItems;
    const changesCount = audit.changes?.length || audit.items.filter(i => i.isAudited && i.countedQuantity !== null && i.countedQuantity !== i.registeredQuantity).length;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 34, 182, 22, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`• Total de Produtos: ${totalItems}`, 18, 41);
    doc.text(`• Itens Conferidos: ${auditedItems}`, 18, 47);
    doc.text(`• Itens Pendentes: ${pendingItems}`, 18, 52);

    doc.text(`• Divergências Encontradas: ${changesCount}`, 85, 41);
    doc.text(`• Status: ${audit.isCompleted ? 'Concluída' : 'Em Andamento'}`, 85, 47);
    doc.text(`• Aplicado ao Estoque: ${audit.appliedToStock ? 'SIM (Estoque Atualizado)' : 'NÃO (Apenas Registro)'}`, 85, 52);

    // Sort audit items using user's category priority
    const categorySortedItems = [...audit.items].sort((a, b) => {
      const catOrder = settings.categoryOrder || [];
      const indexA = catOrder.indexOf(a.category);
      const indexB = catOrder.indexOf(b.category);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.category.localeCompare(b.category);
    });

    const tableData = categorySortedItems.map(item => {
      const counted = item.countedQuantity ?? item.registeredQuantity;
      const diff = Math.round((counted - item.registeredQuantity) * 100) / 100;
      let statusStr = 'PENDENTE';
      if (item.isAudited) {
        if (diff === 0) {
          statusStr = 'OK (Conferido)';
        } else if (diff > 0) {
          statusStr = `SOBRA (+${diff} ${item.unit})`;
        } else {
          statusStr = `FALTA (${diff} ${item.unit})`;
        }
      }

      return [
        item.productName,
        item.category,
        `${item.registeredQuantity} ${item.unit}`,
        item.isAudited ? `${counted} ${item.unit}` : 'Não contado',
        item.isAudited ? (diff > 0 ? `+${diff}` : `${diff}`) : '-',
        statusStr
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: [['Produto', 'Categoria', 'Qtd Sistema', 'Qtd Contada', 'Diferença', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2
      },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 36 },
        2: { cellWidth: 24 },
        3: { cellWidth: 24 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const text = String(data.cell.raw);
          if (text.includes('FALTA')) {
            data.cell.styles.textColor = [225, 29, 72]; // Rose-600
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('SOBRA')) {
            data.cell.styles.textColor = [5, 150, 105]; // Emerald-600
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('OK')) {
            data.cell.styles.textColor = [16, 185, 129];
          } else {
            data.cell.styles.textColor = [100, 116, 139]; // Slate-500
          }
        }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Página ${i} de ${pageCount} — Relatório de Conferência — ${settings.companyName || settings.appName}`,
        14,
        287
      );
      doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 140, 287);
    }

    doc.save(`Conferencia_Estoque_${formattedDate.replace(/\//g, '-')}.pdf`);
  }
}
