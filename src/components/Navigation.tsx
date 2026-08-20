import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Utensils, 
  ClipboardCheck, 
  ShoppingCart, 
  History, 
  FileText, 
  Settings, 
  Plus,
  Cloud,
  CloudCheck,
  User as UserIcon,
  LogOut,
  Database
} from 'lucide-react';
import { TabType, SystemSettings } from '../types';
import { getThemeConfig } from '../utils/themeUtils';

interface NavigationProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingAuditCount: number;
  shoppingCount: number;
  onAddProduct: () => void;
  appName: string;
  settings?: SystemSettings;
  currentUser?: { email?: string | null; displayName?: string | null } | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  isSyncing?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  pendingAuditCount,
  shoppingCount,
  onAddProduct,
  appName,
  settings,
  currentUser,
  onOpenAuthModal,
  onLogout,
  isSyncing
}) => {
  const theme = getThemeConfig(settings);

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Início', icon: LayoutDashboard },
    { id: 'stock' as TabType, label: 'Estoque', icon: Package },
    { id: 'recipes' as TabType, label: 'Lanches & Fichas', icon: Utensils, badgeColor: 'bg-orange-500' },
    { 
      id: 'audit' as TabType, 
      label: 'Conferência', 
      icon: ClipboardCheck, 
      badge: pendingAuditCount > 0 ? pendingAuditCount : undefined,
      badgeColor: 'bg-amber-500'
    },
    { 
      id: 'shopping' as TabType, 
      label: 'Compras', 
      icon: ShoppingCart, 
      badge: shoppingCount > 0 ? shoppingCount : undefined,
      badgeColor: 'bg-rose-500'
    },
    { id: 'history' as TabType, label: 'Histórico', icon: History },
    { id: 'reports' as TabType, label: 'Relatórios', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings?.logoUrl ? (
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-lg ${theme.classes.badgeBg} flex items-center justify-center font-bold text-slate-950 text-sm shadow-xs shrink-0`}>
              {theme.emoji}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-base leading-tight tracking-tight truncate">{appName}</h1>
            <p className="text-[11px] text-slate-400 truncate">
              {settings?.companyName || 'Controle de Estoque & Compras'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                currentUser 
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={currentUser ? `Conectado como ${currentUser.email}` : 'Conectar ao Banco de Dados / Conta'}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{currentUser ? 'Supabase' : 'Nuvem'}</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('reports')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'reports'
                ? `bg-slate-800 ${theme.classes.activeNavText} border ${theme.classes.activeNavBorder}`
                : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800 border border-slate-700'
            }`}
            title="Ver Relatórios"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </button>

          <button
            onClick={onAddProduct}
            className={`flex items-center gap-1 ${theme.classes.btnPrimary} font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-xs transition-colors cursor-pointer`}
            title="Adicionar Item"
          >
            <Plus className="w-4 h-4" />
            <span>Item</span>
          </button>
          
          <button
            onClick={() => onSelectTab('settings')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'settings' 
                ? `bg-slate-800 ${theme.classes.activeNavText}` 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Configurações & Tema"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 min-h-screen">
        
        {/* App Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {settings?.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.classes.gradientFrom} ${theme.classes.gradientTo} flex items-center justify-center text-slate-950 text-xl font-bold shadow-md shrink-0`}>
                {theme.emoji}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-base tracking-tight text-white truncate">{appName}</h1>
              <p className="text-xs text-slate-400 truncate">
                {settings?.companyName || 'Gestão & Estoque'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <button
            onClick={onAddProduct}
            className={`w-full flex items-center justify-center gap-2 ${theme.classes.btnPrimary} font-bold py-2.5 px-4 rounded-xl shadow-md transition-all text-sm transform active:scale-95 cursor-pointer`}
          >
            <Plus className="w-5 h-5" />
            <span>+ ADICIONAR ITEM</span>
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? `${theme.classes.activeNavBg} ${theme.classes.activeNavText} font-semibold border ${theme.classes.activeNavBorder}`
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? theme.classes.activeNavText : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-slate-950 ${item.badgeColor || theme.classes.badgeBg}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Supabase Cloud User Info & Settings */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {currentUser ? (
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CloudCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-[9.5px] text-emerald-400 font-semibold truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Supabase Nuvem Ativa
                  </p>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Conectar Supabase</p>
                  <p className="text-[10px] text-slate-400">Salvar dados na nuvem</p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400">ENTRAR →</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              currentTab === 'settings'
                ? `bg-slate-800 ${theme.classes.activeNavText} font-semibold`
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className={`w-4 h-4 ${currentTab === 'settings' ? theme.classes.activeNavText : 'text-slate-400'}`} />
            <span>Tema & Configurações</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Fixed Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1 py-1 flex items-center justify-around overflow-x-auto shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-w-[48px] sm:min-w-[56px] transition-all cursor-pointer shrink-0 ${
                isActive
                  ? `${theme.classes.activeNavText} font-semibold bg-slate-800/80`
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.badge !== undefined && (
                  <span className={`absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-[10px] font-bold text-slate-950 flex items-center justify-center ${item.badgeColor || theme.classes.badgeBg}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] mt-0.5 tracking-tight truncate max-w-[56px] text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
