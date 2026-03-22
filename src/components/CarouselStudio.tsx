import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Plus, 
  Minus, 
  Type as TypeIcon, 
  Upload, 
  RefreshCw,
  ArrowRight,
  Maximize2,
  Factory,
  Layout,
  Zap,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  Palette,
  Layers,
  MessageSquare,
  Wand2,
  Quote,
  Copy,
  Check,
  Target,
  PenTool,
  Move,
  Grid,
  History,
  X,
  CheckCircle,
  Twitter,
  User,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BrandSelector, { Brand } from './BrandSelector';
import ExportEngine, { ExportEngineRef } from './ExportEngine';
import BatchFactory from './BatchFactory';
import Toast from './Toast';
import { generateCarouselContent, suggestTrends, generateAIImage, generateCaption, ContentFramework, TwitterFramework, generateTwitterThread } from '../services/geminiService';
import { CAROUSEL_PRESETS, CarouselPreset } from '../constants/presets';

const GOOGLE_FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif" },
  { name: 'Archivo Black', family: "'Archivo Black', sans-serif" },
  { name: 'Clash Display', family: "'Clash Display', sans-serif" },
  { name: 'Monument Extended', family: "'Monument Extended', sans-serif" },
  { name: 'Outfit', family: "'Outfit', sans-serif" },
  { name: 'Syne', family: "'Syne', sans-serif" },
];

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  bgImage: string;
  layout?: 'centered' | 'split' | 'editorial' | 'minimal';
}

type SidebarTab = 'content' | 'style' | 'brand' | 'ai';

type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top';

interface CaptionOptions {
  length: 'short' | 'medium' | 'long';
  style: 'persuasive' | 'educational' | 'minimalist';
}

const INITIAL_SLIDES: Slide[] = [
  { 
    id: '1', 
    title: "A NOVA ERA DO DESIGN AUTÔNOMO", 
    subtitle: "Como o CORE está redefinindo a criação de conteúdo para marcas de elite.", 
    bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop" 
  },
  { 
    id: '2', 
    title: "MÁXIMA PERFORMANCE, ZERO ESFORÇO", 
    subtitle: "Nossa IA analisa seu tom de voz e gera carrosséis que convertem em segundos.", 
    bgImage: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1080&auto=format&fit=crop" 
  },
  { 
    id: '3', 
    title: "DOMINE SEU NICHO AGORA", 
    subtitle: "O segredo das software houses do Vale do Silício finalmente revelado.", 
    bgImage: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=1080&auto=format&fit=crop" 
  }
];

