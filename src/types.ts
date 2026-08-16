export type Unit = 
  | 'Unidade'
  | 'Kg'
  | 'Grama'
  | 'Litro'
  | 'Caixa'
  | 'Pacote'
  | 'Bandeja'
  | 'Fardo';

export type VelocityClass = 'high' | 'medium' | 'low';

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number; // quantidade consumida por 1 lanche (ex: 1 un pão, 2 un smash, 0.05 kg cheddar)
  unit: Unit;
  costPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: Unit;
  minStock: number;
  costPrice?: number; // Preço de Custo (quanto custa comprar ou custo dos insumos)
  sellPrice?: number; // Preço de Venda (quanto é vendido)
  price?: number; // Fallback / legado
  previousPrice?: number;
  lastPriceChangeDate?: string;
  notes?: string;
  createdAt: string;
  lastAuditedAt?: string;
  avgDailyConsumption?: number;
  velocityClass?: VelocityClass;

  // Ficha Técnica / Receita (Lanches, Porções, Pratos Compostos)
  isRecipe?: boolean; // Se true, o item é um lanche/receita composto por insumos
  ingredients?: RecipeIngredient[]; // Lista de insumos necessários por unidade
}

export interface RecipeSaleDeduction {
  ingredientId: string;
  ingredientName: string;
  deductedQuantity: number;
  unit: Unit;
  previousStock: number;
  newStock: number;
}

export interface RecipeSaleRecord {
  id: string;
  recipeId: string;
  recipeName: string;
  quantitySold: number;
  salePrice?: number;
  costPrice?: number;
  totalAmount?: number;
  totalCost?: number;
  profit?: number;
  date: string; // e.g., "13/08/2026"
  time: string; // e.g., "10:30"
  timestamp: number;
  deductions: RecipeSaleDeduction[];
  notes?: string;
}

export interface AuditItem {
  productId: string;
  productName: string;
  category: string;
  unit: Unit;
  registeredQuantity: number;
  countedQuantity: number | null;
  isAudited: boolean;
  minStock: number;
  costPrice?: number;
  sellPrice?: number;
  price?: number;
}

export interface StockChangeLog {
  productId: string;
  productName: string;
  oldQty: number;
  newQty: number;
  diff: number;
  unit: Unit;
}

export interface AuditRecord {
  id: string;
  date: string; // e.g., "13/08/2026"
  time: string; // e.g., "10:30"
  timestamp: number;
  items: AuditItem[];
  isCompleted: boolean;
  appliedToStock: boolean;
  totalProducts: number;
  auditedCount: number;
  changes: StockChangeLog[];
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  category: string;
  currentQuantity: number;
  minStock: number;
  suggestedQuantity: number;
  unit: Unit;
  costPrice?: number;
  sellPrice?: number;
  price?: number;
  isPurchased: boolean;
  purchasedAt?: string;
}

export type ThemeColor = 'emerald' | 'amber' | 'rose' | 'blue' | 'violet' | 'teal' | 'slate';
export type ThemeMode = 'light' | 'dark';

export interface SystemSettings {
  safetyDays: number; // default 7
  appName: string;
  companyName: string;
  showPrices: boolean; // default true - controls whether product prices/values are displayed
  categoryOrder?: string[]; // Custom ordered list of categories for PDF exports and shopping list
  logoUrl?: string; // Base64 data URL or external URL for company logo
  themeColor?: ThemeColor; // Primary theme color preset
  themeMode?: ThemeMode; // Dark or light interface mode
}

export type TabType = 'dashboard' | 'stock' | 'recipes' | 'audit' | 'shopping' | 'history' | 'reports' | 'settings';

export const DEFAULT_CATEGORIES = [
  '🍔 Lanches & Pratos',
  '🥩 Carnes',
  '🧀 Lácteos & Queijos',
  '🍞 Pães',
  '🥤 Bebidas',
  '🍟 Porções & Fritas',
  '🥫 Molhos',
  '🧂 Condimentos',
  '🧹 Limpeza',
  '📦 Embalagens & Descartáveis',
  '📦 Outros'
];

export const UNITS: Unit[] = [
  'Unidade',
  'Kg',
  'Grama',
  'Litro',
  'Caixa',
  'Pacote',
  'Bandeja',
  'Fardo'
];
