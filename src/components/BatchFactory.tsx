import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Zap,
  Download,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateBatchIdeas } from '../services/geminiService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface BatchItem {
  id: string;
  status: 'generating' | 'ready' | 'review';
  title: string;
  slides: number;
}

interface BatchFactoryProps {
  onOpenInStudio: (title: string) => void;
}

export default function BatchFactory({ onOpenInStudio }: BatchFactoryProps) {
  const [macroTheme, setMacroTheme] = useState('');
  const [batchSize, setBatchSize] = useState(5);
  const [isProducing, setIsProducing] = useState(false);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const startProduction = async () => {
    if (!macroTheme) return;
    
    setIsProducing(true);
    setItems([]);
    setApprovedCount(0);

    try {
      const ideas = await generateBatchIdeas(macroTheme, batchSize);
      
      const newItems: BatchItem[] = ideas.map((title) => ({
        id: Math.random().toString(36).substr(2, 9),
        status: 'generating',
        title,
        slides: Math.floor(Math.random() * 5) + 5
      }));

      setItems(newItems);

      // Simulate production flow
      newItems.forEach((item, index) => {
        setTimeout(() => {
          setItems(prev => prev.map(p => 
            p.id === item.id ? { ...p, status: Math.random() > 0.1 ? 'ready' : 'review' } : p
          ));
        }, (index + 1) * 600);
      });
    } catch (error) {
      console.error("Batch production failed", error);
    } finally {
      setTimeout(() => setIsProducing(false), batchSize * 600 + 500);
    }
  };

  const approveAll = () => {
    setApprovedCount(items.length);
  };

  const exportBatch = async () => {
    setIsExporting(true);
    setExportProgress(0);
    try {
      const zip = new JSZip();
      const folder = zip.folder("batch_carrossel_core");
      
      const totalToExport = approvedCount || items.length;
      
      for (let i = 0; i < totalToExport; i++) {
        const item = items[i];
        setExportProgress(Math.round((i / totalToExport) * 100));
        
        const content = [
          `====================================`,
          `BRIEFING DE CARROSSEL #${i + 1}`,
          `====================================`,
          `TEMA: ${item.title}`,
          `SLIDES ESTIMADOS: ${item.slides}`,
          `STATUS: ${item.status === 'ready' ? 'Aprovado' : 'Para revisão'}`,
          ``,
          `ESTRUTURA SUGERIDA:`,
          `  Slide 1 [HOOK]: ${item.title}`,
          `  Slide 2 [CONTEXTO]: Por que isso importa?`,
          `  Slides 3-${item.slides - 1} [VALOR]: Insights, dicas ou passos`,
          `  Slide ${item.slides} [CTA]: Comentem, salvem ou sigam`,
          ``,
          `PROMPT PARA O STUDIO:`,
          `  → Abra o CORE Studio → Cole o tema abaixo → Clique em Gerar`,
          `  Tema: "${item.title}"`,
          `====================================`,
        ].join('\n');
        folder?.file(`${String(i + 1).padStart(2, '0')}_${item.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.txt`, content);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setExportProgress(100);
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `batch_core_${Date.now()}.zip`);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter italic uppercase">Fábrica de Lotes</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Gere ideias em massa · Exporte como briefings para o Studio</p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-4xl font-black italic">{items.length}</div>
            <div className="text-[8px] uppercase tracking-widest text-white/20">Projetos</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black italic text-core-neon">{approvedCount}</div>
            <div className="text-[8px] uppercase tracking-widest text-white/20">Aprovados</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Macro-Tema do Lote</label>
            <input 
              type="text"
              value={macroTheme}
              onChange={(e) => setMacroTheme(e.target.value)}
              placeholder="Ex: Mitos da Energia Fotovoltaica..."
              className="w-full bg-white/5 border-2 border-white/10 p-6 text-2xl font-black tracking-tight focus:outline-none focus:border-core-neon transition-all placeholder:text-white/10 uppercase italic"
            />
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Volume de Produção</label>
            <div className="flex gap-2">
              {[5, 15, 30].map(size => (
                <button 
                  key={size}
                  onClick={() => setBatchSize(size)}
                  className={`flex-1 h-16 border-2 transition-all font-black text-xl ${batchSize === size ? 'border-core-neon text-core-neon bg-core-neon/5' : 'border-white/10 text-white/20 hover:border-white/30'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end gap-4">
          <button 
            onClick={startProduction}
            disabled={isProducing || !macroTheme}
            className="w-full h-24 bg-core-neon text-black font-black text-2xl uppercase tracking-tighter flex items-center justify-center gap-4 hover:bg-white transition-all duration-500 group disabled:opacity-30 relative overflow-hidden"
          >
            {isProducing ? (
              <>
                <Zap className="w-8 h-8 animate-pulse" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Play className="w-8 h-8 group-hover:scale-125 transition-transform" />
                <span>Iniciar Produção</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-xl font-black italic uppercase">Linha de Montagem</h2>
              <div className="flex gap-4">
                <button onClick={approveAll} className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">Aprovar Todos</button>
                <button 
                  onClick={exportBatch} 
                  disabled={isExporting}
                  className="flex items-center gap-2 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all hover:text-black disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Exportando {exportProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      <span>Exportar Briefings</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass p-6 space-y-4 group hover:border-white/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                      item.status === 'ready' ? 'bg-core-neon text-black' : 
                      item.status === 'review' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/40'
                    }`}>
                      {item.status === 'ready' ? 'Pronto' : item.status === 'review' ? 'Revisar' : 'Gerando'}
                    </div>
                    <div className="text-[10px] font-mono text-white/20">#{i + 1}</div>
                  </div>

                  <h3 className="text-lg font-black leading-tight uppercase italic group-hover:text-core-neon transition-colors">{item.title}</h3>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {item.slides} Slides
                    </div>
                    <button 
                      onClick={() => onOpenInStudio(item.title)}
                      className="p-2 hover:bg-white/10 transition-colors rounded-full"
                    >
                      <Zap className="w-4 h-4 text-core-neon" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
