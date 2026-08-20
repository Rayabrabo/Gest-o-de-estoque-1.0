import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, Download, RotateCcw, Edit3 } from 'lucide-react';
import { TextExportService } from '../services/textExportService';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  textToShare: string;
  onDownloadPdf?: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  title = 'COPIAR PARA WHATSAPP',
  subtitle = 'Texto formatado pronto para copiar ou enviar diretamente pelo WhatsApp.',
  textToShare,
  onDownloadPdf
}) => {
  const [editableText, setEditableText] = useState(textToShare);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditableText(textToShare);
  }, [textToShare, isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await TextExportService.copyToClipboard(editableText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = TextExportService.getWhatsAppShareUrl(editableText);
    window.open(url, '_blank');
  };

  const handleReset = () => {
    setEditableText(textToShare);
  };

  const isModified = editableText !== textToShare;
  const lineCount = editableText.split('\n').filter(l => l.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden p-6 animate-in zoom-in-95 duration-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500 font-normal">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Notice & Tooling bar */}
        <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 px-3 py-2 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
            <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Texto 100% Editável: ajuste itens e quantidades livremente</span>
          </div>
          {isModified && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-300 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
              title="Reverter alterações e voltar ao texto original gerado"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Original</span>
            </button>
          )}
        </div>

        {/* Text Preview / Edit Box */}
        <div className="relative">
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={10}
            placeholder="Digite ou edite o texto da lista..."
            className="w-full p-3.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none resize-y transition-all"
          />
          {copied && (
            <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Copiado!</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
          <span>{lineCount} linhas de texto</span>
          {isModified && (
            <span className="text-amber-600 font-semibold">● Texto modificado manualmente</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'COPIADO COM SUCESSO!' : 'COPIAR TEXTO'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ABRIR NO WHATSAPP</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-75" />
            </button>
          </div>

          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>BAIXAR RELATÓRIO EM PDF</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-1.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
