import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, AuditRecord, SystemSettings, PurchaseItem, RecipeSaleRecord } from '../types';

export class FirebaseSyncService {
  /**
   * Initialize user profile in firestore if not exists
   */
  static async initUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not sync user profile to firestore:', e);
    }
  }

  /**
   * Save all products to Cloud Firestore
   */
  static async saveProducts(userId: string, products: Product[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      // Clean undefined values before writing to Firestore
      for (const p of products) {
        const prodRef = doc(db, 'users', userId, 'products', p.id);
        const cleanProduct: any = {};
        Object.entries(p).forEach(([key, val]) => {
          if (val !== undefined) cleanProduct[key] = val;
        });
        batch.set(prodRef, cleanProduct);
      }
      await batch.commit();
    } catch (e) {
      console.error('Error saving products to Firestore:', e);
      throw e;
    }
  }

  /**
   * Delete product from Cloud Firestore
   */
  static async deleteProduct(userId: string, productId: string): Promise<void> {
    try {
      const prodRef = doc(db, 'users', userId, 'products', productId);
      await deleteDoc(prodRef);
    } catch (e) {
      console.error('Error deleting product from Firestore:', e);
    }
  }

  /**
   * Load products from Cloud Firestore
   */
  static async loadProducts(userId: string): Promise<Product[]> {
    try {
      const colRef = collection(db, 'users', userId, 'products');
      const snapshot = await getDocs(colRef);
      const items: Product[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Product);
      });
      return items;
    } catch (e) {
      console.error('Error loading products from Firestore:', e);
      return [];
    }
  }

  /**
   * Save audits to Cloud Firestore
   */
  static async saveAudits(userId: string, audits: AuditRecord[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const audit of audits) {
        const docRef = doc(db, 'users', userId, 'audits', audit.id);
        const cleanAudit: any = {};
        Object.entries(audit).forEach(([key, val]) => {
          if (val !== undefined) cleanAudit[key] = val;
        });
        batch.set(docRef, cleanAudit);
      }
      await batch.commit();
    } catch (e) {
      console.error('Error saving audits to Firestore:', e);
    }
  }

  /**
   * Load audits from Cloud Firestore
   */
  static async loadAudits(userId: string): Promise<AuditRecord[]> {
    try {
      const colRef = collection(db, 'users', userId, 'audits');
      const snapshot = await getDocs(colRef);
      const items: AuditRecord[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as AuditRecord);
      });
      return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (e) {
      console.error('Error loading audits from Firestore:', e);
      return [];
    }
  }

  /**
   * Save shopping purchases
   */
  static async savePurchases(userId: string, purchases: PurchaseItem[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of purchases) {
        const docRef = doc(db, 'users', userId, 'purchases', item.productId);
        const cleanItem: any = {};
        Object.entries(item).forEach(([key, val]) => {
          if (val !== undefined) cleanItem[key] = val;
        });
        batch.set(docRef, cleanItem);
      }
      await batch.commit();
    } catch (e) {
      console.error('Error saving purchases to Firestore:', e);
    }
  }

  /**
   * Load shopping purchases
   */
  static async loadPurchases(userId: string): Promise<PurchaseItem[]> {
    try {
      const colRef = collection(db, 'users', userId, 'purchases');
      const snapshot = await getDocs(colRef);
      const items: PurchaseItem[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as PurchaseItem);
      });
      return items;
    } catch (e) {
      console.error('Error loading purchases from Firestore:', e);
      return [];
    }
  }

  /**
   * Save recipe sales
   */
  static async saveRecipeSales(userId: string, sales: RecipeSaleRecord[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const sale of sales) {
        const docRef = doc(db, 'users', userId, 'recipeSales', sale.id);
        const cleanSale: any = {};
        Object.entries(sale).forEach(([key, val]) => {
          if (val !== undefined) cleanSale[key] = val;
        });
        batch.set(docRef, cleanSale);
      }
      await batch.commit();
    } catch (e) {
      console.error('Error saving recipe sales to Firestore:', e);
    }
  }

  /**
   * Load recipe sales
   */
  static async loadRecipeSales(userId: string): Promise<RecipeSaleRecord[]> {
    try {
      const colRef = collection(db, 'users', userId, 'recipeSales');
      const snapshot = await getDocs(colRef);
      const items: RecipeSaleRecord[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as RecipeSaleRecord);
      });
      return items.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error('Error loading recipe sales from Firestore:', e);
      return [];
    }
  }

  /**
   * Save system settings
   */
  static async saveSettings(userId: string, settings: SystemSettings): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'settings', 'general');
      await setDoc(docRef, settings, { merge: true });
    } catch (e) {
      console.error('Error saving settings to Firestore:', e);
    }
  }

  /**
   * Load system settings
   */
  static async loadSettings(userId: string): Promise<SystemSettings | null> {
    try {
      const docRef = doc(db, 'users', userId, 'settings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as SystemSettings;
      }
      return null;
    } catch (e) {
      console.error('Error loading settings from Firestore:', e);
      return null;
    }
  }

  /**
   * Full Initial Sync on Login: Loads all user data from cloud, or uploads initial local data if cloud is empty
   */
  static async syncUserData(userId: string, localData: {
    products: Product[];
    audits: AuditRecord[];
    purchases: PurchaseItem[];
    recipeSales: RecipeSaleRecord[];
    settings: SystemSettings;
  }): Promise<{
    products: Product[];
    audits: AuditRecord[];
    purchases: PurchaseItem[];
    recipeSales: RecipeSaleRecord[];
    settings: SystemSettings;
  }> {
    const cloudProducts = await this.loadProducts(userId);
    const cloudAudits = await this.loadAudits(userId);
    const cloudPurchases = await this.loadPurchases(userId);
    const cloudRecipeSales = await this.loadRecipeSales(userId);
    const cloudSettings = await this.loadSettings(userId);

    // If cloud has existing products, use cloud as source of truth
    if (cloudProducts.length > 0) {
      return {
        products: cloudProducts,
        audits: cloudAudits,
        purchases: cloudPurchases,
        recipeSales: cloudRecipeSales,
        settings: cloudSettings || localData.settings
      };
    } else {
      // First time login: seed cloud with current data
      if (localData.products.length > 0) {
        await this.saveProducts(userId, localData.products);
      }
      if (localData.audits.length > 0) {
        await this.saveAudits(userId, localData.audits);
      }
      if (localData.purchases.length > 0) {
        await this.savePurchases(userId, localData.purchases);
      }
      if (localData.recipeSales.length > 0) {
        await this.saveRecipeSales(userId, localData.recipeSales);
      }
      await this.saveSettings(userId, localData.settings);

      return localData;
    }
  }
}
