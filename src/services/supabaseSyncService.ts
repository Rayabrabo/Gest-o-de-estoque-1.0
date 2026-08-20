import { supabase } from '../lib/supabase';
import { Product, AuditRecord, SystemSettings, PurchaseItem, RecipeSaleRecord } from '../types';

export interface UserAppDataPayload {
  products: Product[];
  audits: AuditRecord[];
  purchases: PurchaseItem[];
  recipeSales: RecipeSaleRecord[];
  settings: SystemSettings;
  lastSyncedAt?: string;
}

export class SupabaseSyncService {
  /**
   * Save user full data package to Supabase Cloud
   */
  static async saveAllUserData(userId: string, data: UserAppDataPayload): Promise<boolean> {
    try {
      const payload = {
        user_id: userId,
        products: data.products || [],
        audits: data.audits || [],
        purchases: data.purchases || [],
        recipe_sales: data.recipeSales || [],
        settings: data.settings || {},
        updated_at: new Date().toISOString()
      };

      // 1. Try upserting to main unified table 'app_user_data'
      const { error: upsertError } = await supabase
        .from('app_user_data')
        .upsert(payload, { onConflict: 'user_id' });

      if (!upsertError) {
        return true;
      }

      // 2. If table doesn't exist, try alternative table 'estoque_user_data'
      const { error: altError } = await supabase
        .from('estoque_user_data')
        .upsert(payload, { onConflict: 'user_id' });

      if (!altError) {
        return true;
      }

      console.warn('Note on Supabase sync: Custom table not initialized yet, data preserved in active session and local storage.');
      return false;
    } catch (err) {
      console.warn('Supabase save error:', err);
      return false;
    }
  }

  /**
   * Load user full data package from Supabase Cloud
   */
  static async loadAllUserData(userId: string): Promise<UserAppDataPayload | null> {
    try {
      // 1. Try 'app_user_data'
      const { data, error } = await supabase
        .from('app_user_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          products: Array.isArray(data.products) ? data.products : [],
          audits: Array.isArray(data.audits) ? data.audits : [],
          purchases: Array.isArray(data.purchases) ? data.purchases : [],
          recipeSales: Array.isArray(data.recipe_sales) ? data.recipe_sales : (Array.isArray(data.recipeSales) ? data.recipeSales : []),
          settings: (data.settings && typeof data.settings === 'object') ? data.settings : ({} as any),
          lastSyncedAt: data.updated_at
        };
      }

      // 2. Try 'estoque_user_data'
      const { data: altData, error: altErr } = await supabase
        .from('estoque_user_data')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!altErr && altData) {
        return {
          products: Array.isArray(altData.products) ? altData.products : [],
          audits: Array.isArray(altData.audits) ? altData.audits : [],
          purchases: Array.isArray(altData.purchases) ? altData.purchases : [],
          recipeSales: Array.isArray(altData.recipe_sales) ? altData.recipe_sales : [],
          settings: altData.settings || ({} as any),
          lastSyncedAt: altData.updated_at
        };
      }

      return null;
    } catch (err) {
      console.warn('Supabase load error:', err);
      return null;
    }
  }

  /**
   * Two-Way Intelligent Sync:
   * When user logs in or registers:
   * - If isNewRegistration is true or user has no cloud data yet, initialize clean empty stock for new business management.
   * - If cloud has existing user data, load user's actual saved data.
   */
  static async syncOnLogin(userId: string, localData: UserAppDataPayload, isNewRegistration: boolean = false): Promise<UserAppDataPayload> {
    if (isNewRegistration) {
      // New user registering -> Starts with clean zeroed inventory
      const cleanEmptyData: UserAppDataPayload = {
        products: [],
        audits: [],
        purchases: [],
        recipeSales: [],
        settings: {
          safetyDays: 7,
          appName: 'Gestão de Estoque',
          companyName: 'Meu Estabelecimento',
          showPrices: true,
          themeColor: 'emerald',
          themeMode: 'light'
        }
      };
      await this.saveAllUserData(userId, cleanEmptyData);
      return cleanEmptyData;
    }

    const cloudData = await this.loadAllUserData(userId);

    if (cloudData) {
      // User has existing records in Supabase cloud (even if empty products array)
      return {
        products: cloudData.products || [],
        audits: cloudData.audits || [],
        purchases: cloudData.purchases || [],
        recipeSales: cloudData.recipeSales || [],
        settings: (cloudData.settings && cloudData.settings.appName) ? cloudData.settings : localData.settings,
        lastSyncedAt: cloudData.lastSyncedAt
      };
    } else {
      // First login without existing row: initialize clean database for this user
      const cleanEmptyData: UserAppDataPayload = {
        products: [],
        audits: [],
        purchases: [],
        recipeSales: [],
        settings: localData.settings || {
          safetyDays: 7,
          appName: 'Gestão de Estoque',
          companyName: 'Meu Estabelecimento',
          showPrices: true,
          themeColor: 'emerald',
          themeMode: 'light'
        }
      };
      await this.saveAllUserData(userId, cleanEmptyData);
      return cleanEmptyData;
    }
  }

  /**
   * Helper to generate the SQL script if the user wants to run it in Supabase SQL Editor
   */
  static getSuggestedSqlSchema(): string {
    return `-- TABELA PARA SALVAR DADOS DO APP DE ESTOQUE NO SUPABASE
CREATE TABLE IF NOT EXISTS public.app_user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  products JSONB DEFAULT '[]'::jsonb,
  audits JSONB DEFAULT '[]'::jsonb,
  purchases JSONB DEFAULT '[]'::jsonb,
  recipe_sales JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR SEGURANÇA POR LINHA (RLS)
ALTER TABLE public.app_user_data ENABLE ROW LEVEL SECURITY;

-- POLÍTICA PARA O USUÁRIO ACESSAR APENAS SEUS PRÓPRIOS DADOS
CREATE POLICY "Users can view own data" ON public.app_user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.app_user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.app_user_data
  FOR UPDATE USING (auth.uid() = user_id);
`;
  }
}