export default function CarouselStudio() {
  const [mode, setMode] = useState<'studio' | 'factory' | 'twitter'>('studio');
  const [activeTab, setActiveTab] = useState<SidebarTab>('content');
  const [twitterProfile, setTwitterProfile] = useState({
    name: 'Tallis Gomes',
    handle: 'tallisgomes',
    isVerified: true
  });
  const [twitterStats, setTwitterStats] = useState({
    comments: '117',
    reposts: '174',
    likes: '2 mil',
    bookmarks: '1 mil',
    views: '134,1 mil'
  });
  const [theme, setTheme] = useState('');
  const [slidesCount, setSlidesCount] = useState(5);
  const [framework, setFramework] = useState<ContentFramework>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeBrandId, setActiveBrandId] = useState<string | undefined>(undefined);
  const [typography, setTypography] = useState(GOOGLE_FONTS[0].family);
  const [bodyTypography, setBodyTypography] = useState(GOOGLE_FONTS[0].family);
  const [proportion, setProportion] = useState<'feed' | 'story'>('feed');
  const [slides, setSlides] = useState<Slide[]>(INITIAL_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activePreset, setActivePreset] = useState<CarouselPreset>(CAROUSEL_PRESETS[0]);
  const [bgDirection, setBgDirection] = useState('');
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState(0.3);
  const [bgBlur, setBgBlur] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash-image');
  const [twitterFramework, setTwitterFramework] = useState<TwitterFramework>('viral_hook');
  const slideUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const exportEngineRef = useRef<ExportEngineRef>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-right');
  const [logoScale, setLogoScale] = useState(1);
  const [isSearchingTrends, setIsSearchingTrends] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionOptions, setCaptionOptions] = useState<CaptionOptions>({ length: 'medium', style: 'persuasive' });
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<{theme: string, slides: Slide[], date: string}[]>(() => {
    const saved = localStorage.getItem('carousel_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showTerminal, setShowTerminal] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingElement, setEditingElement] = useState<{ slideId: string; field: 'title' | 'subtitle' } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
  };

  const addLog = (msg: string) => {
    setTerminalLogs(prev => [...prev.slice(-5), `> ${msg}`]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAssets = Array.from(files).map(file => URL.createObjectURL(file as Blob));
      setUploadedAssets(prev => [...prev, ...newAssets]);
      addLog(`Assets importados: ${files.length} arquivos.`);
    }
  };

  const handleSearchTrends = async () => {
    setIsSearchingTrends(true);
    addLog("Iniciando busca de tendências globais...");
    try {
      const niche = activeBrand?.name || "Marketing Digital";
      const trends = await suggestTrends(niche);
      const randomTrend = trends[Math.floor(Math.random() * trends.length)];
      setTheme(randomTrend);
      addLog(`Tendência encontrada: ${randomTrend}`);
    } catch {
      addLog("Erro ao buscar tendências.");
    } finally {
      setIsSearchingTrends(false);
    }
  };

  const handleUpdateSlide = (id: string, field: 'title' | 'subtitle', value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Update slides structure when slidesCount changes
  const updateSlidesCount = useCallback((newCount: number) => {
    if (newCount === slidesCount) return;
    
    // Validate range
    const min = 2;
    const max = mode === 'twitter' ? 15 : 10;
    const validatedCount = Math.max(min, Math.min(max, newCount));
    
    setSlidesCount(validatedCount);
    
    // If we have slides, we need to adjust the array size
    if (slides.length > 0) {
      if (validatedCount > slides.length) {
        // Add new slots
        const additionalCount = validatedCount - slides.length;
        const newSlots = Array(additionalCount).fill(null).map((_, i) => ({
          id: (Date.now() + i + slides.length).toString(),
          title: "NOVO SLOT",
          subtitle: "Aguardando geração de conteúdo...",
          bgImage: slides[slides.length - 1]?.bgImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop",
          layout: (mode === 'twitter' ? 'minimal' : 'centered') as 'centered' | 'split' | 'editorial' | 'minimal'
        }));
        setSlides([...slides, ...newSlots]);
        addLog(`Adicionados ${additionalCount} novos slots de slide.`);
      } else if (validatedCount < slides.length) {
        // Remove slots
        const removedCount = slides.length - validatedCount;
        setSlides(slides.slice(0, validatedCount));
        addLog(`Removidos ${removedCount} slots de slide.`);
      }
    }
    
    addLog(`Capacidade total ajustada para ${validatedCount} slides.`);
  }, [slidesCount, mode, slides]);

  // Cap slidesCount when switching modes
  useEffect(() => {
    if (mode === 'studio' && slidesCount > 10) {
      updateSlidesCount(10);
    }
  }, [mode, slidesCount, updateSlidesCount]);

  const regenerateAllSlidesText = async () => {
    if (!theme || !activeBrand) {
      showToast("Defina um tema e selecione uma marca primeiro.");
      return;
    }

    setIsGenerating(true);
    setShowTerminal(true);
    addLog("Iniciando regeneração APENAS da copy (Mantendo Imagens)...");
    showToast("Regenerando textos...", "info");

    try {
      let result;
      if (mode === 'twitter') {
        const { generateTwitterThread } = await import('../services/geminiService');
        result = await generateTwitterThread(
          theme,
          activeBrand.instructions,
          activeBrand.tone || "",
          activeBrand.context || "",
          activeBrand.targetAudience || "",
          slides.length
        );
      } else {
        result = await generateCarouselContent(
          theme, 
          activeBrand.instructions, 
          activeBrand.tone || "",
          activeBrand.context || "",
          activeBrand.targetAudience || "",
          slides.length, 
          framework
        );
      }

      if (result.slides && result.slides.length > 0) {
        // Update only text content, keep images and layout
        const updatedSlides = slides.map((slide, i) => {
          if (i < result.slides.length) {
            return {
              ...slide,
              title: result.slides[i].title,
              subtitle: result.slides[i].subtitle
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        addLog("Copy regenerada com sucesso. Imagens preservadas.");
        showToast("Textos atualizados!", "success");
      }
    } catch (err) {
      console.error("Erro ao regenerar copy:", err);
      addLog("ERRO: Falha ao regenerar copy.");
      showToast("Erro ao regenerar textos.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!theme) {
      showToast("Defina um tema para o carrossel.");
      addLog("ERRO: Tema não definido.");
      return;
    }
    if (!activeBrand) {
      showToast("Selecione uma marca primeiro.");
      addLog("ERRO: Marca não selecionada.");
      return;
    }

    setIsGenerating(true);
    setShowTerminal(true);
    setTerminalLogs([]);
    addLog("Iniciando motor Antigravity...");
    showToast(mode === 'twitter' ? "Gerando thread viral..." : "Gerando carrossel de elite...", "info");
    
    // Set skeleton slides immediately
    const skeletonSlides = Array(slidesCount).fill(null).map((_, i) => ({
      id: (Date.now() + i).toString(),
      title: "GERANDO CONTEÚDO...",
      subtitle: mode === 'twitter' ? "O CORE está escrevendo sua thread viral..." : "O CORE está processando sua copy de elite...",
      bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop"
    }));
    setSlides(skeletonSlides);
    setCurrentSlideIndex(0);

    addLog(`Contexto: ${activeBrand.name}`);
    addLog(`Tema: ${theme}`);
    
    try {
      addLog("Injetando instruções de tom de voz e contexto de negócio...");
      
      let result;
      if (mode === 'twitter') {
        result = await generateTwitterThread(
          theme,
          activeBrand.instructions,
          activeBrand.tone || "",
          activeBrand.context || "",
          activeBrand.targetAudience || "",
          slidesCount,
          twitterFramework
        );
      } else {
        result = await generateCarouselContent(
          theme, 
          activeBrand.instructions, 
          activeBrand.tone || "",
          activeBrand.context || "",
          activeBrand.targetAudience || "",
          slidesCount, 
          framework
        );
      }
      
      if (!result.slides || result.slides.length === 0) {
        throw new Error("Nenhum slide gerado.");
      }

      addLog(mode === 'twitter' ? "Thread viral gerada com sucesso." : "Copy estratégica gerada com sucesso.");
      
      let newSlides: Slide[] = [];
      if (mode === 'twitter') {
        // For twitter mode, we can use simpler backgrounds or just a solid color
        newSlides = result.slides.map((s, i) => ({
          id: (Date.now() + i + 100).toString(),
          title: s.title,
          subtitle: s.subtitle,
          bgImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop", // Default for twitter
          layout: 'minimal'
        }));
        setSlides(newSlides);
      } else {
        addLog(`Gerando backgrounds contextuais com IA (${selectedModel === 'gemini-2.5-flash-image' ? 'Nano Banana' : 'Imagen'})...`);
        newSlides = await Promise.all(result.slides.map(async (s, i) => {
          const bgImage = await generateAIImage(
            s.imagePrompt, 
            bgDirection, 
            proportion === 'feed' ? '4:5' : '9:16',
            selectedModel
          );
          addLog(`Background ${i + 1} sincronizado com o conteúdo.`);
          return {
            id: (Date.now() + i + 100).toString(),
            title: s.title,
            subtitle: s.subtitle,
            bgImage,
            layout: s.layout
          };
        }));
        setSlides(newSlides);
      }
      
      // Save to history
      const newHistoryItem = { theme, slides: newSlides, date: new Date().toISOString() };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('carousel_history', JSON.stringify(updatedHistory));

      addLog("Renderização finalizada.");
      showToast(mode === 'twitter' ? "Thread gerada com sucesso!" : "Carrossel gerado com sucesso!", "success");
      
      if (scrollRef.current) scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      
      setTimeout(() => setShowTerminal(false), 3000);
    } catch (err) {
      addLog("CRITICAL ERROR: Falha na geração. Usando fallback.");
      showToast("Falha na conexão com a IA. Usando conteúdo de reserva.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSlideImageUpload = (slideId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSlides(prev => prev.map(s => s.id === slideId ? { ...s, bgImage: dataUrl } : s));
      showToast('Imagem do slide atualizada!', 'success');
      addLog(`Imagem personalizada aplicada ao slide.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateAll = async () => {
    if (!activeBrand || !theme) return;
    setIsGenerating(true);
    addLog('Regenerando todos os backgrounds com IA...');
    try {
      const updatedSlides = await Promise.all(
        slides.map(async (slide, i) => {
          const bgImage = await generateAIImage(
            `${theme} ${slide.title}`,
            bgDirection,
            proportion === 'feed' ? '4:5' : '9:16',
            selectedModel
          );
          addLog(`BG ${i + 1} gerado.`);
          return { ...slide, bgImage };
        })
      );
      setSlides(updatedSlides);
      showToast('Todos os backgrounds regenerados!', 'success');
    } catch (err) {
      addLog('Erro ao regenerar backgrounds.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSlideText = async () => {
    if (!activeBrand) return;
    addLog(`Regerando texto do slide ${currentSlideIndex + 1}...`);
    setIsGenerating(true);
    try {
      const result = await generateCarouselContent(
        `Reescreva este slide: ${slides[currentSlideIndex].title}`, 
        activeBrand.instructions,
        activeBrand.tone || "",
        activeBrand.context || "",
        activeBrand.targetAudience || "",
        1
      );
      if (result.slides && result.slides.length > 0) {
        const updatedSlides = [...slides];
        updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          title: result.slides[0].title,
          subtitle: result.slides[0].subtitle
        };
        setSlides(updatedSlides);
        addLog("Texto atualizado.");
      } else {
        throw new Error("Falha ao gerar novo texto.");
      }
    } catch {
      addLog("Erro ao regerar texto.");
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSlideImage = async () => {
    if (!activeBrand) return;
    addLog(`Sincronizando nova imagem IA para o slide ${currentSlideIndex + 1}...`);
    setIsGenerating(true);
    try {
      const bgImage = await generateAIImage(
        `${theme} ${slides[currentSlideIndex].title}`, 
        bgDirection,
        proportion === 'feed' ? '4:5' : '9:16',
        selectedModel
      );
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        bgImage
      };
      setSlides(updatedSlides);
      addLog("Imagem atualizada.");
    } catch {
      addLog("Erro ao gerar imagem.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!activeBrand || slides.length === 0) return;
    setIsGeneratingCaption(true);
    addLog(`Gerando legenda estratégica (${captionOptions.length}, ${captionOptions.style})...`);
    try {
      const contentSummary = slides.map(s => `${s.title}: ${s.subtitle}`).join('\n');
      const caption = await generateCaption(
        contentSummary, 
        activeBrand.tone, 
        captionOptions.length, 
        captionOptions.style
      );
      setGeneratedCaption(caption);
      setShowCaptionModal(true);
      addLog("Legenda gerada com sucesso.");
      showToast("Legenda pronta!", "success");
    } catch {
      addLog("Erro ao gerar legenda.");
      showToast("Erro ao gerar legenda.");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const applyQuickImprovement = async (instruction: string) => {
    if (!activeBrand) return;
    addLog(`Aplicando melhoria: ${instruction}...`);
    setIsGenerating(true);
    try {
      const currentSlide = slides[currentSlideIndex];
      const result = await generateCarouselContent(
        `Melhore este slide com base na instrução "${instruction}": Título: ${currentSlide.title}, Subtítulo: ${currentSlide.subtitle}`,
        activeBrand.instructions,
        activeBrand.tone || "",
        activeBrand.context || "",
        activeBrand.targetAudience || "",
        1
      );
      if (result.slides && result.slides.length > 0) {
        const updatedSlides = [...slides];
        updatedSlides[currentSlideIndex] = {
          ...updatedSlides[currentSlideIndex],
          title: result.slides[0].title,
          subtitle: result.slides[0].subtitle
        };
        setSlides(updatedSlides);
        addLog("Melhoria aplicada com sucesso.");
      } else {
        throw new Error("Falha ao aplicar melhoria.");
      }
    } catch {
      addLog("Erro ao aplicar melhoria.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInStudio = (title: string) => {
    setTheme(title);
    setMode('studio');
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentSlideIndex(index);
  };

  const nextSlide = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  const prevSlide = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex h-screen w-full bg-core-black overflow-hidden relative">
      {/* Sidebar Esquerda: PAINEL DE CONTROLE */}
      <aside className="w-[380px] h-full glass border-r border-white/10 p-8 flex flex-col gap-8 z-40 relative overflow-y-auto hide-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-core-neon rounded-none flex items-center justify-center">
              <span className="text-black font-black text-xs">C</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">CORE.CAROUSEL</h1>
          </div>
        </div>

        {/* Top Tab Navigation (New Tab Feel) */}
        <div className="flex glass p-1 rounded-none border border-white/10 mb-4">
          <button 
            onClick={() => setMode('studio')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 transition-all ${mode === 'studio' ? 'bg-core-neon text-black' : 'text-white/40 hover:text-white'}`}
          >
            <Layout className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Studio</span>
          </button>
          <button 
            onClick={() => setMode('twitter')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 transition-all ${mode === 'twitter' ? 'bg-blue-400 text-black' : 'text-white/40 hover:text-white'}`}
          >
            <Twitter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Twitter</span>
          </button>
          <button 
            onClick={() => setMode('factory')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 transition-all ${mode === 'factory' ? 'bg-core-neon text-black' : 'text-white/40 hover:text-white'}`}
          >
            <Factory className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Factory</span>
          </button>
        </div>

        {/* Sidebar Tabs */}
        {mode === 'studio' && (
          <div className="flex border-b border-white/10 mb-2">
            {[
              { id: 'content', icon: PenTool, label: 'Conteúdo' },
              { id: 'style', icon: Palette, label: 'Estilo' },
              { id: 'ai', icon: Wand2, label: 'IA' },
              { id: 'brand', icon: Target, label: 'Marca' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SidebarTab)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all relative ${activeTab === tab.id ? 'text-core-neon' : 'text-white/30 hover:text-white/60'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-[8px] uppercase font-bold tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-core-neon" />
                )}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'studio' ? (
            <motion.div 
              key="studio-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto hide-scrollbar pr-2">
                {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Framework Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <Grid className="w-3 h-3" /> Framework de Conteúdo
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'standard', name: 'Padrão' },
                        { id: 'aida', name: 'AIDA' },
                        { id: 'pas', name: 'PAS' },
                        { id: 'listicle', name: 'Lista' },
                        { id: 'storytelling', name: 'Story' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFramework(f.id as ContentFramework)}
                          className={`px-3 py-2 text-left border transition-all ${framework === f.id ? 'border-core-neon bg-core-neon/5 text-core-neon' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-tighter italic">{f.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Tema */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Tema Principal</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder="Ex: Estratégias de IA..."
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-core-neon transition-all duration-300 placeholder:text-white/20 pr-12"
                      />
                      <button 
                        onClick={handleSearchTrends}
                        disabled={isSearchingTrends}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-all duration-300 rounded-none group-hover:text-core-neon disabled:opacity-50"
                        title="Buscar Trends"
                      >
                        {isSearchingTrends ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Quantidade de Slides</label>
                      <span className="text-core-neon font-mono text-xs">{slidesCount}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateSlidesCount(Math.max(2, slidesCount - 1))} className="w-8 h-8 glass flex items-center justify-center hover:bg-white/10 transition-all duration-300">
                        <Minus className="w-3 h-3" />
                      </button>
                      <input 
                        type="range" min="2" max="10" value={slidesCount} 
                        onChange={(e) => updateSlidesCount(parseInt(e.target.value))}
                        className="flex-1 accent-core-neon h-1 bg-white/10 appearance-none cursor-pointer"
                      />
                      <button onClick={() => updateSlidesCount(Math.min(10, slidesCount + 1))} className="w-8 h-8 glass flex items-center justify-center hover:bg-white/10 transition-all duration-300">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Melhorias Adicionais */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Melhorias de Elite
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={regenerateAllSlidesText}
                        className="w-full bg-core-neon/10 border border-core-neon/30 p-4 text-[10px] font-black uppercase tracking-widest text-left hover:bg-core-neon hover:text-black transition-all flex items-center justify-between group mb-2"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-core-neon group-hover:text-black">Mudar Copy (Manter Imagens)</span>
                          <span className="text-[8px] opacity-50 lowercase tracking-normal font-normal">Regera todos os textos sem alterar o visual</span>
                        </div>
                        <RefreshCw className="w-4 h-4 text-core-neon group-hover:text-black group-hover:rotate-180 transition-all duration-500" />
                      </button>
                      
                      {[
                        { label: "Otimizar Conversão", action: "Otimizar para Conversão e ROI", icon: Zap },
                        { label: "Ajustar Tom", action: "Tornar o tom de voz mais agressivo e direto", icon: MessageSquare },
                        { label: "Gatilhos Mentais", action: "Injetar gatilhos mentais de escassez e exclusividade", icon: Sparkles },
                        { label: "Simplificar Copy", action: "Simplificar o texto para leitura rápida", icon: Wand2 },
                        { label: "Storytelling Viral", action: "Transformar em uma narrativa viciante e curiosa", icon: Quote },
                        { label: "Call to Action Forte", action: "Criar um CTA impossível de ignorar no último slide", icon: Target }
                      ].map(item => (
                        <button 
                          key={item.label}
                          onClick={() => applyQuickImprovement(item.action)}
                          className="w-full glass border border-white/10 p-3 text-[10px] font-black uppercase tracking-widest text-left hover:border-core-neon transition-all flex items-center justify-between group"
                        >
                          <span>{item.label}</span>
                          <item.icon className="w-3 h-3 text-white/20 group-hover:text-core-neon" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Histórico Recente */}
                  {history.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                        <History className="w-3 h-3" /> Histórico Recente
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar pr-2">
                        {history.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setTheme(item.theme);
                              setSlides(item.slides);
                              addLog(`Carregado: ${item.theme}`);
                            }}
                            className="w-full p-3 glass border border-white/5 text-left hover:border-white/20 transition-all group"
                          >
                            <div className="text-[10px] font-bold text-white/60 truncate group-hover:text-white">{item.theme}</div>
                            <div className="text-[8px] text-white/20 uppercase tracking-widest mt-1">{new Date(item.date).toLocaleDateString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'style' && (
                <div className="space-y-6">
                  {/* Presets Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Estilos Visuais
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CAROUSEL_PRESETS.map(preset => (
                        <button 
                          key={preset.id}
                          onClick={() => {
                            setActivePreset(preset);
                            setTypography(preset.font);
                            setBodyTypography(preset.font);
                          }}
                          className={`px-3 py-2 text-left border transition-all duration-300 group ${activePreset.id === preset.id ? 'border-core-neon bg-core-neon/5' : 'border-white/10 hover:border-white/30'}`}
                        >
                          <div className={`text-[10px] font-black uppercase tracking-tighter italic ${activePreset.id === preset.id ? 'text-core-neon' : 'text-white/60'}`}>
                            {preset.name}
                          </div>
                          <div className="text-[8px] text-white/30 uppercase tracking-widest mt-1 truncate">{preset.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipografia Pairing */}
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <TypeIcon className="w-3 h-3" /> Tipografia de Elite
                    </label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[8px] uppercase tracking-widest text-white/20">Título</span>
                        <select 
                          value={typography}
                          onChange={(e) => setTypography(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-core-neon"
                        >
                          {GOOGLE_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[8px] uppercase tracking-widest text-white/20">Corpo</span>
                        <select 
                          value={bodyTypography}
                          onChange={(e) => setBodyTypography(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-core-neon"
                        >
                          {GOOGLE_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Logo Controls */}
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <Move className="w-3 h-3" /> Posicionamento do Logo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'top-left', label: 'TL' },
                        { id: 'center-top', label: 'CT' },
                        { id: 'top-right', label: 'TR' },
                        { id: 'bottom-left', label: 'BL' },
                        { id: 'bottom-right', label: 'BR' }
                      ].map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => setLogoPosition(pos.id as LogoPosition)}
                          className={`py-2 text-[10px] font-bold border transition-all ${logoPosition === pos.id ? 'border-core-neon text-core-neon bg-core-neon/5' : 'border-white/10 text-white/30 hover:border-white/30'}`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/20">
                        <span>Escala do Logo</span>
                        <span>{Math.round(logoScale * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="2" step="0.1" value={logoScale}
                        onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                        className="w-full accent-core-neon h-1 bg-white/10 appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Proporção */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Proporção</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setProportion('feed')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-xs border transition-all duration-300 ${proportion === 'feed' ? 'border-core-neon text-core-neon bg-core-neon/5' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                      >
                        <Monitor className="w-3 h-3" />
                        Feed (4:5)
                      </button>
                      <button 
                        onClick={() => setProportion('story')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-xs border transition-all duration-300 ${proportion === 'story' ? 'border-core-neon text-core-neon bg-core-neon/5' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                      >
                        <Smartphone className="w-3 h-3" />
                        Story (9:16)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-6">
                  {/* Motor de Geração */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <Zap className="w-3 h-3" /> Motor de Geração de Imagem
                    </label>
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-core-neon transition-all duration-300 text-white appearance-none cursor-pointer"
                    >
                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image ✦ GRÁTIS (500/dia) — Recomendado</option>
                      <option value="imagen-4.0-generate-001">Imagen 4 (Pago – Requer Créditos)</option>
                    </select>
                    <p className="text-[8px] text-white/20 uppercase tracking-widest leading-relaxed">
                      Gemini 2.0 Flash Image gera até 500 imagens/dia gratuitamente via Google AI Studio.
                    </p>
                  </div>

                  {/* Direcionamento de Imagem */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Direcionamento de Background
                    </label>
                    <textarea 
                      value={bgDirection}
                      onChange={(e) => setBgDirection(e.target.value)}
                      placeholder="Ex: Estilo futurista, tons de azul, luzes neon, minimalista..."
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-core-neon transition-all duration-300 placeholder:text-white/20 h-32 resize-none"
                    />
                    <p className="text-[8px] text-white/20 uppercase tracking-widest leading-relaxed">
                      Dica: Use palavras como "cinematic", "high-end", "minimalist", "architectural" for melhores resultados.
                    </p>
                  </div>

                  {/* Background Overlays */}
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Ajustes de Camada
                    </label>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/20">
                          <span>Opacidade do Overlay</span>
                          <span>{Math.round(bgOverlayOpacity * 100)}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="1" step="0.05" value={bgOverlayOpacity}
                          onChange={(e) => setBgOverlayOpacity(parseFloat(e.target.value))}
                          className="w-full accent-core-neon h-1 bg-white/10 appearance-none cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/20">
                          <span>Blur do Background</span>
                          <span>{bgBlur}px</span>
                        </div>
                        <input 
                          type="range" min="0" max="20" step="1" value={bgBlur}
                          onChange={(e) => setBgBlur(parseInt(e.target.value))}
                          className="w-full accent-core-neon h-1 bg-white/10 appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'brand' && (
                <div className="space-y-6">
                  <BrandSelector onSelect={(brand) => { setActiveBrand(brand); setActiveBrandId(brand.id); }} activeBrandId={activeBrandId} />
                  
                  {/* Upload Zona */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Assets Adicionais</label>
                    <label className="border-2 border-dashed border-white/10 p-6 flex flex-col items-center justify-center gap-2 hover:border-core-neon/50 transition-all duration-300 cursor-pointer group bg-white/[0.02] relative">
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                      <Upload className="w-6 h-6 text-white/20 group-hover:text-core-neon transition-colors" />
                      <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Importar Assets</span>
                    </label>
                    {uploadedAssets.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
                        {uploadedAssets.map((asset, i) => (
                          <img key={i} src={asset} className="w-10 h-10 object-cover border border-white/10 rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

              <div className="mt-auto pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-14 bg-core-neon text-black font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-3 hover:bg-white transition-all duration-500 group relative overflow-hidden disabled:opacity-50"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Gerar Carrossel</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute top-0 left-0 w-1/2 h-full bg-white/30 skew-x-[-20deg] pointer-events-none"
                  />
                </button>
              </div>
            </motion.div>
          ) : mode === 'twitter' ? (
            <motion.div 
              key="twitter-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6 flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto hide-scrollbar pr-2 space-y-6">
                <div className="glass p-6 border-l-4 border-l-blue-400">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-blue-400" /> Twitter Thread Mode
                  </h3>
                  <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
                    Crie threads virais com o visual clássico do Twitter. Ideal para conteúdo direto e de alto engajamento.
                  </p>
                </div>

                {/* Profile Config */}
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                    <User className="w-3 h-3" /> Perfil do Twitter
                  </label>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={twitterProfile.name}
                      onChange={(e) => setTwitterProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome de Exibição"
                      className="w-full bg-white/5 border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-blue-400 transition-all"
                    />
                    <input 
                      type="text" 
                      value={twitterProfile.handle}
                      onChange={(e) => setTwitterProfile(prev => ({ ...prev, handle: e.target.value }))}
                      placeholder="@usuario"
                      className="w-full bg-white/5 border border-white/10 px-4 py-2 text-xs focus:outline-none focus:border-blue-400 transition-all"
                    />
                    <div className="flex items-center justify-between glass p-3 border border-white/10">
                      <span className="text-[10px] uppercase tracking-widest text-white/40">Selo de Verificado</span>
                      <button 
                        onClick={() => setTwitterProfile(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                        className={`p-2 transition-all ${twitterProfile.isVerified ? 'text-blue-400' : 'text-white/20'}`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Engajamento do Tweet */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                    <Heart className="w-3 h-3" /> Estatísticas de Engajamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'comments', label: 'Comentários' },
                      { key: 'reposts', label: 'Reposts' },
                      { key: 'likes', label: 'Curtidas' },
                      { key: 'bookmarks', label: 'Bookmarks' },
                      { key: 'views', label: 'Visualizações' },
                    ].map(({ key, label }) => (
                      <div key={key} className={key === 'views' ? 'col-span-2' : ''}>
                        <label className="text-[8px] uppercase tracking-widest text-white/25 mb-1 block">{label}</label>
                        <input
                          type="text"
                          value={(twitterStats as Record<string, string>)[key]}
                          onChange={(e) => setTwitterStats(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={label}
                          className="w-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400 transition-all font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Twitter Framework Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold flex items-center gap-2">
                    <Grid className="w-3 h-3" /> Modelo de Comunicação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'viral_hook', name: 'Viral Hook' },
                      { id: 'storytelling', name: 'Story' },
                      { id: 'aida', name: 'AIDA' },
                      { id: 'pas', name: 'PAS' },
                      { id: 'thought_leader', name: 'Thought Leader' },
                      { id: 'cold_outreach', name: 'Authority' },
                      { id: 'listicle', name: 'Listicle' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setTwitterFramework(f.id as TwitterFramework)}
                        className={`px-3 py-2 text-left border transition-all ${
                          twitterFramework === f.id
                            ? 'border-blue-400 bg-blue-400/5 text-blue-400'
                            : 'border-white/10 text-white/40 hover:border-white/30'
                        }`}
                      >
                        <div className="text-[9px] font-black uppercase tracking-tighter">{f.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thread Theme */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Tema da Thread</label>
                  <textarea 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Sobre o que será sua thread viral?"
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-all h-24 resize-none"
                  />
                </div>

                {/* Slides Count */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Número de Tweets</label>
                    <span className="text-blue-400 font-mono text-xs">{slidesCount}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => updateSlidesCount(Math.max(2, slidesCount - 1))} className="w-8 h-8 glass flex items-center justify-center hover:bg-white/10 transition-all">
                      <Minus className="w-3 h-3" />
                    </button>
                    <input 
                      type="range" min="2" max="15" value={slidesCount} 
                      onChange={(e) => updateSlidesCount(parseInt(e.target.value))}
                      className="flex-1 accent-blue-400 h-1 bg-white/10 appearance-none cursor-pointer"
                    />
                    <button onClick={() => updateSlidesCount(Math.min(15, slidesCount + 1))} className="w-8 h-8 glass flex items-center justify-center hover:bg-white/10 transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <BrandSelector onSelect={(brand) => { setActiveBrand(brand); setActiveBrandId(brand.id); }} activeBrandId={activeBrandId} />
              </div>

              <div className="mt-auto pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-14 bg-blue-400 text-black font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-3 hover:bg-white transition-all duration-500 group relative overflow-hidden disabled:opacity-50"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Gerar Thread Viral</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="factory-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass p-6 border-l-4 border-l-core-neon">
                <h3 className="text-sm font-black uppercase tracking-widest mb-2">Modo Fábrica Ativo</h3>
                <p className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wider">
                  Produção em massa habilitada. O sistema irá processar múltiplos carrosséis simultaneamente baseados no macro-tema.
                </p>
              </div>
              <BrandSelector onSelect={(brand) => { setActiveBrand(brand); setActiveBrandId(brand.id); }} activeBrandId={activeBrandId} />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-core-neon">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Motor Antigravity Ativo</span>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-loose">
                  • Injeção de Contexto Ativa<br/>
                  • Processamento Paralelo<br/>
                  • Exportação Global ZIP
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* WORKSPACE DE RENDERIZAÇÃO (Centro) */}
      <main className="flex-1 h-full relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_#121212_0%,_#050505_100%)] overflow-y-auto hide-scrollbar">
        {/* Top Status Bar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-30">
          <div className="flex items-center gap-2 glass px-4 py-2 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${activeBrand ? 'bg-core-neon animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              {activeBrand ? `Brain: ${activeBrand.name}` : 'Brain: Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 glass px-4 py-2 border border-white/10">
            <Zap className="w-3 h-3 text-core-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              Motor: Antigravity v2.5
            </span>
          </div>
        </div>
        {/* Status Bar (Interactive Loading) */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              className="absolute top-0 left-0 right-0 z-[100] glass border-b border-core-neon/30 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-8 h-8 border-2 border-core-neon/20 border-t-core-neon rounded-full animate-spin" />
                  <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-core-neon animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-tighter uppercase italic text-core-neon">Antigravity Engine Ativo</h3>
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.2em]">Sincronizando com o cérebro: {activeBrand?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="h-full w-1/2 bg-core-neon"
                  />
                </div>
                <span className="text-[8px] font-mono text-core-neon animate-pulse">SYNCING_COPY...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode !== 'factory' ? (
            <>
              <motion.div 
                key="studio-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl flex flex-col items-center gap-8 p-12"
              >
              {/* Background Grid Accent */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

              <div className="relative w-full flex flex-col items-center gap-8">
                <div className="flex items-center justify-between w-full px-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-core-neon" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/60">Live Preview Studio</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-mono text-white/30">
                    <span>{mode === 'twitter' ? '1080 x 1080' : proportion === 'feed' ? '1080 x 1350' : '1080 x 1920'} px</span>
                    <span>{mode === 'twitter' ? '1:1' : proportion === 'feed' ? '4:5' : '9:16'} Ratio</span>
                  </div>
                </div>

                {/* Carousel Container with Snap Scroll */}
                <div 
                  ref={scrollRef}
                  onScroll={handleScroll}
                  id="carousel-preview"
                  className={`w-full ${
                    mode === 'twitter'
                      ? 'aspect-square max-h-[70vh]'
                      : proportion === 'feed'
                      ? 'aspect-[4/5] max-h-[70vh]'
                      : 'aspect-[9/16] max-h-[80vh]'
                  } flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-4 cursor-grab active:cursor-grabbing`}
                >
                  {slides.map((slide, idx) => (
                    <div 
                      key={slide.id}
                      className="min-w-full h-full snap-center relative overflow-hidden shadow-2xl group/slide bg-black"
                      id={`slide-${slide.id}`}
                    >
                      {mode === 'twitter' ? (
                        /* TWITTER MODE — Layout fiel ao X/Twitter */
                        <div className="absolute inset-0 bg-[#000000] flex flex-col" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
                          {/* ── CONTEÚDO CENTRALIZADO ── */}
                          <div className="flex-1 flex flex-col justify-center px-10 py-8 gap-0 min-h-0">

                            {/* ── HEADER: Avatar + Nome + Handle + Badge + Menu ── */}
                            <div className="flex items-start justify-between mb-5">
                              <div className="flex items-center gap-4">
                                {/* Avatar circular — usa logo do brand */}
                                <div className="w-[52px] h-[52px] rounded-full overflow-hidden flex-shrink-0 bg-white/10 border border-white/10">
                                  {activeBrand?.logo ? (
                                    <img
                                      src={activeBrand.logo}
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                                      <span className="text-white/60 text-lg font-bold">
                                        {(twitterProfile.name || 'U').charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {/* Nome + Handle */}
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-white text-[1.05rem] font-bold leading-tight tracking-[-0.01em]">
                                      {twitterProfile.name || activeBrand?.name || 'Usuário'}
                                    </span>
                                    {twitterProfile.isVerified && (
                                      /* Badge azul verificado — SVG nativo do X */
                                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="10" fill="#1D9BF0"/>
                                        <path d="M8.5 14L4.5 10L5.92 8.58L8.5 11.17L14.08 5.59L15.5 7L8.5 14Z" fill="white"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-white/50 text-[0.88rem] leading-tight">
                                    @{twitterProfile.handle || (activeBrand?.name || 'usuario').toLowerCase().replace(/\s/g, '')}
                                  </span>
                                </div>
                              </div>
                              {/* Ícones de menu direito — Mute + ... */}
                              <div className="flex items-center gap-2 mt-1 text-white/40">
                                {/* Ícone "mudo" (círculo com barra diagonal — X/Twitter) */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                </svg>
                                {/* ··· */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                                </svg>
                              </div>
                            </div>

                            {/* ── CORPO DO TWEET ── */}
                            <div className="flex flex-col gap-0 mb-5">
                              <div
                                className={`text-white text-[1.38rem] leading-[1.4] font-normal tracking-[-0.005em] whitespace-pre-wrap break-words cursor-text outline-none focus:bg-white/5 rounded transition-all ${editingElement?.slideId === slide.id && editingElement?.field === 'title' ? 'bg-white/5' : ''}`}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => setEditingElement({ slideId: slide.id, field: 'title' })}
                                onBlur={(e) => {
                                  handleUpdateSlide(slide.id, 'title', e.currentTarget.textContent || '');
                                  setEditingElement(null);
                                }}
                              >
                                {slide.title}
                              </div>

                              {slide.subtitle && slide.subtitle.trim() !== '' && (
                                <>
                                  <div className="h-5" />
                                  <div
                                    className={`text-white text-[1.38rem] leading-[1.4] font-normal tracking-[-0.005em] whitespace-pre-wrap break-words cursor-text outline-none focus:bg-white/5 rounded transition-all ${editingElement?.slideId === slide.id && editingElement?.field === 'subtitle' ? 'bg-white/5' : ''}`}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onFocus={() => setEditingElement({ slideId: slide.id, field: 'subtitle' })}
                                    onBlur={(e) => {
                                      handleUpdateSlide(slide.id, 'subtitle', e.currentTarget.textContent || '');
                                      setEditingElement(null);
                                    }}
                                  >
                                    {slide.subtitle}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* ── LINHA DE DATA + VIEWS ── */}
                            <div className="text-[0.88rem] text-white/50 mb-4 leading-tight">
                              <span>7:20 PM · {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span className="mx-1">·</span>
                              <span className="text-white font-bold">{twitterStats.views}</span>
                              <span className="text-white/50"> Visualizações</span>
                            </div>

                            {/* ── DIVISOR ── */}
                            <div className="h-px bg-white/10 mb-4" />

                            {/* ── BARRA DE ENGAJAMENTO ── */}
                            <div className="flex items-center justify-between text-white/50">
                              {/* Comentários */}
                              <div className="flex items-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                <span className="text-[0.82rem]">{twitterStats.comments}</span>
                              </div>
                              {/* Reposts */}
                              <div className="flex items-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <polyline points="17 1 21 5 17 9"/>
                                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                  <polyline points="7 23 3 19 7 15"/>
                                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                                </svg>
                                <span className="text-[0.82rem]">{twitterStats.reposts}</span>
                              </div>
                              {/* Curtidas */}
                              <div className="flex items-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                                <span className="text-[0.82rem]">{twitterStats.likes}</span>
                              </div>
                              {/* Bookmarks */}
                              <div className="flex items-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                </svg>
                                <span className="text-[0.82rem]">{twitterStats.bookmarks}</span>
                              </div>
                              {/* Compartilhar */}
                              <div className="flex items-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                  <polyline points="16 6 12 2 8 6"/>
                                  <line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Watermark de slide discreta */}
                          {slides.length > 1 && (
                            <div className="absolute top-4 right-4 text-white/15 text-[10px] font-mono tracking-widest select-none">
                              {idx + 1}/{slides.length}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* STANDARD CAROUSEL UI */
                        <>
                          <div className="absolute inset-0 bg-black overflow-hidden" style={{ backgroundColor: activePreset.bg }}>
                            <img 
                              src={slide.bgImage} 
                              alt={slide.title} 
                              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[3000ms] group-hover/slide:scale-110 filter contrast-125 brightness-75 saturate-150 ${
                                slide.layout === 'split' ? 'h-[60%]' : 'h-full'
                              }`}
                              style={{ filter: `blur(${bgBlur}px) contrast(125%) brightness(75%) saturate(150%)` }}
                              referrerPolicy="no-referrer"
                            />
                            {/* Brand Color Overlay */}
                            <div 
                              className={`absolute inset-0 mix-blend-overlay ${slide.layout === 'split' ? 'h-[60%]' : 'h-full'}`} 
                              style={{ 
                                backgroundColor: activeBrand?.primaryColor || activePreset.accent,
                                opacity: bgOverlayOpacity
                              }}
                            />
                            {/* Vignette */}
                            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] ${slide.layout === 'split' ? 'h-[60%]' : 'h-full'}`} />
                          </div>
                          
                          {/* Layout Specific Backgrounds */}
                          {slide.layout === 'split' && (
                            <div 
                              className={`absolute bottom-0 left-0 right-0 h-[40%] bg-black z-10 border-t ${activePreset.id === 'cinematic-neon' ? 'border-core-neon shadow-[0_-10px_30px_rgba(0,255,0,0.2)]' : 'border-white/10'}`} 
                              style={{ backgroundColor: activePreset.bg }} 
                            />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-0" />
                          
                          {/* Hook Slide Source Metadata — driven by brand context */}
                          {idx === 0 && (
                            <div className="absolute bottom-32 left-12 right-12 z-50 opacity-40">
                              <p className="text-[8px] font-mono uppercase tracking-widest leading-relaxed">
                                {activeBrand
                                  ? `${activeBrand.name} · ${activeBrand.tone || 'Brand Voice'} · ${activeBrand.targetAudience ? `Para: ${activeBrand.targetAudience}` : 'Content Strategy'}`
                                  : 'Internal Data · Market Research · AI Analysis · Industry Trends 2026'
                                }
                              </p>
                            </div>
                          )}
                          
                          {/* Slide Header Metadata — brand name + framework */}
                          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50 mix-blend-difference opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">
                              {activeBrand?.name || 'CORE.CAROUSEL'} · {framework.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black uppercase tracking-[0.3em]">@{activeBrand?.name.toLowerCase().replace(/\s/g, '') || 'brandname'}</span>
                              <span className="text-[8px] font-black uppercase tracking-[0.3em]">2026 //</span>
                            </div>
                          </div>

                          {/* Logo Rendering */}
                          {activeBrand?.logo && (
                            <div 
                              className={`absolute z-50 p-12 transition-all duration-500 ${
                                logoPosition === 'top-left' ? 'top-8 left-0' :
                                logoPosition === 'top-right' ? 'top-8 right-0' :
                                logoPosition === 'bottom-left' ? 'bottom-8 left-0' :
                                logoPosition === 'bottom-right' ? 'bottom-8 right-0' :
                                'top-8 left-1/2 -translate-x-1/2'
                              }`}
                            >
                              <img 
                                src={activeBrand.logo} 
                                alt="Logo" 
                                className="h-10 w-auto object-contain drop-shadow-2xl"
                                style={{ transform: `scale(${logoScale})` }}
                              />
                            </div>
                          )}

                          <div className={`absolute inset-0 p-12 flex flex-col gap-6 z-20 ${
                            slide.layout === 'split' ? 'justify-end pb-24' :
                            slide.layout === 'editorial' ? 'justify-center items-center text-center' :
                            slide.layout === 'minimal' ? 'justify-center items-center text-center' :
                            'justify-end pb-32'
                          }`}>
                            <motion.div
                              initial={{ y: 30, opacity: 0 }}
                              whileInView={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                              className={`relative z-10 ${slide.layout === 'split' ? 'w-full' : 'w-full'}`}
                            >
                              <div className={`flex items-center gap-3 mb-8 ${
                                slide.layout === 'minimal' || slide.layout === 'editorial' ? 'justify-center' : ''
                              }`}>
                                <span 
                                  className="font-mono text-[10px] tracking-[0.5em] uppercase px-3 py-1 border backdrop-blur-md"
                                  style={{ 
                                    color: activeBrand?.primaryColor || activePreset.accent,
                                    borderColor: `${activeBrand?.primaryColor || activePreset.accent}40`,
                                    backgroundColor: `${activeBrand?.primaryColor || activePreset.accent}10`
                                  }}
                                >
                                  Slide 0{idx + 1}
                                </span>
                                {idx === 0 && slide.title !== "GERANDO CONTEÚDO..." && (
                                  <span className="bg-white text-black text-[8px] font-black uppercase tracking-widest px-2 py-1 italic">
                                    [ THE HOOK ]
                                  </span>
                                )}
                              </div>
                              
                              <h2 
                                className={`font-black tracking-tighter leading-[0.85] uppercase mb-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] cursor-text outline-none focus:ring-2 focus:ring-core-neon/50 p-2 -m-2 transition-all ${
                                  slide.layout === 'minimal' || slide.layout === 'editorial' ? 'text-5xl md:text-7xl italic' : 'text-4xl md:text-6xl italic'
                                } ${editingElement?.slideId === slide.id && editingElement?.field === 'title' ? 'bg-white/10' : ''}`} 
                                style={{ 
                                  fontFamily: typography,
                                  color: activePreset.color
                                }}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => setEditingElement({ slideId: slide.id, field: 'title' })}
                                onBlur={(e) => {
                                  handleUpdateSlide(slide.id, 'title', e.currentTarget.textContent || '');
                                  setEditingElement(null);
                                }}
                              >
                                {slide.title.split(' ').map((word, i, arr) => (
                                  <span key={i} className={i === arr.length - 1 ? 'underline decoration-core-neon decoration-4 underline-offset-8' : ''}>
                                    {word}{' '}
                                  </span>
                                ))}
                              </h2>

                              {/* Floating Swipe Indicator */}
                              <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 opacity-40 group-hover/slide:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                  <ChevronRight className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              
                              <p 
                                className={`text-sm md:text-xl max-w-2xl leading-tight font-bold drop-shadow-lg tracking-tight cursor-text outline-none focus:ring-2 focus:ring-core-neon/50 p-2 -m-2 transition-all ${
                                  slide.layout === 'minimal' || slide.layout === 'editorial' ? 'mx-auto' : ''
                                } ${editingElement?.slideId === slide.id && editingElement?.field === 'subtitle' ? 'bg-white/10' : ''}`}
                                style={{ 
                                  color: `${activePreset.color}CC`,
                                  fontFamily: bodyTypography
                                }}
                                contentEditable
                                suppressContentEditableWarning
                                onFocus={() => setEditingElement({ slideId: slide.id, field: 'subtitle' })}
                                onBlur={(e) => {
                                  handleUpdateSlide(slide.id, 'subtitle', e.currentTarget.textContent || '');
                                  setEditingElement(null);
                                }}
                              >
                                {slide.subtitle}
                              </p>
                            </motion.div>
                          </div>

                          {/* Slide Footer Metadata */}
                          <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end z-50">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3" style={{ color: activeBrand?.primaryColor || '#60A5FA' }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: activeBrand?.primaryColor || undefined }}>
                                  @{activeBrand?.name.toLowerCase().replace(/\s/g, '') || 'brandname'}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {slides.map((_, sIdx) => (
                                  <div 
                                    key={sIdx} 
                                    className={`h-1 rounded-full transition-all duration-500 ${sIdx === idx ? 'w-4 bg-white' : 'w-1 bg-white/20'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-60">Arrasta pro lado {'>>>'}</span>
                            </div>
                          </div>

                          {/* Corner Accents */}
                          <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-white/10" />
                          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-white/10" />
                          <div className="absolute top-8 left-8 text-[8px] font-mono text-white/10 uppercase tracking-[1em] vertical-text">{activeBrand?.name || 'CORE.SYSTEM'}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                </div>

                {/* Post-Generation Toolbar */}
                {slides.length > 0 && !isGenerating && slides[0].title !== "GERANDO CONTEÚDO..." && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-none"
                  >
                    <button 
                      onClick={handleGenerateCaption}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-core-neon transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Gerar Legenda
                    </button>
                    <button 
                      onClick={() => exportEngineRef.current?.exportAsZip()}
                      className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Slides
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Nova Variação
                    </button>
                  </motion.div>
                )}

                {/* Navigation Arrows */}
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-8 pointer-events-none">
                  <button 
                    onClick={prevSlide}
                    className={`w-12 h-12 glass flex items-center justify-center hover:bg-white/10 transition-all pointer-events-auto ${currentSlideIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className={`w-12 h-12 glass flex items-center justify-center hover:bg-white/10 transition-all pointer-events-auto ${currentSlideIndex === slides.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex gap-2 mt-4">
                  {slides.map((_, i) => (
                    <div key={i} className={`h-1 transition-all duration-500 ${i === currentSlideIndex ? 'w-8 bg-core-neon' : 'w-2 bg-white/10'}`} />
                  ))}
                </div>

                {/* FERRAMENTAS ESPECIAIS (Floating Toolbar) */}
                <div className="glass px-6 py-3 rounded-none border border-white/10 flex items-center gap-8 shadow-2xl relative z-50">
                  <button 
                    onClick={regenerateSlideText}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors group"
                  >
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span>Regerar Texto</span>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button 
                    onClick={regenerateSlideImage}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors group"
                  >
                    <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Regerar Fundo</span>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button 
                    onClick={regenerateAllSlidesText}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors group"
                  >
                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Regerar Toda Copy</span>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button 
                    onClick={() => setShowFullPreview(true)}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors group"
                  >
                    <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Full Preview</span>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button 
                    onClick={handleGenerateCaption}
                    disabled={isGeneratingCaption}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors group disabled:opacity-50"
                  >
                    {isGeneratingCaption ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Quote className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                    <span>Gerar Legenda</span>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <label
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors cursor-pointer group"
                    title="Enviar imagem para o slide atual"
                  >
                    <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Upload Fundo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSlideImageUpload(slides[currentSlideIndex].id, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <div className="w-px h-4 bg-white/10" />
                  <button
                    onClick={handleRegenerateAll}
                    disabled={isGenerating}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:text-core-neon transition-colors group disabled:opacity-40"
                    title="Regerar backgrounds de todos os slides com IA"
                  >
                    <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Todos os BGs</span>
                  </button>
                </div>
              <ExportEngine 
                ref={exportEngineRef}
                slidesCount={slidesCount} 
                slides={slides} 
                proportion={proportion}
                showToast={showToast} 
              />
            </motion.div>
          </>
          ) : (
            <motion.div 
              key="factory-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full h-full"
            >
              <BatchFactory onOpenInStudio={handleOpenInStudio} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Overlay */}
        <AnimatePresence>
          {showTerminal && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md glass p-4 border border-core-neon/30 pointer-events-none z-[60]"
            >
              <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                <Terminal className="w-3 h-3 text-core-neon" />
                <span className="text-[8px] font-mono text-core-neon uppercase tracking-widest">Antigravity Engine Output</span>
              </div>
              <div className="space-y-1 font-mono text-[10px] text-white/60">
                {terminalLogs.map((log, i) => (
                  <div key={i} className={i === terminalLogs.length - 1 ? 'text-core-neon' : ''}>{log}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Preview Modal */}
        <AnimatePresence>
          {showFullPreview && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl p-8 overflow-y-auto"
            >
              <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex justify-between items-center sticky top-0 z-10 bg-black/50 backdrop-blur-md py-4 border-b border-white/10">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Review do Lote</h2>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">{theme} • {slides.length} Slides</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        setShowFullPreview(false);
                        exportEngineRef.current?.exportAsZip();
                      }}
                      className="px-8 py-4 bg-core-neon text-black font-black uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Exportar Agora</span>
                    </button>
                    <button 
                      onClick={() => setShowFullPreview(false)}
                      className="px-8 py-4 border border-white/20 text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Voltar ao Studio
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {slides.map((slide, i) => (
                    <div key={slide.id} className="space-y-4">
                      <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Slide {i + 1}</div>
                      <div 
                        className="aspect-[4/5] bg-white/5 border border-white/10 overflow-hidden relative group"
                        style={{ 
                          backgroundImage: `url(${slide.bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                        <div className="absolute inset-0 p-6 flex flex-col justify-center text-center">
                          <h3 className="text-xl font-black uppercase italic leading-tight mb-2" style={{ fontFamily: typography }}>{slide.title}</h3>
                          <p className="text-xs text-white/70 leading-relaxed" style={{ fontFamily: bodyTypography }}>{slide.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption Modal */}
        <AnimatePresence>
          {showCaptionModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCaptionModal(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl glass border-2 border-white/10 p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-6 h-6 text-core-neon" />
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Legenda Estratégica</h2>
                  </div>
                  <button onClick={() => setShowCaptionModal(false)} className="p-2 hover:bg-white/10 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Estilo</label>
                    <select 
                      value={captionOptions.style}
                      onChange={(e) => setCaptionOptions(prev => ({ ...prev, style: e.target.value as CaptionOptions['style'] }))}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-core-neon text-white"
                    >
                      <option value="persuasive">Persuasivo</option>
                      <option value="educational">Educativo</option>
                      <option value="minimalist">Minimalista</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Tamanho</label>
                    <select 
                      value={captionOptions.length}
                      onChange={(e) => setCaptionOptions(prev => ({ ...prev, length: e.target.value as CaptionOptions['length'] }))}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-xs focus:outline-none focus:border-core-neon text-white"
                    >
                      <option value="short">Curto</option>
                      <option value="medium">Médio</option>
                      <option value="long">Longo</option>
                    </select>
                  </div>
                </div>

                <div className="relative group mb-8">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-none font-mono text-sm leading-relaxed whitespace-pre-wrap h-[300px] overflow-y-auto hide-scrollbar">
                    {isGeneratingCaption ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <span className="text-[10px] uppercase tracking-widest">Gerando Legenda...</span>
                      </div>
                    ) : (
                      generatedCaption
                    )}
                  </div>
                  {!isGeneratingCaption && (
                    <button 
                      onClick={handleGenerateCaption}
                      className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 transition-all text-white/40 hover:text-white"
                      title="Regerar Legenda"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCaption);
                      showToast("Legenda copiada!", "success");
                    }}
                    className="flex-1 h-14 glass border border-white/10 text-white font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Legenda
                  </button>
                  <button 
                    onClick={() => setShowCaptionModal(false)}
                    className="flex-1 h-14 bg-core-neon text-black font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:bg-white transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Aprovar e Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              isVisible={true}
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
