import React from 'react';

interface ManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManifestoModal: React.FC<ManifestoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#0e1422] border border-coral/30 dark:border-[#1e293d] rounded-3xl shadow-2xl p-6 sm:p-8 text-forest-ink dark:text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors text-lg"
        >
          &times;
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
          <span className="font-mono text-xs uppercase font-bold text-coral tracking-wider">
            Direction 3 • Kinetic Obsidian Redline
          </span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 text-forest-ink dark:text-white">
          The RegDiff Design System &amp; AST Philosophy
        </h2>

        <div className="space-y-4 text-sm text-forest-muted dark:text-slate-300 leading-relaxed font-sans">
          <p>
            Regulatory technology historically suffered from grey enterprise form grids and dense impenetrable legal jargon. RegDiff approaches statutory compliance as a creative studio craft: pairing warm editorial typography (<span className="font-display font-semibold text-forest-ink dark:text-white">Fraunces</span>) with crisp geometric sans (<span className="font-sans font-semibold text-forest-ink dark:text-white">Plus Jakarta Sans</span>) and monospace telemetry (<span className="font-mono font-semibold text-forest-ink dark:text-white">JetBrains Mono</span>).
          </p>

          <div className="p-4 rounded-2xl bg-apricot-50 dark:bg-[#080c14] border border-coral/20 font-mono text-xs space-y-2">
            <div className="text-coral font-bold">// Design Tokens &amp; Chromatic Triad</div>
            <div>• <strong className="text-forest-ink dark:text-white">Canvas</strong>: Light Apricot (#FFFDF9) / Kinetic Obsidian (#080c14)</div>
            <div>• <strong className="text-forest-ink dark:text-white">Critical Accent</strong>: Radiant Coral (#FF5722)</div>
            <div>• <strong className="text-forest-ink dark:text-white">Conformity Token</strong>: Cyber Emerald (#10B981)</div>
            <div>• <strong className="text-forest-ink dark:text-white">Audit Trail</strong>: Genesis Append-Only SHA-256 Ledger (11 Blocks)</div>
          </div>

          <p>
            The interactive Mascot companion (<strong className="text-coral">Rusty the Legal Inspector</strong>) monitors active cursor coordinates in real-time, rotating his brass magnifying glass and tracking regulatory AST clauses as examiners inspect policy handbooks.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-coral/20 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-coral hover:bg-coral-hover text-white text-xs font-bold shadow-neon-coral transition-all"
          >
            Close Notes
          </button>
        </div>
      </div>
    </div>
  );
};
