import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Download, Share2, CheckCircle2, Loader2, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ExportEngineProps {
  slidesCount: number;
  slides: { id: string }[];
  proportion: 'feed' | 'story';
  showToast: (message: string, type?: 'error' | 'success' | 'info') => void;
}

export interface ExportEngineRef {
  exportAsZip: () => Promise<void>;
}

/** Captures a slide DOM element at high resolution using html2canvas */
async function captureSlideAtHighRes(
  element: HTMLElement,
  slideId: string,
  targetWidth: number = 1080
): Promise<Blob | null> {
  const scale = targetWidth / element.offsetWidth;
  
  // Prepare clone overrides to ensure the element renders at full quality
  return new Promise((resolve) => {
    html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#000000',
      imageTimeout: 30000,
      x: 0,
      y: 0,
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.offsetWidth,
      windowHeight: element.offsetHeight,
      onclone: (clonedDoc) => {
        // Fix the cloned element position so it renders fully
        const clonedElement = clonedDoc.getElementById(slideId);
        if (clonedElement) {
          clonedElement.style.position = 'fixed';
          clonedElement.style.top = '0';
          clonedElement.style.left = '0';
          clonedElement.style.width = `${element.offsetWidth}px`;
          clonedElement.style.height = `${element.offsetHeight}px`;
          clonedElement.style.zIndex = '99999';
          clonedElement.style.transform = 'none';
          clonedElement.style.overflow = 'hidden';
          const parent = clonedElement.parentElement;
          if (parent) {
            parent.style.overflow = 'visible';
          }
        }

        // Patch oklch / oklab colors (html2canvas doesn't support modern CSS color functions)
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          const cs = window.getComputedStyle(el);
          (['color', 'backgroundColor', 'borderColor'] as const).forEach((prop) => {
            const val = cs.getPropertyValue(prop);
            if (val && (val.includes('oklch') || val.includes('oklab'))) {
              (el.style as unknown as Record<string, string>)[prop] = '#ffffff';
            }
          });
        }

        // Inject neon color overrides
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          * { -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
          [class*="text-core-neon"] { color: #CCFF00 !important; }
          [class*="bg-core-neon"]   { background-color: #CCFF00 !important; }
          [class*="border-core-neon"] { border-color: #CCFF00 !important; }
          [class*="decoration-core-neon"] { text-decoration-color: #CCFF00 !important; }
          [class*="underline"] { text-underline-offset: 8px; }
        `;
        clonedDoc.head.appendChild(style);
      },
    }).then((canvas) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    }).catch(() => resolve(null));
  });
}

const ExportEngine = forwardRef<ExportEngineRef, ExportEngineProps>(({ slides, proportion, showToast }, ref) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSlideLabel, setCurrentSlideLabel] = useState('');

  const exportAsZip = async () => {
    if (slides.length === 0) {
      showToast('Nenhum slide para exportar.', 'error');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setCurrentSlideLabel('Preparando...');

    try {
      const zip = new JSZip();
      const folder = zip.folder('carrossel_core');

      for (let i = 0; i < slides.length; i++) {
        const slideId = `slide-${slides[i].id}`;
        const element = document.getElementById(slideId);
        const label = `slide_${String(i + 1).padStart(2, '0')}.png`;
        setCurrentSlideLabel(`Capturando ${label}...`);
        setProgress(Math.round((i / slides.length) * 85));

        if (!element) {
          console.warn(`[EXPORT] Element #${slideId} not found, skipping.`);
          continue;
        }

        // Ensure all images are loaded before capture
        const imgs = Array.from(element.getElementsByTagName('img'));
        await Promise.all(
          imgs.map(
            (img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((res) => {
                    img.addEventListener('load', () => res(), { once: true });
                    img.addEventListener('error', () => res(), { once: true });
                  })
          )
        );

        // Small settle time
        await new Promise((res) => setTimeout(res, 200));

        // Instagram standard feed is 1080x1350, stories are 1080x1920
        // We calculate scale to force exactly 1080 width on the output relative to element's screen width
        const blob = await captureSlideAtHighRes(element, slideId, 1080);
        if (blob && folder) {
          folder.file(label, blob);
        }
      }

      setCurrentSlideLabel('Comprimindo ZIP...');
      setProgress(92);

      const content = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (metadata) => {
          setProgress(92 + Math.round(metadata.percent * 0.08));
        }
      );

      setProgress(100);
      setCurrentSlideLabel('Concluído!');
      saveAs(content, `carrossel_core_${Date.now()}.zip`);

      setExportComplete(true);
      showToast(`${slides.length} slides exportados em alta qualidade!`, 'success');
      setTimeout(() => setExportComplete(false), 4000);
    } catch (error) {
      console.error('[EXPORT] Critical error:', error);
      showToast('Erro ao exportar. Tente novamente.', 'error');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        setCurrentSlideLabel('');
      }, 1000);
    }
  };

  useImperativeHandle(ref, () => ({ exportAsZip }));

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Carrossel CORE',
          text: 'Gerado pelo CORE.CAROUSEL — Elite Content Engine',
          url: window.location.href,
        });
      } catch (_) { /* cancelled */ }
    } else {
      showToast('Compartilhamento nativo não disponível. Use o Download.', 'info');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {/* Native share (mobile) */}
      <AnimatePresence>
        {!isExporting && !exportComplete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            onClick={shareNative}
            className="w-10 h-10 glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group shadow-xl"
            title="Compartilhar (Mobile)"
          >
            <Share2 className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Export Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        onClick={exportAsZip}
        disabled={isExporting}
        className={`h-12 px-5 glass border flex items-center gap-3 transition-all duration-500 disabled:cursor-wait group shadow-xl ${
          exportComplete
            ? 'border-core-neon bg-core-neon text-black'
            : isExporting
            ? 'border-core-neon/40 bg-core-neon/10 text-core-neon'
            : 'border-white/20 hover:bg-core-neon hover:text-black hover:border-core-neon'
        }`}
      >
        <AnimatePresence mode="wait">
          {isExporting ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight">
                  {currentSlideLabel}
                </span>
                <div className="w-full h-[2px] bg-white/10 mt-1 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-core-neon rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[8px] font-mono text-core-neon/70 mt-0.5">{progress}%</span>
              </div>
            </motion.div>
          ) : exportComplete ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Exportado!</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Baixar ZIP</span>
                <span className="text-[8px] text-white/40 group-hover:text-black/60 transition-colors font-mono">
                  {slides.length} slides · Alta Qualidade
                </span>
              </div>
              <ImageIcon className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
});

export default ExportEngine;
