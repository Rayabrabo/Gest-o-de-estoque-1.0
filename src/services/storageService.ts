import { Product, AuditRecord, AuditItem, SystemSettings, PurchaseItem, VelocityClass, RecipeSaleRecord, RecipeSaleDeduction, DEFAULT_CATEGORIES, ReportExportConfig, DEFAULT_REPORT_CONFIG } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'estoque_app_products_v1',
  AUDITS: 'estoque_app_audits_v1',
  CATEGORIES: 'estoque_app_categories_v1',
  SETTINGS: 'estoque_app_settings_v1',
  PURCHASES: 'estoque_app_purchases_v1',
  RECIPE_SALES: 'estoque_app_recipe_sales_v1',
  AUDIT_DRAFT: 'estoque_app_audit_draft_v1',
  REPORT_CONFIG: 'estoque_app_report_config_v1'
};

export const DEFAULT_SETTINGS: SystemSettings = {
  safetyDays: 7,
  appName: 'Gestão de Estoque',
  companyName: 'Meu Estabelecimento',
  showPrices: true,
  showMinStock: false, // Opcional / Desativado por padrão: foco em quantidade atual
  autoGenerateShopping: false, // Default to purely manual addition per user request
  categoryOrder: DEFAULT_CATEGORIES,
  themeColor: 'emerald',
  themeMode: 'light'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Mussarela Fatiada / Queijo',
    category: '🧀 Lácteos & Queijos',
    quantity: 8,
    unit: 'Kg',
    minStock: 10,
    costPrice: 42.90,
    sellPrice: 65.00,
    price: 42.90,
    previousPrice: 38.90,
    lastPriceChangeDate: '2026-08-10',
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    avgDailyConsumption: 1.2,
    velocityClass: 'high',
    notes: 'Manter refrigerado entre 2°C e 6°C'
  },
  {
    id: 'prod-2',
    name: 'Carne Hamburguer Smash 90g',
    category: '🥩 Carnes',
    quantity: 45,
    unit: 'Unidade',
    minStock: 50,
    costPrice: 3.50,
    sellPrice: 12.00,
    price: 3.50,
    previousPrice: 3.20,
    lastPriceChangeDate: '2026-08-05',
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    avgDailyConsumption: 15.0,
    velocityClass: 'high',
    notes: 'Blend de fraldinha e costela 90g'
  },
  {
    id: 'prod-3',
    name: 'Pão de Hambúrguer Brioche',
    category: '🍞 Pães',
    quantity: 35,
    unit: 'Unidade',
    minStock: 40,
    costPrice: 1.80,
    sellPrice: 4.50,
    price: 1.80,
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    avgDailyConsumption: 12.5,
    velocityClass: 'high',
    notes: 'Pão brioche com gergelim selado'
  },
  {
    id: 'prod-4',
    name: 'Batata Frita Palito 9mm',
    category: '🍟 Porções & Fritas',
    quantity: 15,
    unit: 'Kg',
    minStock: 12,
    costPrice: 14.50,
    sellPrice: 32.00,
    price: 14.50,
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    avgDailyConsumption: 2.5,
    velocityClass: 'medium',
    notes: 'Saco de 2.5 kg pré-frita'
  },
  {
    id: 'prod-5',
    name: 'Molho Especial da Casa',
    category: '🥫 Molhos',
    quantity: 4,
    unit: 'Litro',
    minStock: 3,
    costPrice: 22.00,
    sellPrice: 45.00,
    price: 22.00,
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    avgDailyConsumption: 0.5,
    velocityClass: 'medium',
    notes: 'Receita artesanal maionese temperada'
  },
  {
    id: 'prod-6',
    name: 'Refrigerante Coca-Cola 350ml',
    category: '🥤 Bebidas',
    quantity: 48,
    unit: 'Unidade',
    minStock: 24,
    costPrice: 3.80,
    sellPrice: 7.50,
    price: 3.80,
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    avgDailyConsumption: 8.0,
    velocityClass: 'medium'
  },
  // Lanches Cadastrados com Ficha Técnica (Receitas)
  {
    id: 'prod-lanche-1',
    name: '🍔 Hambúrguer Smash Simples',
    category: '🍔 Lanches & Pratos',
    quantity: 0,
    unit: 'Unidade',
    minStock: 0,
    costPrice: 7.02,
    sellPrice: 22.00,
    price: 7.02,
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    isRecipe: true,
    ingredients: [
      { ingredientId: 'prod-3', ingredientName: 'Pão de Hambúrguer Brioche', quantity: 1, unit: 'Unidade', costPrice: 1.80 },
      { ingredientId: 'prod-2', ingredientName: 'Carne Hamburguer Smash 90g', quantity: 1, unit: 'Unidade', costPrice: 3.50 },
      { ingredientId: 'prod-1', ingredientName: 'Mussarela Fatiada / Queijo', quantity: 0.04, unit: 'Kg', costPrice: 42.90 }
    ],
    notes: '1 pão brioche + 1 carne smash 90g + 40g queijo'
  },
  {
    id: 'prod-lanche-2',
    name: '🍔 Smash Burger Duplo Cheddar',
    category: '🍔 Lanches & Pratos',
    quantity: 0,
    unit: 'Unidade',
    minStock: 0,
    costPrice: 12.67,
    sellPrice: 32.00,
    price: 12.67,
    createdAt: '2026-08-01',
    lastAuditedAt: '2026-08-12',
    isRecipe: true,
    ingredients: [
      { ingredientId: 'prod-3', ingredientName: 'Pão de Hambúrguer Brioche', quantity: 1, unit: 'Unidade', costPrice: 1.80 },
      { ingredientId: 'prod-2', ingredientName: 'Carne Hamburguer Smash 90g', quantity: 2, unit: 'Unidade', costPrice: 3.50 },
      { ingredientId: 'prod-1', ingredientName: 'Mussarela Fatiada / Queijo', quantity: 0.08, unit: 'Kg', costPrice: 42.90 },
      { ingredientId: 'prod-5', ingredientName: 'Molho Especial da Casa', quantity: 0.02, unit: 'Litro', costPrice: 22.00 }
    ],
    notes: '1 pão + 2 carnes smash 90g + 80g queijo + 20ml molho especial'
  }
];

