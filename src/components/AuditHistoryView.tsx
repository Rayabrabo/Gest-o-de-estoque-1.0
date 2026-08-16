import React, { useState } from 'react';
import { 
  History, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ArrowRightLeft, 
  X,
  ChevronRight,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { AuditRecord, SystemSettings } from '../types';
import { TextExportService } from '../services/textExportService';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface AuditHistoryViewProps {
  audits: AuditRecord[];
  settings?: SystemSettings;
  onExportPDFForAudit: (audit: AuditRecord) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  audits,
  settings,
  onExportPDFForAudit
}) => {
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);

  const sortedAudits = [...audits].sort((a, b) => b.timestamp - a.timestamp);

  const handleShareWhatsApp = (audit: AuditRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const txt = TextExportService.generateAuditText(audit, settings);
    setShareText(txt);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-slate-700" />
          <span>HISTÓRICO DE CONFERÊNCIAS</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Consulte o histórico de auditorias passadas, contagens realizadas e alterações aplicadas ao estoque.
        </p>
      </div>

      {/* History Timeline Cards */}
      {sortedAudits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-700">Nenhum histórico registrado</p>
          <p className="text-xs text-slate-500 mt-1">Realize a primeira conferência diária para gerar históricos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedAudits.map(audit => {
            const hasStockChanges = audit.changes && audit.changes.length > 0;

            return (
              <div
                key={audit.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setSelectedAudit(audit)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        Conferência de {audit.date}
                      </h3>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {audit.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>• {audit.auditedCount} de {audit.totalProducts} produtos conferidos ({Math.round((audit.auditedCount / audit.totalProducts) * 100)}%)</span>
                    </p>

                    {hasStockChanges ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-2 border border-emerald-200">
                        <ArrowRightLeft className="w-3 h-3" />
                        {audit.changes.length} alterações de estoque registradas
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-medium text-slate-400 mt-2">
                        Sem divergências de quantidade
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
                  <button
                    onClick={(e) => handleShareWhatsApp(audit, e)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs border border-emerald-200 transition-colors"
                    title="Copiar texto para WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportPDFForAudit(audit);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>PDF</span>
                  </button>

                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-base">
                  DETALHES DA CONFERÊNCIA — {selectedAudit.date} ({selectedAudit.time})
                </h3>
                <p className="text-xs text-slate-400">
                  Status: {selectedAudit.appliedToStock ? 'Estoque Atualizado' : 'Registro Apenas Log'}
                </p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Total de Produtos</p>
                  <p className="text-lg font-bold text-slate-800">{selectedAudit.totalProducts}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Conferidos</p>
                  <p className="text-lg font-bold text-emerald-600">{selectedAudit.auditedCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Alterações</p>
                  <p className="text-lg font-bold text-purple-600">{selectedAudit.changes?.length || 0}</p>
                </div>
              </div>

              {/* Items list breakdown */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-2">Itens Conferidos nesta sessão:</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedAudit.items.map(item => (
                    <div key={item.productId} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div>
                        <span className="font-bold text-slate-800">{item.productName}</span>
                        <p className="text-[11px] text-slate-500">
                          Registrado: {item.registeredQuantity} {item.unit} | Encontrado: {item.countedQuantity ?? '-'} {item.unit}
                        </p>
                      </div>

                      <div>
                        {item.isAudited ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            🟢 CONFERIDO
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            🔴 PENDENTE
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleShareWhatsApp(selectedAudit)}
                  className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-500 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>COPIAR TEXTO WHATSAPP</span>
                </button>

                <button
                  onClick={() => onExportPDFForAudit(selectedAudit)}
                  className="flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>EXPORTAR PDF</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {shareText && (
        <WhatsAppShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="REGISTRO DE CONFERÊNCIA — TEXTO WHATSAPP"
          subtitle="Resumo formatado da conferência selecionada pronto para ser compartilhado."
          textToShare={shareText}
        />
      )}
    </div>
  );
};
