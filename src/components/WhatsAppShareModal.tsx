import React, { useState } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, Download } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await TextExportService.copyToClipboard(textToShare);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = TextExportService.getWhatsAppShareUrl(textToShare);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200 space-y-4">
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

        {/* Text Preview Box */}
        <div className="relative">
          <textarea
            readOnly
            value={textToShare}
            rows={9}
            className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none resize-none"
          />
          {copied && (
            <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Copiado!</span>
            </div>
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
