import React, { useState } from 'react';
import { 
  FileText, 
  Flame, 
  Snowflake, 
  Activity, 
  TrendingUp, 
  Download, 
  Calendar, 
  Clock, 
  ShieldCheck,
  DollarSign,
  MessageSquare,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, AuditRecord, SystemSettings, PurchaseItem } from '../types';
import { TextExportService } from '../services/textExportService';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { CategoryOrderModal } from './CategoryOrderModal';

interface ReportsViewProps {
  products: Product[];
  latestAudit: AuditRecord | null;
  settings: SystemSettings;
  shoppingList: PurchaseItem[];
  onExportInventoryPDF: () => void;
  onExportShoppingPDF: () => void;
  onSaveSettings?: (settings: SystemSettings) => void;
  categories?: string[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  latestAudit,
  settings,
  shoppingList,
  onExportInventoryPDF,
  onExportShoppingPDF,
  onSaveSettings,
  categories = []
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState('TEXTO PARA WHATSAPP');
  const [isCategoryOrderModalOpen, setIsCategoryOrderModalOpen] = useState(false);

  const highVelocityItems = products.filter(p => p.velocityClass === 'high');
  const mediumVelocityItems = products.filter(p => p.velocityClass === 'medium' || !p.velocityClass);
  const lowVelocityItems = products.filter(p => p.velocityClass === 'low');

  const showPrices = settings.showPrices !== false;
  const totalEstVal = products.reduce((acc, p) => acc + (p.quantity * (p.price || 0)), 0);

  const handleExportInventoryWhatsApp = () => {
    const txt = TextExportService.generateInventoryText(products, settings);
    setShareTitle('RESUMO DE ESTOQUE — TEXTO WHATSAPP');
    setShareText(txt);
    setIsShareModalOpen(true);
  };

  const handleExportShoppingWhatsApp = () => {
    const txt = TextExportService.generateShoppingListText(shoppingList, settings);
    setShareTitle('LISTA DE COMPRAS — TEXTO WHATSAPP');
    setShareText(txt);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>RELATÓRIOS E ANÁLISE DE CONSUMO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe previsões de duração do estoque, classificação automática de utilização e baixe relatórios PDF.
          </p>
        </div>

        {onSaveSettings && (
          <button
            type="button"
            onClick={() => setIsCategoryOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>ORGANIZAR ORDEM DAS CATEGORIAS</span>
          </button>
        )}
      </div>

      {/* Quick PDF Action Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF 1: Full Inventory PDF */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                RELATÓRIO OFICIAL DE ESTOQUE
              </span>
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold">Relatório Completo de Estoque (PDF)</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Inclui lista geral de produtos, quantidades atuais, estoque mínimo, status de conferência, itens pendentes e valor estimado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleExportInventoryWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold py-2.5 px-3 rounded-xl border border-emerald-500/30 transition-all text-xs active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>TEXTO WHATSAPP</span>
            </button>

            <button
              onClick={onExportInventoryPDF}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl shadow-md transition-all text-xs active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>📄 GERAR PDF</span>
            </button>
          </div>
        </div>

        {/* PDF 2: Shopping List PDF */}
        <div className="bg-gradient-to-br from-purple-950 to-slate-900 text-white rounded-2xl p-5 border border-purple-800/60 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30">
                LISTA DE REPOSIÇÃO DE COMPRAS
              </span>
              <Download className="w-5 h-5 text-purple-300" />
            </div>
            <h3 className="text-lg font-bold">Lista de Compras em PDF / Texto</h3>
            <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
              Tabela formatada com sugestão de compra, preços estimados por unidade e total geral estimado para compras.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleExportShoppingWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-bold py-2.5 px-3 rounded-xl border border-purple-500/30 transition-all text-xs active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-purple-300" />
              <span>TEXTO WHATSAPP</span>
            </button>

            <button
              onClick={onExportShoppingPDF}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl shadow-md transition-all text-xs active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>📄 GERAR PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Consumption Forecasts Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>PREVISÃO DE DURAÇÃO DO ESTOQUE (CONTROLE DE CONSUMO)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculo baseado no consumo diário médio extraído do histórico de conferências.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map(product => {
            const avgDaily = product.avgDailyConsumption || 0;
            const remainingDays = avgDaily > 0 
              ? (product.quantity / avgDaily).toFixed(1)
              : 'Sem consumo';

            const isLowDays = avgDaily > 0 && (product.quantity / avgDaily) <= settings.safetyDays;

            return (
              <div 
                key={product.id}
                className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{product.name}</h4>
                    <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold shrink-0">
                      {product.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Estoque Atual: <strong className="text-slate-800">{product.quantity} {product.unit}</strong>
                  </p>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 my-2 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Consumo médio diário:</span>
                      <strong className="text-slate-900">{avgDaily} {product.unit}/dia</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Previsão de Duração:</span>
                      <strong className={isLowDays ? 'text-rose-600 font-black' : 'text-emerald-700 font-bold'}>
                        {remainingDays} {avgDaily > 0 ? 'dias' : ''}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  {isLowDays ? '⚠️ Reposição recomendada nos próximos dias' : '✅ Nível estável de estoque'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automatic Consumption Velocity Classifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          CLASSIFICAÇÃO DINÂMICA DE UTILIZAÇÃO
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🔥 High Velocity */}
          <div className="bg-orange-50/50 border border-orange-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-orange-900 font-bold text-sm">
              <Flame className="w-5 h-5 text-orange-600" />
              <span>🔥 MAIS UTILIZADOS ({highVelocityItems.length})</span>
            </div>
            <p className="text-[11px] text-orange-800/80">
              Produtos com alto volume e frequência de saída do estoque.
            </p>

            <div className="divide-y divide-orange-100 bg-white rounded-lg p-2 border border-orange-200">
              {highVelocityItems.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">Nenhum item nesta categoria.</p>
              ) : (
                highVelocityItems.map(item => (
                  <div key={item.id} className="py-2 px-1 flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-orange-700 font-bold">{item.avgDailyConsumption} {item.unit}/dia</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🟡 Medium Velocity */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Activity className="w-5 h-5 text-slate-600" />
              <span>🟡 UTILIZAÇÃO MÉDIA ({mediumVelocityItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Produtos com giro intermediário e saída regular.
            </p>

            <div className="divide-y divide-slate-100 bg-white rounded-lg p-2 border border-slate-200">
              {mediumVelocityItems.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">Nenhum item nesta categoria.</p>
              ) : (
                mediumVelocityItems.map(item => (
                  <div key={item.id} className="py-2 px-1 flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-700 font-bold">{item.avgDailyConsumption || 0} {item.unit}/dia</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ❄️ Low Velocity */}
          <div className="bg-sky-50/50 border border-sky-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
              <Snowflake className="w-5 h-5 text-sky-600" />
              <span>❄️ MENOS UTILIZADOS ({lowVelocityItems.length})</span>
            </div>
            <p className="text-[11px] text-sky-800/80">
              Produtos com baixo consumo ou raramente movimentados.
            </p>

            <div className="divide-y divide-sky-100 bg-white rounded-lg p-2 border border-sky-200">
              {lowVelocityItems.length === 0 ? (
                <p className="text-xs text-slate-400 p-2">Nenhum item nesta categoria.</p>
              ) : (
                lowVelocityItems.map(item => (
                  <div key={item.id} className="py-2 px-1 flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-sky-700 font-bold">{item.avgDailyConsumption || 0} {item.unit}/dia</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {shareText && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={shareTitle}
          subtitle="O relatório foi formatado com sucesso para envio rápido pelo WhatsApp."
          textToShare={shareText}
        />
      )}

      {/* Category Order Modal */}
      {onSaveSettings && (
        <CategoryOrderModal
          isOpen={isCategoryOrderModalOpen}
          onClose={() => setIsCategoryOrderModalOpen(false)}
          settings={settings}
          onSaveSettings={onSaveSettings}
          existingCategories={categories}
        />
      )}
    </div>
  );
};
