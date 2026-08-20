import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { Product, AuditRecord, SystemSettings, PurchaseItem, ReportExportConfig, DEFAULT_REPORT_CONFIG } from '../types';
import { StorageService } from './storageService';
import { getThemeConfig } from '../utils/themeUtils';
import { formatUnitAbbrev, stripEmojis } from './textExportService';

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
   * Generates Clean & Professional Inventory PDF Report (Resumo de Estoque)
   * Strictly without emojis to ensure pure typography and zero visual clutter.
   * Fully customizable with ReportExportConfig options.
   */
  static generateInventoryReport(
    products: Product[],
    latestAudit: AuditRecord | null,
    settings: SystemSettings,
    customConfig?: Partial<ReportExportConfig>
  ): void {
    const config: ReportExportConfig = {
      ...DEFAULT_REPORT_CONFIG,
      ...(settings?.reportConfig || {}),
      ...(customConfig || {})
    };

    // Verifica se a exibição do estoque mínimo está ativada nas configurações gerais ou no relatório
    const shouldShowMinStock = (customConfig?.showMinStock !== undefined)
      ? !!customConfig.showMinStock
      : (config.showMinStock === true && settings?.showMinStock === true);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const theme = getThemeConfig(settings);

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
      filteredProducts = filteredProducts.filter(p => shouldShowMinStock ? p.quantity <= p.minStock : p.quantity <= 0);
    }

    // Sort products by user-configured category priority
    const orderedProducts = StorageService.sortByCategoryOrder(filteredProducts, settings);
    const totalProducts = orderedProducts.length;

    // 1. Cabeçalho Minimalista & Elegante
    doc.setFillColor(15, 23, 42); // Slate-900 / Dark Navy
    doc.rect(0, 0, 210, 26, 'F');

    // Accent line in theme color
    doc.setFillColor(theme.pdfHeaderRgb[0], theme.pdfHeaderRgb[1], theme.pdfHeaderRgb[2]);
    doc.rect(0, 24.5, 210, 1.5, 'F');

    const hasLogo = this.renderLogoHeader(doc, settings.logoUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('RESUMO DE ESTOQUE', 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const company = settings.companyName || 'Meu Estabelecimento';
    doc.text(`Estabelecimento: ${company}`, 14, 18);

    doc.setFontSize(8);
    let filterSubtitle = `Data do relatório: ${formattedDate} às ${formattedTime}`;
    if (config.stockFilter === 'in_stock') {
      filterSubtitle += ' (Apenas Itens em Estoque)';
    } else if (config.stockFilter === 'critical_only') {
      filterSubtitle += shouldShowMinStock ? ' (Apenas Itens Críticos / Baixos)' : ' (Apenas Itens Zerados)';
    } else if (config.stockFilter === 'zero_only') {
      filterSubtitle += ' (Apenas Itens Zerados)';
    }
    doc.text(filterSubtitle, hasLogo ? 85 : 120, 18);

    let currentY = 30;

    // 2. Resumo de Situação (Box de Indicadores)
    const zeroStockItems = orderedProducts.filter(p => p.quantity <= 0);
    const inStockItems = orderedProducts.filter(p => p.quantity > 0);
    const lowStockItems = shouldShowMinStock ? orderedProducts.filter(p => p.quantity > 0 && p.quantity <= p.minStock) : [];
    const normalStockItems = shouldShowMinStock ? orderedProducts.filter(p => p.quantity > p.minStock) : inStockItems;
    const criticalTotal = zeroStockItems.length + lowStockItems.length;

    if (config.includeSummaryBox) {
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(14, currentY, 182, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('RESUMO DE SITUAÇÃO:', 18, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Total de produtos listados: ${totalProducts}`, 18, currentY + 12);
      
      if (shouldShowMinStock) {
        doc.text(`Estoque normal: ${normalStockItems.length}`, 18, currentY + 16);

        // Highlight critical & zeroed stock
        if (criticalTotal > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(217, 119, 6); // Amber-600
          doc.text(`Estoque crítico / baixo: ${lowStockItems.length} produtos`, 82, currentY + 12);

          doc.setTextColor(225, 29, 72); // Rose-600
          doc.text(`Produtos zerados: ${zeroStockItems.length} produtos`, 82, currentY + 16);
        } else {
          doc.setTextColor(5, 150, 105); // Emerald-600
          doc.text('Nenhum item em estado crítico.', 82, currentY + 12);
        }
      } else {
        doc.text(`Itens com estoque físico: ${inStockItems.length}`, 18, currentY + 16);

        if (zeroStockItems.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(225, 29, 72); // Rose-600
          doc.text(`Produtos zerados: ${zeroStockItems.length} produto(s)`, 82, currentY + 12);
        } else {
          doc.setTextColor(5, 150, 105); // Emerald-600
          doc.text('Todos os produtos possuem estoque.', 82, currentY + 12);
        }
      }

      if (config.showTotalValue && config.showCostPrice) {
        const totalEstCost = orderedProducts.reduce((acc, p) => acc + (p.quantity * (p.costPrice ?? p.price ?? 0)), 0);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(`Patrimônio estimado: R$ ${totalEstCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, currentY + 12);
      }

      currentY += 25;
    }

    // 3. Seção: ESTOQUE CRÍTICO (se habilitada e configurada com estoque mínimo ou zerados)
    if (config.includeCriticalSection && criticalTotal > 0 && config.stockFilter !== 'zero_only') {
      const criticalSorted = [...zeroStockItems, ...lowStockItems];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(225, 29, 72); // Rose-600
      doc.text(`ESTOQUE CRÍTICO — ${criticalTotal} ITENS`, 14, currentY + 4);

      // Dynamically define headers and columns based on config
      const critHead: string[] = ['Produto', 'Categoria'];
      if (config.showQuantity) critHead.push('Estoque Atual');
      if (shouldShowMinStock) critHead.push('Estoque Mínimo');
      if (config.showCostPrice) critHead.push('Preço Custo');
      if (config.showStatus) critHead.push('Situação');

      const criticalTableBody = criticalSorted.map(p => {
        const isZero = p.quantity <= 0;
        const currentQtyStr = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
        const minQtyStr = `${p.minStock} ${formatUnitAbbrev(p.unit, p.minStock)}`;
        const situacao = isZero ? 'ZERADO (Reposição urgente)' : 'CRÍTICO (Abaixo do mínimo)';
        const costStr = (p.costPrice ?? p.price ?? 0) > 0 ? `R$ ${(p.costPrice ?? p.price ?? 0).toFixed(2).replace('.', ',')}` : '-';

        const row: string[] = [p.name, stripEmojis(p.category)];
        if (config.showQuantity) row.push(currentQtyStr);
        if (shouldShowMinStock) row.push(minQtyStr);
        if (config.showCostPrice) row.push(costStr);
        if (config.showStatus) row.push(situacao);
        return row;
      });

      autoTable(doc, {
        startY: currentY + 6,
        head: [critHead],
        body: criticalTableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [15, 23, 42]
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowArr = data.row.raw as string[];
            const lastCell = String(rowArr[rowArr.length - 1] || '');
            if (lastCell.includes('ZERADO')) {
              data.cell.styles.fillColor = [255, 241, 242]; // Rose-50
              data.cell.styles.textColor = [225, 29, 72]; // Rose-600
              data.cell.styles.fontStyle = 'bold';
            } else if (lastCell.includes('CRÍTICO')) {
              data.cell.styles.textColor = [217, 119, 6]; // Amber-600
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // 4. Seção: ESTOQUE COMPLETO (Organizado por Categoria sem Emojis)
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ESTOQUE COMPLETO POR CATEGORIA', 14, currentY + 3);

    // Group products by category
    const categoryMap = new Map<string, Product[]>();
    orderedProducts.forEach(p => {
      const cleanCat = stripEmojis(p.category || 'Outros').toUpperCase();
      if (!categoryMap.has(cleanCat)) {
        categoryMap.set(cleanCat, []);
      }
      categoryMap.get(cleanCat)!.push(p);
    });

    // Build dynamic table headers based on config
    const tableHead: string[] = ['Produto'];
    if (config.showQuantity) tableHead.push('Qtd em Estoque');
    if (shouldShowMinStock) tableHead.push('Estoque Mínimo');
    if (config.showCostPrice) tableHead.push('Preço Custo');
    if (config.showCostPrice && config.showQuantity) tableHead.push('Subtotal Custo');
    if (config.showStatus) tableHead.push('Situação');

    const totalColumns = tableHead.length;

    // Build unified table rows with category divider rows
    const fullTableBody: RowInput[] = [];

    categoryMap.forEach((items, categoryName) => {
      // Category header row span
      fullTableBody.push([
        {
          content: `${categoryName} (${items.length} ${items.length === 1 ? 'item' : 'itens'})`,
          colSpan: totalColumns,
          styles: {
            fillColor: [241, 245, 249], // Slate-100
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 8,
            cellPadding: 2.2
          }
        }
      ]);

      items.forEach(p => {
        const qtyFormatted = `${p.quantity} ${formatUnitAbbrev(p.unit, p.quantity)}`;
        const minFormatted = `${p.minStock} ${formatUnitAbbrev(p.unit, p.minStock)}`;
        const costVal = p.costPrice ?? p.price ?? 0;
        const costFormatted = costVal > 0 ? `R$ ${costVal.toFixed(2).replace('.', ',')}` : '-';
        const subtotalFormatted = (costVal > 0 && p.quantity > 0) ? `R$ ${(costVal * p.quantity).toFixed(2).replace('.', ',')}` : '-';

        let situacao = 'Normal';
        if (p.quantity <= 0) {
          situacao = 'Zerado';
        } else if (shouldShowMinStock && p.quantity <= p.minStock) {
          situacao = 'Estoque Baixo';
        }

        const row: (string | object)[] = [p.name];
        if (config.showQuantity) row.push(qtyFormatted);
        if (shouldShowMinStock) row.push(minFormatted);
        if (config.showCostPrice) row.push(costFormatted);
        if (config.showCostPrice && config.showQuantity) row.push(subtotalFormatted);
        if (config.showStatus) row.push(situacao);

        fullTableBody.push(row);
      });
    });

    autoTable(doc, {
      startY: currentY + 5,
      head: [tableHead],
      body: fullTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42]
      },
      didParseCell: (data) => {
        if (data.section === 'body' && config.showStatus) {
          const rowArr = data.row.raw as (string | object)[];
          const lastCell = String(rowArr[rowArr.length - 1] || '');
          if (lastCell === 'Zerado') {
            data.cell.styles.fillColor = [255, 241, 242];
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (lastCell === 'Estoque Baixo') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // 5. Totalizador financeiro se habilitado
    if (config.showTotalValue && config.showCostPrice) {
      const grandTotal = orderedProducts.reduce((acc, p) => acc + (p.quantity * (p.costPrice ?? p.price ?? 0)), 0);
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

      if (finalY > 260) {
        doc.addPage();
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY + 4, 182, 12, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('VALOR TOTAL ESTIMADO DO ESTOQUE (CUSTO):', 20, finalY + 11);
      doc.text(`R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 140, finalY + 11);
    }

    // 6. Rodapé Padrão em Todas as Páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        `Controle de Estoque — ${formattedDate}`,
        14,
        287
      );
      doc.text(`Página ${i} de ${pageCount}`, 175, 287);
    }

    doc.save(`Resumo_de_Estoque_${formattedDate.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Generates Stock Audit (Conferência) PDF Report without emojis
   */
  static generateAuditReport(
    audit: AuditRecord,
    products: Product[],
    settings: SystemSettings,
    customConfig?: Partial<ReportExportConfig>
  ): void {
    const config: ReportExportConfig = {
      ...DEFAULT_REPORT_CONFIG,
      ...(settings?.reportConfig || {}),
      ...(customConfig || {})
    };

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
    doc.rect(0, 0, 210, 26, 'F');

    // Accent line in theme color
    doc.setFillColor(theme.pdfHeaderRgb[0], theme.pdfHeaderRgb[1], theme.pdfHeaderRgb[2]);
    doc.rect(0, 24.5, 210, 1.5, 'F');

    const hasLogo = this.renderLogoHeader(doc, settings.logoUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('RELATÓRIO DE CONFERÊNCIA DE ESTOQUE', 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const compText = settings.companyName ? `Estabelecimento: ${settings.companyName}` : 'Auditoria Física de Estoque';
    doc.text(compText, 14, 18);

    doc.setFontSize(8);
    doc.text(`Data: ${formattedDate} às ${formattedTime}`, hasLogo ? 100 : 138, 18);

    // Filter items if recipes excluded
    let auditItems = [...audit.items];
    if (!config.includeRecipes) {
      auditItems = auditItems.filter(i => !i.category.includes('Lanches'));
    }

    // Summary Box
    const totalItems = auditItems.length;
    const auditedItems = auditItems.filter(i => i.isAudited).length;
    const pendingItems = totalItems - auditedItems;
    const changesCount = auditItems.filter(i => i.isAudited && i.countedQuantity !== null && i.countedQuantity !== i.registeredQuantity).length;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 30, 182, 22, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`• Total de Produtos: ${totalItems}`, 18, 37);
    doc.text(`• Itens Conferidos: ${auditedItems}`, 18, 43);
    doc.text(`• Itens Pendentes: ${pendingItems}`, 18, 48);

    doc.text(`• Divergências Encontradas: ${changesCount}`, 85, 37);
    doc.text(`• Status: ${audit.isCompleted ? 'Concluída' : 'Em Andamento'}`, 85, 43);
    doc.text(`• Aplicado ao Estoque: ${audit.appliedToStock ? 'SIM (Estoque Atualizado)' : 'NÃO (Apenas Registro)'}`, 85, 48);

    // Sort audit items using user's category priority
    const categorySortedItems = [...auditItems].sort((a, b) => {
      const catOrder = settings.categoryOrder || [];
      const cleanA = stripEmojis(a.category);
      const cleanB = stripEmojis(b.category);
      const indexA = catOrder.findIndex(c => stripEmojis(c).toLowerCase() === cleanA.toLowerCase());
      const indexB = catOrder.findIndex(c => stripEmojis(c).toLowerCase() === cleanB.toLowerCase());
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return cleanA.localeCompare(cleanB);
    });

    const tableData = categorySortedItems.map(item => {
      const counted = item.countedQuantity ?? item.registeredQuantity;
      const diff = Math.round((counted - item.registeredQuantity) * 100) / 100;
      let statusStr = 'Pendente';
      if (item.isAudited) {
        if (diff === 0) {
          statusStr = 'OK (Conferido)';
        } else if (diff > 0) {
          statusStr = `Sobra (+${diff} ${formatUnitAbbrev(item.unit, diff)})`;
        } else {
          statusStr = `Falta (${diff} ${formatUnitAbbrev(item.unit, Math.abs(diff))})`;
        }
      }

      return [
        item.productName,
        stripEmojis(item.category),
        `${item.registeredQuantity} ${formatUnitAbbrev(item.unit, item.registeredQuantity)}`,
        item.isAudited ? `${counted} ${formatUnitAbbrev(item.unit, counted)}` : 'Não contado',
        item.isAudited ? (diff > 0 ? `+${diff}` : `${diff}`) : '-',
        statusStr
      ];
    });

    autoTable(doc, {
      startY: 56,
      head: [['Produto', 'Categoria', 'Qtd Sistema', 'Qtd Contada', 'Diferença', 'Situação']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 36 },
        2: { cellWidth: 24, halign: 'right' },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 28 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const text = String(data.cell.raw);
          if (text.includes('Falta')) {
            data.cell.styles.textColor = [225, 29, 72]; // Rose-600
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('Sobra')) {
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
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Controle de Estoque — ${formattedDate}`,
        14,
        287
      );
      doc.text(`Página ${i} de ${pageCount}`, 175, 287);
    }

    doc.save(`Conferencia_Estoque_${formattedDate.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Generates Shopping List PDF Report without emojis
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
    doc.rect(0, 0, 210, 26, 'F');

    // Accent line in theme color
    doc.setFillColor(theme.pdfHeaderRgb[0], theme.pdfHeaderRgb[1], theme.pdfHeaderRgb[2]);
    doc.rect(0, 24.5, 210, 1.5, 'F');

    const hasLogo = this.renderLogoHeader(doc, settings.logoUrl);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('LISTA DE COMPRAS', 14, 11);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const compText = settings.companyName ? `Estabelecimento: ${settings.companyName}` : 'Sugestão de Reposição de Compras';
    doc.text(compText, 14, 18);

    doc.setFontSize(8);
    doc.text(`Data: ${formattedDate} às ${formattedTime}`, hasLogo ? 100 : 138, 18);

    const showPrices = settings.showPrices !== false;

    // Main Shopping Table with Clean Category
    const tableData = orderedShopping.map(item => {
      const costVal = item.costPrice ?? item.price ?? 0;
      const totalCostEst = item.suggestedQuantity * costVal;
      return [
        item.productName,
        stripEmojis(item.category),
        `${item.currentQuantity} ${formatUnitAbbrev(item.unit, item.currentQuantity)}`,
        `${item.minStock} ${formatUnitAbbrev(item.unit, item.minStock)}`,
        `${item.suggestedQuantity} ${formatUnitAbbrev(item.unit, item.suggestedQuantity)}`,
        showPrices && costVal > 0 ? `R$ ${costVal.toFixed(2).replace('.', ',')}` : '-',
        showPrices && totalCostEst > 0 ? `R$ ${totalCostEst.toFixed(2).replace('.', ',')}` : '-'
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [['Produto', 'Categoria', 'Est. Atual', 'Mínimo', 'Comprar', 'P. Custo', 'Total Custo']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { cellWidth: 46 },
        1: { cellWidth: 32 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 21, halign: 'right' },
        6: { cellWidth: 21, halign: 'right' }
      }
    });

    if (showPrices) {
      const grandTotalCost = orderedShopping.reduce((acc, item) => acc + (item.suggestedQuantity * (item.costPrice ?? item.price ?? 0)), 0);
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY + 4, 182, 14, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('GASTO ESTIMADO TOTAL DE COMPRAS (CUSTO):', 20, finalY + 12);
      doc.text(`R$ ${grandTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 145, finalY + 12);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Controle de Estoque — ${formattedDate}`,
        14,
        287
      );
      doc.text(`Página ${i} de ${pageCount}`, 175, 287);
    }

    doc.save(`Lista_de_Compras_${formattedDate.replace(/\//g, '-')}.pdf`);
  }
}
