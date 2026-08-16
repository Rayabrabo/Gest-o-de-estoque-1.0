import React, { useState, useEffect } from 'react';
import { 
  Product, 
  AuditRecord, 
  SystemSettings, 
  PurchaseItem, 
  TabType,
  RecipeSaleRecord
} from './types';
import { StorageService } from './services/storageService';
import { PdfService } from './services/pdfService';
import { applyThemeToDom } from './utils/themeUtils';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ProductListView } from './components/ProductListView';
import { RecipeListView } from './components/RecipeListView';
import { DailyAuditView } from './components/DailyAuditView';
import { ShoppingListView } from './components/ShoppingListView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { ReportsView } from './components/ReportsView';
import { ProductModal } from './components/ProductModal';
import { RecipeModal } from './components/RecipeModal';
import { SettingsModal } from './components/SettingsModal';
import { RecipeDischargeModal } from './components/RecipeDischargeModal';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [recipeSales, setRecipeSales] = useState<RecipeSaleRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [shoppingList, setShoppingList] = useState<PurchaseItem[]>([]);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Product | null>(null);

  const [recipeForDischarge, setRecipeForDischarge] = useState<Product | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load initial local data
  const loadData = () => {
    const loadedProducts = StorageService.getProducts();
    const loadedAudits = StorageService.getAudits();
    const loadedRecipeSales = StorageService.getRecipeSales();
    const loadedSettings = StorageService.getSettings();

    setProducts(loadedProducts);
    setAudits(loadedAudits);
    setRecipeSales(loadedRecipeSales);
    setSettings(loadedSettings);

    const generatedShopping = StorageService.generateShoppingList(loadedProducts, loadedSettings);
    setShoppingList(generatedShopping);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyThemeToDom(settings);
  }, [settings]);

  // Latest audit record
  const latestAudit = audits.length > 0 
    ? [...audits].sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  // Save product (Create or Edit)
  const handleSaveProduct = (partialProduct: Partial<Product>) => {
    let updated: Product[];
    if (partialProduct.id) {
      // Edit existing product
      updated = products.map(p => p.id === partialProduct.id ? { ...p, ...partialProduct } as Product : p);
    } else {
      // Create new product
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: partialProduct.name || 'Sem nome',
        category: partialProduct.category || '📦 Outros',
        quantity: partialProduct.quantity ?? 0,
        unit: partialProduct.unit || 'Unidade',
        minStock: partialProduct.minStock ?? 5,
        price: partialProduct.price ?? 0,
        costPrice: partialProduct.costPrice,
        sellPrice: partialProduct.sellPrice,
        isRecipe: partialProduct.isRecipe,
        ingredients: partialProduct.ingredients,
        notes: partialProduct.notes,
        createdAt: new Date().toISOString()
      };
      updated = [newProd, ...products];
    }

    StorageService.saveProducts(updated);
    setProducts(StorageService.getProducts());
    setShoppingList(StorageService.generateShoppingList(updated, settings));
  };

  // Delete product with full cleanup across inventory, check list audits, recipes and shopping cart
  const handleDeleteProduct = (productId: string) => {
    // 1. Remove from products
    const updated = products.filter(p => p.id !== productId);
    
    // 2. Clean up from ingredients in any recipe
    const cleanedProducts = updated.map(p => {
      if (p.isRecipe && p.ingredients) {
        return {
          ...p,
          ingredients: p.ingredients.filter(ing => ing.ingredientId !== productId)
        };
      }
      return p;
    });
    StorageService.saveProducts(cleanedProducts);

    // 3. Remove from shopping list / cart
    const updatedPurchases = StorageService.getPurchases().filter(p => p.productId !== productId);
    StorageService.savePurchases(updatedPurchases);

    // 4. Remove from all past and active audit records so it NEVER appears in the check list
    const allAudits = StorageService.getAudits();
    const cleanedAudits = allAudits.map(audit => ({
      ...audit,
      items: audit.items.filter(item => item.productId !== productId)
    }));
    StorageService.saveAudits(cleanedAudits);

    setProducts(StorageService.getProducts());
    setAudits(StorageService.getAudits());
    setShoppingList(StorageService.generateShoppingList(cleanedProducts, settings));
  };

  // Quick increment / decrement stock
  const handleQuickUpdateQuantity = (productId: string, newQty: number) => {
    const updated = products.map(p => p.id === productId ? { ...p, quantity: newQty } : p);
    StorageService.saveProducts(updated);
    setProducts(StorageService.getProducts());
    setShoppingList(StorageService.generateShoppingList(updated, settings));
  };

  // Handle recipe sale deduction (Automatic stock deduction of ingredients)
  const handleDischargeRecipeSale = (recipeId: string, quantitySold: number, notes?: string) => {
    const result = StorageService.deductRecipeSale(recipeId, quantitySold, notes);
    if (result) {
      loadData();
    }
  };

  // Save daily audit record
  const handleSaveAudit = (newAudit: AuditRecord, applyToStock: boolean) => {
    const updatedAudits = [newAudit, ...audits.filter(a => a.id !== newAudit.id)];
    StorageService.saveAudits(updatedAudits);
    setAudits(updatedAudits);

    if (applyToStock) {
      const updatedProducts = products.map(p => {
        const auditItem = newAudit.items.find(i => i.productId === p.id);
        if (auditItem && auditItem.isAudited && auditItem.countedQuantity !== null) {
          return {
            ...p,
            quantity: auditItem.countedQuantity,
            lastAuditedAt: `${newAudit.date} ${newAudit.time}`
          };
        }
        return p;
      });

      StorageService.saveProducts(updatedProducts);
      const reloadedProds = StorageService.getProducts();
      setProducts(reloadedProds);
      setShoppingList(StorageService.generateShoppingList(reloadedProds, settings));
    }

    setCurrentTab('dashboard');
  };

  // Add or update item in shopping cart
  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    let updatedList: PurchaseItem[];
    const existingIndex = shoppingList.findIndex(item => item.productId === productId);

    if (existingIndex >= 0) {
      updatedList = shoppingList.map((item, idx) => 
        idx === existingIndex
          ? { ...item, suggestedQuantity: quantity, isPurchased: false }
          : item
      );
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        currentQuantity: product.quantity,
        minStock: product.minStock,
        suggestedQuantity: quantity,
        unit: product.unit,
        costPrice: product.costPrice ?? product.price,
        sellPrice: product.sellPrice,
        price: product.costPrice ?? product.price,
        isPurchased: false
      };
      updatedList = [newItem, ...shoppingList];
    }

    setShoppingList(updatedList);
    StorageService.savePurchases(updatedList);
  };

  // Remove item from shopping cart
  const handleRemoveFromCart = (productId: string) => {
    const updatedList = shoppingList.filter(item => item.productId !== productId);
    setShoppingList(updatedList);
    StorageService.savePurchases(updatedList);
  };

  // Update item quantity in shopping cart
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    const updatedList = shoppingList.map(item => 
      item.productId === productId
        ? { ...item, suggestedQuantity: Math.max(1, quantity) }
        : item
    );
    setShoppingList(updatedList);
    StorageService.savePurchases(updatedList);
  };

  // Toggle purchased checkbox in shopping list
  const handleTogglePurchased = (productId: string) => {
    const updatedList = shoppingList.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          isPurchased: !item.isPurchased,
          purchasedAt: !item.isPurchased ? new Date().toISOString() : undefined
        };
      }
      return item;
    });

    setShoppingList(updatedList);
    StorageService.savePurchases(updatedList);
  };

  // Save system settings
  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    setShoppingList(StorageService.generateShoppingList(products, newSettings));
  };

  // Export PDF Handlers
  const handleExportInventoryPDF = () => {
    PdfService.generateInventoryReport(products, latestAudit, settings);
  };

  const handleExportShoppingPDF = () => {
    PdfService.generateShoppingListReport(shoppingList, settings);
  };

  const handleExportAuditPDF = (audit: AuditRecord) => {
    PdfService.generateInventoryReport(products, audit, settings);
  };

  // Backup handlers
  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Estoque_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string): boolean => {
    const success = StorageService.importBackup(jsonStr);
    if (success) {
      loadData();
    }
    return success;
  };

  const handleRestoreSampleData = () => {
    StorageService.resetAllData();
    loadData();
  };

  const handleResetAll = () => {
    StorageService.resetAllData();
    setProducts([]);
    setAudits([]);
    setRecipeSales([]);
    setShoppingList([]);
  };

  const pendingAuditCount = latestAudit
    ? latestAudit.items.filter(i => !i.isAudited).length
    : products.length;

  const pendingShoppingCount = shoppingList.filter(s => !s.isPurchased).length;

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Navigation (Sidebar Desktop & Header/Footer Mobile) */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        pendingAuditCount={pendingAuditCount}
        shoppingCount={pendingShoppingCount}
        onAddProduct={() => {
          setProductToEdit(null);
          setIsProductModalOpen(true);
        }}
        appName={settings.appName}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            products={products}
            latestAudit={latestAudit}
            settings={settings}
            onNavigateTab={setCurrentTab}
            onAddProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onDischargeRecipe={(recipe) => setRecipeForDischarge(recipe)}
          />
        )}

        {currentTab === 'stock' && (
          <ProductListView
            products={products}
            settings={settings}
            shoppingList={shoppingList}
            onAddProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(p) => {
              setProductToEdit(p);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onQuickUpdateQuantity={handleQuickUpdateQuantity}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onDischargeRecipe={(recipe) => setRecipeForDischarge(recipe)}
            categories={categories}
          />
        )}

        {currentTab === 'recipes' && (
          <RecipeListView
            products={products}
            recipeSales={recipeSales}
            settings={settings}
            onAddRecipe={() => {
              setRecipeToEdit(null);
              setIsRecipeModalOpen(true);
            }}
            onEditRecipe={(recipe) => {
              setRecipeToEdit(recipe);
              setIsRecipeModalOpen(true);
            }}
            onDeleteRecipe={handleDeleteProduct}
            onConfirmDischarge={(recipe, qty, notes) => {
              handleDischargeRecipeSale(recipe.id, qty, notes);
            }}
          />
        )}

        {currentTab === 'audit' && (
          <DailyAuditView
            products={products}
            currentAudit={latestAudit}
            settings={settings}
            shoppingList={shoppingList}
            onSaveAudit={handleSaveAudit}
            onResetAudit={() => {}}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onNavigateToReports={() => setCurrentTab('reports')}
          />
        )}

        {currentTab === 'shopping' && (
          <ShoppingListView
            products={products}
            shoppingItems={shoppingList}
            settings={settings}
            onUpdateSettings={handleSaveSettings}
            onTogglePurchased={handleTogglePurchased}
            onUpdateItemQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onAddToCart={handleAddToCart}
            onExportPDF={handleExportShoppingPDF}
            categories={categories}
          />
        )}

        {currentTab === 'history' && (
          <AuditHistoryView
            audits={audits}
            settings={settings}
            onExportPDFForAudit={handleExportAuditPDF}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            products={products}
            latestAudit={latestAudit}
            settings={settings}
            shoppingList={shoppingList}
            onExportInventoryPDF={handleExportInventoryPDF}
            onExportShoppingPDF={handleExportShoppingPDF}
            onSaveSettings={handleSaveSettings}
            categories={categories}
          />
        )}
      </main>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        productToEdit={productToEdit}
        categories={categories}
        allProducts={products}
      />

      {/* Add / Edit Recipe Modal */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setRecipeToEdit(null);
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        recipeToEdit={recipeToEdit}
        allProducts={products}
        settings={settings}
      />

      {/* Recipe Discharge / Sale Modal */}
      <RecipeDischargeModal
        isOpen={!!recipeForDischarge}
        recipe={recipeForDischarge}
        allProducts={products}
        settings={settings}
        onClose={() => setRecipeForDischarge(null)}
        onConfirmDischarge={(recipe, qty, notes) => {
          handleDischargeRecipeSale(recipe.id, qty, notes);
          setRecipeForDischarge(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onRestoreSampleData={handleRestoreSampleData}
        onResetAll={handleResetAll}
        existingCategories={categories}
      />
    </div>
  );
}