export const INITIAL_AUDITS: AuditRecord[] = [
  {
    id: 'audit-demo-1',
    date: '12/08/2026',
    time: '18:00',
    timestamp: Date.now() - 86400000,
    items: INITIAL_PRODUCTS.map(p => ({
      productId: p.id,
      productName: p.name,
      category: p.category,
      unit: p.unit,
      registeredQuantity: p.quantity,
      countedQuantity: p.quantity,
      isAudited: true,
      minStock: p.minStock,
      price: p.price
    })),
    isCompleted: true,
    appliedToStock: true,
    totalProducts: INITIAL_PRODUCTS.length,
    auditedCount: INITIAL_PRODUCTS.length,
    changes: [],
    notes: 'Conferência de encerramento do expediente anterior.'
  }
];

export class StorageService {
  static getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        this.saveProducts(INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  static saveProducts(products: Product[]): void {
    const updated = this.recalculateConsumptionAndVelocity(products, this.getAudits());
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  }

  static getAudits(): AuditRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDITS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(INITIAL_AUDITS));
        return INITIAL_AUDITS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_AUDITS;
    }
  }

  static saveAudits(audits: AuditRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
    // Recalculate products consumption stats when new audit saved
    const products = this.getProducts();
    const updatedProducts = this.recalculateConsumptionAndVelocity(products, audits);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
  }

  static getCategories(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) {
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveCategories(categories: string[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  /**
   * Returns complete list of unique categories in their user-configured priority order
   */
  static getOrderedCategories(settings?: SystemSettings, extraCategories: string[] = []): string[] {
    const configuredOrder = settings?.categoryOrder && settings.categoryOrder.length > 0 
      ? settings.categoryOrder 
      : DEFAULT_CATEGORIES;

    const result = [...configuredOrder];

    // Add any extra categories not yet in the configured list
    extraCategories.forEach(cat => {
      if (cat && !result.includes(cat)) {
        result.push(cat);
      }
    });

    return result;
  }

  /**
   * Sort an array of items by category priority order, then by item name
   */
  static sortByCategoryOrder<T extends Record<string, any>>(
    items: T[], 
    settings?: SystemSettings
  ): T[] {
    const order = this.getOrderedCategories(settings);
    return [...items].sort((a, b) => {
      const catA = (a.category as string) || '';
      const catB = (b.category as string) || '';
      
      let indexA = order.indexOf(catA);
      let indexB = order.indexOf(catB);
      if (indexA === -1) indexA = 9999;
      if (indexB === -1) indexB = 9999;

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      const nameA = String(a.name || a.productName || '').toLowerCase();
      const nameB = String(b.name || b.productName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  static getSettings(): SystemSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getPurchases(): PurchaseItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static savePurchases(purchases: PurchaseItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }

  static getRecipeSales(): RecipeSaleRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPE_SALES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveRecipeSales(sales: RecipeSaleRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.RECIPE_SALES, JSON.stringify(sales));
  }

  static getAuditDraft(): AuditItem[] | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_DRAFT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveAuditDraft(draft: AuditItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_DRAFT, JSON.stringify(draft));
    } catch {
      // Ignore write errors
    }
  }

  static clearAuditDraft(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUDIT_DRAFT);
    } catch {
      // Ignore write errors
    }
  }

  static getReportConfig(): ReportExportConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORT_CONFIG);
      if (data) {
        return { ...DEFAULT_REPORT_CONFIG, ...JSON.parse(data) };
      }
      const settings = this.getSettings();
      if (settings.reportConfig) {
        return { ...DEFAULT_REPORT_CONFIG, ...settings.reportConfig };
      }
      return DEFAULT_REPORT_CONFIG;
    } catch {
      return DEFAULT_REPORT_CONFIG;
    }
  }

  static saveReportConfig(config: ReportExportConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORT_CONFIG, JSON.stringify(config));
    } catch {
      // Ignore write errors
    }
  }

  /**
   * Calculate unit cost of a recipe based on the current cost price of its ingredients
   */
  static calculateRecipeUnitCost(recipe: Product, allProducts: Product[]): number {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return recipe.costPrice ?? recipe.price ?? 0;
    }

    let totalCost = 0;
    recipe.ingredients.forEach(ing => {
      const product = allProducts.find(p => p.id === ing.ingredientId);
      const unitCost = product?.costPrice ?? product?.price ?? ing.costPrice ?? 0;
      totalCost += unitCost * ing.quantity;
    });

    return Number(totalCost.toFixed(2));
  }

  /**
   * Calculate how many units of a recipe can be produced with current inventory
   */
  static calculateRecipeMaxStock(recipe: Product, allProducts: Product[]): number {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return 0;
    }

    let maxPossible = Infinity;

    recipe.ingredients.forEach(ing => {
      const product = allProducts.find(p => p.id === ing.ingredientId);
      if (!product || ing.quantity <= 0) {
        maxPossible = 0;
      } else {
        const availableForThis = Math.floor(product.quantity / ing.quantity);
        if (availableForThis < maxPossible) {
          maxPossible = Math.max(0, availableForThis);
        }
      }
    });

    return maxPossible === Infinity ? 0 : maxPossible;
  }

  /**
   * Process a sale/production of recipes by automatically deducting ingredients from inventory
   */
  static deductRecipeSale(
    recipeOrId: Product | string, 
    quantitySold: number, 
    customNotes?: string
  ): { updatedProducts: Product[]; saleRecord: RecipeSaleRecord } | null {
    const currentProducts = this.getProducts();
    const recipe = typeof recipeOrId === 'string' 
      ? currentProducts.find(p => p.id === recipeOrId) 
      : recipeOrId;

    if (!recipe) {
      return null;
    }

    const deductions: RecipeSaleDeduction[] = [];
    const now = new Date();

    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const ingredients = recipe.ingredients || [];

    // Clone products to modify
    const updatedProducts = currentProducts.map(p => {
      const ing = ingredients.find(i => i.ingredientId === p.id);
      if (ing) {
        const deductedQty = Number((ing.quantity * quantitySold).toFixed(3));
        const previousStock = p.quantity;
        const newStock = Number(Math.max(0, p.quantity - deductedQty).toFixed(3));

        deductions.push({
          ingredientId: p.id,
          ingredientName: p.name,
          deductedQuantity: deductedQty,
          unit: p.unit,
          previousStock,
          newStock
        });

        return {
          ...p,
          quantity: newStock,
          lastAuditedAt: dateStr
        };
      }
      return p;
    });

    // Calculate financial summaries
    const unitCost = this.calculateRecipeUnitCost(recipe, currentProducts);
    const unitPrice = recipe.sellPrice ?? recipe.price ?? 0;
    const totalCost = Number((unitCost * quantitySold).toFixed(2));
    const totalAmount = Number((unitPrice * quantitySold).toFixed(2));
    const profit = Number((totalAmount - totalCost).toFixed(2));

    const saleRecord: RecipeSaleRecord = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      quantitySold,
      salePrice: unitPrice > 0 ? unitPrice : undefined,
      costPrice: unitCost > 0 ? unitCost : undefined,
      totalAmount: totalAmount > 0 ? totalAmount : undefined,
      totalCost: totalCost > 0 ? totalCost : undefined,
      profit: profit !== 0 ? profit : undefined,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      deductions,
      notes: customNotes
    };

    // Save updated products and new sale record
    this.saveProducts(updatedProducts);
    const existingSales = this.getRecipeSales();
    this.saveRecipeSales([saleRecord, ...existingSales]);

    return { updatedProducts, saleRecord };
  }

  /**
   * Recalculate daily average consumption and velocity classes dynamically from audits
   */
  static recalculateConsumptionAndVelocity(products: Product[], audits: AuditRecord[]): Product[] {
    if (!audits || audits.length === 0) {
      return products;
    }

    const completedAudits = audits
      .filter(a => a.isCompleted && a.appliedToStock)
      .sort((a, b) => b.timestamp - a.timestamp);

    return products.map(product => {
      // Find historical audit entries for this product
      const productAudits = completedAudits.map(a => {
        const item = a.items.find(i => i.productId === product.id);
        return {
          timestamp: a.timestamp,
          registered: item?.registeredQuantity ?? null,
          counted: item?.countedQuantity ?? null
        };
      }).filter(i => i.counted !== null && i.registered !== null);

      let avgDaily = product.avgDailyConsumption || 0;

      if (productAudits.length >= 2) {
        let totalConsumed = 0;
        let totalDays = 0;

        for (let i = 0; i < productAudits.length - 1; i++) {
          const curr = productAudits[i];
          const prev = productAudits[i + 1];

          // Calculate reduction or consumption
          const dayDiff = Math.max(0.5, (curr.timestamp - prev.timestamp) / (1000 * 60 * 60 * 24));
          const consumed = Math.max(0, (prev.counted ?? 0) - (curr.counted ?? 0));

          totalConsumed += consumed;
          totalDays += dayDiff;
        }

        if (totalDays > 0) {
          avgDaily = Number((totalConsumed / totalDays).toFixed(2));
        }
      }

      // Determine velocity classification dynamically based on avg daily consumption relative to minStock
      let velocityClass: VelocityClass = 'medium';
      if (avgDaily <= 0.1) {
        velocityClass = 'low';
      } else if (avgDaily >= (product.minStock * 0.2) || avgDaily >= 5) {
        velocityClass = 'high';
      } else {
        velocityClass = 'medium';
      }

      return {
        ...product,
        avgDailyConsumption: avgDaily,
        velocityClass
      };
    });
  }

  /**
   * Shopping list generator:
   * - By default, respects manual additions strictly (user controls what to buy).
   * - If autoGenerateShopping is enabled by user, adds items below minimum/safety buffer.
   */
  static generateShoppingList(products: Product[], settings: SystemSettings): PurchaseItem[] {
    const existingPurchases = this.getPurchases().filter(item => 
      products.some(p => p.id === item.productId)
    );
    const safetyDays = settings.safetyDays || 7;
    const isAutoEnabled = settings.autoGenerateShopping === true;

    const result: PurchaseItem[] = [];

    // First, populate all items already added by the user
    existingPurchases.forEach(existing => {
      const p = products.find(prod => prod.id === existing.productId);
      if (p) {
        result.push({
          productId: p.id,
          productName: p.name,
          category: p.category,
          currentQuantity: p.quantity,
          minStock: p.minStock,
          suggestedQuantity: existing.suggestedQuantity ?? 1,
          unit: existing.unit || p.unit,
          costPrice: p.costPrice ?? p.price,
          sellPrice: p.sellPrice,
          price: p.costPrice ?? p.price,
          isPurchased: existing.isPurchased || false,
          purchasedAt: existing.purchasedAt
        });
      }
    });

    // If automatic replenishment is requested by user, add low stock products not yet in cart
    if (isAutoEnabled) {
      products.forEach(p => {
        const alreadyInCart = result.some(item => item.productId === p.id);
        if (!alreadyInCart) {
          const avgDaily = p.avgDailyConsumption || 0;
          const remainingDays = avgDaily > 0 ? p.quantity / avgDaily : 999;
          const isCriticalOrLow = p.quantity <= p.minStock || remainingDays < safetyDays;

          if (isCriticalOrLow) {
            const targetStock = Math.max(p.minStock, Math.ceil(avgDaily * safetyDays));
            const neededAuto = Math.max(1, targetStock - p.quantity);

            result.push({
              productId: p.id,
              productName: p.name,
              category: p.category,
              currentQuantity: p.quantity,
              minStock: p.minStock,
              suggestedQuantity: neededAuto,
              unit: p.unit,
              costPrice: p.costPrice ?? p.price,
              sellPrice: p.sellPrice,
              price: p.costPrice ?? p.price,
              isPurchased: false
            });
          }
        }
      });
    }

    return result;
  }

  static exportBackup(): string {
    const backupData = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      audits: this.getAudits(),
      categories: this.getCategories(),
      settings: this.getSettings(),
      purchases: this.getPurchases(),
      recipeSales: this.getRecipeSales()
    };
    return JSON.stringify(backupData, null, 2);
  }

  static importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
      }
      if (data.audits && Array.isArray(data.audits)) {
        localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(data.audits));
      }
      if (data.categories && Array.isArray(data.categories)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      }
      if (data.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (data.purchases && Array.isArray(data.purchases)) {
        localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data.purchases));
      }
      if (data.recipeSales && Array.isArray(data.recipeSales)) {
        localStorage.setItem(STORAGE_KEYS.RECIPE_SALES, JSON.stringify(data.recipeSales));
      }
      return true;
    } catch {
      return false;
    }
  }

  static resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASES);
    localStorage.removeItem(STORAGE_KEYS.RECIPE_SALES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_DRAFT);
  }

  static initializeEmptyUserData(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RECIPE_SALES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.AUDIT_DRAFT);
    this.saveSettings(DEFAULT_SETTINGS);
  }
}
