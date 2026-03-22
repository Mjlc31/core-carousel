import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Check, 
  Trash2,
  Upload,
  X,
  ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Brand {
  id: string;
  name: string;
  logo?: string; // base64 data URL or remote URL
  primaryColor: string;
  secondaryColor: string;
  colors?: string[];
  typography: string;
  bodyTypography: string;
  tone: string;
  targetAudience: string;
  instructions: string;
  context?: string;
}

interface BrandSelectorProps {
  onSelect: (brand: Brand) => void;
  activeBrandId?: string;
}

const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'core-default',
    name: 'CORE.CAROUSEL',
    primaryColor: '#CCFF00',
    secondaryColor: '#000000',
    typography: 'Inter',
    bodyTypography: 'Inter',
    tone: 'Elite, disruptivo, tecnológico e direto.',
    targetAudience: 'Empreendedores digitais, designers e agências de elite.',
    instructions: 'Sempre use uma linguagem de alto impacto, focada em resultados e autoridade.'
  }
];

export default function BrandSelector({ onSelect, activeBrandId }: BrandSelectorProps) {
  const [brands, setBrands] = useState<Brand[]>(() => {
    try {
      const saved = localStorage.getItem('carousel_brands');
      return saved ? JSON.parse(saved) : DEFAULT_BRANDS;
    } catch {
      return DEFAULT_BRANDS;
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBrand, setNewBrand] = useState<Partial<Brand>>({
    primaryColor: '#CCFF00',
    secondaryColor: '#000000',
    typography: 'Inter',
    bodyTypography: 'Inter'
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem (PNG, JPG, SVG, WebP).');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setNewBrand(prev => ({ ...prev, logo: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddBrand = () => {
    if (!newBrand.name) return;
    const brand: Brand = {
      ...(newBrand as Brand),
      id: Math.random().toString(36).substr(2, 9)
    };
    const updated = [...brands, brand];
    setBrands(updated);
    try {
      localStorage.setItem('carousel_brands', JSON.stringify(updated));
    } catch { /* storage full, ignore */ }
    setShowAddModal(false);
    setNewBrand({
      primaryColor: '#CCFF00',
      secondaryColor: '#000000',
      typography: 'Inter',
      bodyTypography: 'Inter'
    });
    setLogoPreview(null);
  };

  const handleDeleteBrand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'core-default') return;
    const updated = brands.filter(b => b.id !== id);
    setBrands(updated);
    localStorage.setItem('carousel_brands', JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Brand Context</label>
        <button 
          onClick={() => setShowAddModal(true)}
          className="p-1.5 hover:bg-white/10 transition-colors rounded border border-white/10 hover:border-core-neon/40 group"
          title="Adicionar nova marca"
        >
          <Plus className="w-3.5 h-3.5 text-core-neon group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {brands.map(brand => (
          <button
            key={brand.id}
            onClick={() => onSelect(brand)}
            className={`group relative flex items-center gap-4 p-4 border-2 transition-all duration-500 ${
              activeBrandId === brand.id 
                ? 'border-core-neon bg-core-neon/5 neon-glow' 
                : 'border-white/5 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            {/* Logo or initial avatar */}
            <div 
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center font-black text-xl italic overflow-hidden"
              style={{ backgroundColor: brand.primaryColor, color: brand.secondaryColor }}
            >
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                brand.name[0]
              )}
            </div>
            
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-black uppercase tracking-tight italic truncate">{brand.name}</div>
              <div className="text-[8px] uppercase tracking-widest text-white/30 truncate">{brand.tone}</div>
            </div>

            {activeBrandId === brand.id && (
              <Check className="w-4 h-4 text-core-neon flex-shrink-0" />
            )}

            {brand.id !== 'core-default' && (
              <button 
                onClick={(e) => handleDeleteBrand(brand.id, e)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Add Brand Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass w-full max-w-2xl p-8 space-y-6 border border-white/10 max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Nova Marca</h2>
                <button 
                  onClick={() => { setShowAddModal(false); setLogoPreview(null); }} 
                  className="p-2 hover:bg-white/10 transition-colors rounded"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-5">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                      Logo / Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div 
                        className="w-16 h-16 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-white/20 overflow-hidden"
                        style={{ backgroundColor: newBrand.primaryColor || '#111' }}
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-white/20" />
                        )}
                      </div>
                      {/* Upload button */}
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 border border-white/10 py-2.5 text-[10px] font-black uppercase tracking-widest hover:border-core-neon hover:text-core-neon transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Enviar Logo
                        </button>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={() => { setLogoPreview(null); setNewBrand(p => ({ ...p, logo: undefined })); }}
                            className="w-full text-[9px] text-white/30 hover:text-red-400 transition-colors uppercase tracking-widest"
                          >
                            Remover logo
                          </button>
                        )}
                        <p className="text-[8px] text-white/20 uppercase tracking-widest">
                          PNG · JPG · SVG · WebP
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Nome da Marca</label>
                    <input 
                      type="text" 
                      value={newBrand.name || ''}
                      onChange={e => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:outline-none focus:border-core-neon transition-all placeholder:text-white/20"
                      placeholder="Ex: Elite Agency"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Cor Primária</label>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2">
                        <input 
                          type="color" 
                          value={newBrand.primaryColor || '#CCFF00'}
                          onChange={e => setNewBrand(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-8 h-8 bg-transparent border-none cursor-pointer rounded"
                        />
                        <span className="text-[10px] font-mono text-white/60">{newBrand.primaryColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Cor Secundária</label>
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2">
                        <input 
                          type="color" 
                          value={newBrand.secondaryColor || '#000000'}
                          onChange={e => setNewBrand(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-8 h-8 bg-transparent border-none cursor-pointer rounded"
                        />
                        <span className="text-[10px] font-mono text-white/60">{newBrand.secondaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-5">
                  {/* Tone */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tom de Voz</label>
                    <textarea 
                      value={newBrand.tone || ''}
                      onChange={e => setNewBrand(prev => ({ ...prev, tone: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:outline-none focus:border-core-neon h-20 resize-none placeholder:text-white/20"
                      placeholder="Ex: Profissional, disruptivo, direto..."
                    />
                  </div>
                  {/* Audience */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Público-Alvo</label>
                    <input 
                      type="text" 
                      value={newBrand.targetAudience || ''}
                      onChange={e => setNewBrand(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:outline-none focus:border-core-neon placeholder:text-white/20"
                      placeholder="Ex: Empreendedores digitais..."
                    />
                  </div>
                  {/* Instructions */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Contexto & Instruções</label>
                    <textarea 
                      value={newBrand.instructions || ''}
                      onChange={e => setNewBrand(prev => ({ ...prev, instructions: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:outline-none focus:border-core-neon h-20 resize-none placeholder:text-white/20"
                      placeholder="Ex: Sempre usar números e provas sociais..."
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAddBrand}
                disabled={!newBrand.name}
                className="w-full py-4 bg-core-neon text-black font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Salvar Marca
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
