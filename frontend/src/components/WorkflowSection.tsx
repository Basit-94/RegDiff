import React from 'react';

interface WorkflowSectionProps {
  onOpenProof: () => void;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({ onOpenProof }) => {
  return (
    <section className="pt-8" id="how-it-works">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4 relative">
        <div className="flex items-center justify-center gap-3 -mt-4 mb-6">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-coral/50"></div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#0d1322] border border-coral/30 dark:border-coral/40 text-[10px] font-mono font-bold text-coral dark:text-coral-accent uppercase tracking-widest shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-coral animate-ping"></span>
            <span>AST Stream Active</span>
            <span className="material-symbols-outlined text-xs">south</span>
          </div>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-coral/50"></div>
        </div>
        
        <div className="inline-flex items-center gap-2 p-[2px] rounded-full bg-gradient-to-r from-coral-vivid via-coral-sunset to-coral-tangerine shadow-sm">
          <div className="px-4 py-1.5 rounded-full bg-white dark:bg-[#080c14] flex items-center gap-2 text-coral dark:text-coral-accent font-mono text-xs font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-xs text-coral animate-spin-slow">sync_alt</span>
            <span>The RegDiff Workflow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-coral"></span>
          </div>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-bold text-forest-ink dark:text-white tracking-tight leading-[1.12]">
          Crafted like a world-class studio.{' '}
          <span className="text-dance-shimmer italic font-normal block sm:inline">
            Built for compliance officers.
          </span>
        </h2>
        <p className="text-forest-muted dark:text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          No robotic fluff or legalese boilerplate. Every paragraph is treated with precision typography, syntactic logic, and undeniable audit trails.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {/* Card 1 */}
        <div 
          className="p-8 rounded-clay-xl bg-white dark:bg-[#0e1420] border border-coral/20 dark:border-[#1e293b] hover:border-coral/50 shadow-clay dark:shadow-dark-clay transition-all space-y-4 group hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
          onClick={() => {
            const el = document.getElementById('tracked-laws');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral dark:text-coral-accent flex items-center justify-center group-hover:bg-coral group-hover:text-white transition-all ring-1 ring-coral/30">
            <span className="material-symbols-outlined text-2xl">document_scanner</span>
          </div>
          <span className="text-xs font-mono font-bold text-coral dark:text-coral-accent tracking-wider uppercase">01 • Gazettes Ingest</span>
          <h3 className="font-display text-xl font-bold text-forest-ink dark:text-white">Direct Register Feed</h3>
          <p className="text-sm text-forest-muted dark:text-slate-400 leading-relaxed font-sans">
            Direct real-time pipelines into GPO, Federal Register, and official EU gazettes. The second a statute passes committee, we parse it into semantic vectors.
          </p>
          <div className="pt-4 border-t border-coral/15 dark:border-slate-800 flex items-center text-xs font-bold text-coral dark:text-coral-accent gap-1 group-hover:gap-2 transition-all w-full">
            <span>Explore source pipelines</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          className="p-8 rounded-clay-xl bg-gradient-to-br from-coral-vivid via-coral to-coral-tangerine dark:from-[#1c1218] dark:via-[#1f1412] dark:to-[#25100c] text-white shadow-clay-lg dark:shadow-dark-clay space-y-4 group hover:-translate-y-1 transition-all border-2 border-white/20 dark:border-coral shadow-glow-coral flex flex-col justify-between relative overflow-hidden cursor-pointer"
          onClick={() => {
            const el = document.getElementById('demo');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-coral/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 dark:bg-coral/25 backdrop-blur text-white flex items-center justify-center ring-1 ring-white/30 dark:ring-coral/40 shadow-neon-coral">
            <span className="material-symbols-outlined text-2xl text-white dark:text-coral-accent">edit_note</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-200 dark:text-amber-300 tracking-wider uppercase">02 • Intelligent Synthesis</span>
          <h3 className="font-display text-xl font-bold text-white">Syntactical Replacement</h3>
          <p className="text-sm text-white/95 dark:text-slate-200 leading-relaxed font-sans">
            Our neural legal diff engine writes ready-to-sign replacement clauses matching your company handbook tone, internal lexicon, and specific jurisdictional limits.
          </p>
          <div className="pt-4 border-t border-white/20 dark:border-coral/30 flex items-center text-xs font-bold text-amber-200 dark:text-amber-300 gap-1 group-hover:gap-2 transition-all w-full">
            <span>Check the syntax benchmarks</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          className="p-8 rounded-clay-xl bg-white dark:bg-[#0e1420] border border-coral/20 dark:border-[#1e293b] hover:border-emerald-500/50 shadow-clay dark:shadow-dark-clay transition-all space-y-4 group hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
          onClick={onOpenProof}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all ring-1 ring-emerald-400/40 dark:ring-emerald-500/40">
            <span className="material-symbols-outlined text-2xl">fingerprint</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">03 • Cryptographic Seal</span>
          <h3 className="font-display text-xl font-bold text-forest-ink dark:text-white">Verifiable Proof Engine</h3>
          <p className="text-sm text-forest-muted dark:text-slate-400 leading-relaxed font-sans">
            Give regulators a single hash. Every redline is sealed with verifiable timestamps, statutory parentage, and chain-of-custody hashes examiners adore.
          </p>
          <div className="pt-4 border-t border-coral/15 dark:border-slate-800 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1 group-hover:gap-2 transition-all w-full">
            <span>Verify audit proof specs</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </section>
  );
};
