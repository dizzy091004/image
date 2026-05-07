/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { Upload, RotateCcw, Download, Maximize2, Image as ImageIcon, Lock, Unlock, Percent, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatBytes, resizeImage } from '@/src/lib/image-utils';
import { cn } from '@/src/lib/utils';

interface ImageState {
  original: {
    url: string;
    width: number;
    height: number;
    size: number;
    type: string;
    element: HTMLImageElement | null;
  } | null;
  resized: {
    url: string;
    width: number;
    height: number;
    size: number;
  } | null;
}

export default function App() {
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    resized: null,
  });
  
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    percentage: 100,
  });
  
  const [isLocked, setIsLocked] = useState(true);
  const [usePercentage, setUsePercentage] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(85);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageState({
          original: {
            url: event.target?.result as string,
            width: img.width,
            height: img.height,
            size: file.size,
            type: file.type,
            element: img,
          },
          resized: null, // Reset resized when new file uploaded
        });
        setDimensions({
          width: img.width,
          height: img.height,
          percentage: 100,
        });
        setFormat(file.type);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImageState({
            original: {
              url: event.target?.result as string,
              width: img.width,
              height: img.height,
              size: file.size,
              type: file.type,
              element: img,
            },
            resized: null,
          });
          setDimensions({
            width: img.width,
            height: img.height,
            percentage: 100,
          });
          setFormat(file.type);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDimensionChange = (field: 'width' | 'height' | 'percentage', value: number) => {
    if (!imageState.original) return;

    const ratio = imageState.original.width / imageState.original.height;

    if (field === 'percentage') {
      const newWidth = Math.round((imageState.original.width * value) / 100);
      const newHeight = Math.round((imageState.original.height * value) / 100);
      setDimensions({ width: newWidth, height: newHeight, percentage: value });
    } else if (field === 'width') {
      const newHeight = isLocked ? Math.round(value / ratio) : dimensions.height;
      setDimensions(prev => ({ 
        ...prev, 
        width: value, 
        height: newHeight,
        percentage: Math.round((value / imageState.original!.width) * 100)
      }));
    } else {
      const newWidth = isLocked ? Math.round(value * ratio) : dimensions.width;
      setDimensions(prev => ({ 
        ...prev, 
        height: value, 
        width: newWidth,
        percentage: Math.round((value / imageState.original!.height) * 100)
      }));
    }
  };

  const triggerResize = async () => {
    if (!imageState.original?.element) return;
    setIsResizing(true);
    try {
      const result = await resizeImage(
        imageState.original.element,
        dimensions.width,
        dimensions.height,
        format,
        quality / 100
      );
      setImageState(prev => ({
        ...prev,
        resized: {
          url: result.dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          size: result.size,
        }
      }));
    } catch (error) {
      console.error('Resize failed', error);
    } finally {
      setIsResizing(false);
    }
  };

  const downloadImage = () => {
    if (!imageState.resized) return;
    const link = document.createElement('a');
    link.href = imageState.resized.url;
    link.download = `resized-${dimensions.width}x${dimensions.height}.${format.split('/')[1]}`;
    link.click();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 px-6 shrink-0 flex items-center justify-between bg-white border-b border-slate-200 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            PixelFix <span className="text-blue-600 font-medium text-[10px] border border-blue-100 bg-blue-50 px-2 py-0.5 rounded-full ml-2 align-middle">PRO</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="text-blue-600">Resizer</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Compressor</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Converter</a>
          </nav>
          <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors active:scale-95">Login</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-80 h-full bg-white border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto no-scrollbar">
          
          {/* File Info */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Current File</h2>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {imageState.original ? 'uploaded_image.png' : 'No image selected'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                {imageState.original ? `${imageState.original.width} x ${imageState.original.height} • ${formatBytes(imageState.original.size)}` : '0 x 0 • 0 KB'}
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-3 h-3" /> {imageState.original ? 'Replace Image' : 'Choose Image'}
            </button>
          </div>

          {/* Resize Settings */}
          <div className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Resize Settings</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Width (px)</label>
                <input 
                  type="number" 
                  value={dimensions.width || ''}
                  disabled={!imageState.original}
                  onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all disabled:opacity-50"
                  placeholder="1920"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Height (px)</label>
                <input 
                  type="number" 
                  value={dimensions.height || ''}
                  disabled={!imageState.original}
                  onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all disabled:opacity-50"
                  placeholder="1080"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsLocked(!isLocked)}>
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-all",
                isLocked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 bg-white"
              )}>
                {isLocked && <Lock className="w-2.5 h-2.5" />}
              </div>
              <label className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                Maintain Aspect Ratio ({imageState.original ? (imageState.original.width / imageState.original.height).toFixed(2) : '1.00'})
              </label>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-500 ml-1">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'image/jpeg', label: 'JPG' },
                  { id: 'image/png', label: 'PNG' },
                  { id: 'image/webp', label: 'WEBP' }
                ].map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    disabled={!imageState.original}
                    className={cn(
                      "py-2 text-[10px] font-black rounded-lg transition-all border",
                      format === f.id 
                        ? "bg-blue-50 border-blue-200 text-blue-600" 
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Quality</label>
                <span className="text-[11px] font-black text-blue-600 font-mono">{quality}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={quality}
                disabled={!imageState.original}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={imageState.resized ? downloadImage : triggerResize}
              disabled={!imageState.original || isResizing}
              className={cn(
                "w-full py-4 text-white font-black rounded-xl text-sm shadow-xl transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none flex items-center justify-center gap-2",
                imageState.resized ? "bg-green-600 shadow-green-600/20 hover:bg-green-700" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700"
              )}
            >
              {isResizing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (imageState.resized ? <Download className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />)}
              {imageState.resized ? 'Download Image' : 'Apply Settings'}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
              {imageState.resized ? `Actual size: ${formatBytes(imageState.resized.size)}` : 'Wait for resize to see size'}
            </p>
          </div>
        </aside>

        {/* Right Side: Live Preview Area */}
        <section className="flex-1 p-8 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Preview Canvas
            </h3>
            <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
               <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><Maximize2 className="w-4 h-4" /></button>
               <div className="h-3 w-px bg-slate-200"></div>
               <span className="text-slate-500 font-mono text-[10px] font-bold">100%</span>
            </div>
          </div>

          {/* Canvas Backdrop */}
          <div 
            className="flex-1 bg-slate-100 rounded-3xl overflow-hidden shadow-inner relative flex items-center justify-center border border-slate-200/50" 
            style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <AnimatePresence mode="wait">
              {!imageState.original ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 text-sm">No image to preview</p>
                    <p className="text-xs text-slate-300 font-medium">Drag an image here to get started</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative p-8 max-w-full max-h-full flex items-center justify-center"
                >
                  <div className={cn(
                    "relative shadow-2xl rounded-lg overflow-hidden border-[6px] border-white transition-all duration-700",
                    isResizing && "opacity-50 scale-[0.98] blur-sm"
                  )}>
                    <img 
                      src={imageState.resized?.url || imageState.original.url} 
                      alt="Preview" 
                      className="max-w-full max-h-[70vh] object-contain rounded-sm"
                    />
                    
                    {/* Floating Info Badges */}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider">
                      {imageState.resized ? 'PREVIEW' : 'ORIGINAL'}
                    </div>

                    {/* Size Annotations */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] text-white font-black px-2 py-0.5 rounded shadow-lg">
                      {imageState.resized ? imageState.resized.width : imageState.original.width}px
                    </div>
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-blue-600 text-[10px] text-white font-black px-1.5 py-2 rounded shadow-lg" style={{ writingMode: 'vertical-rl' }}>
                      {imageState.resized ? imageState.resized.height : imageState.original.height}px
                    </div>
                  </div>

                  {isResizing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm font-bold text-slate-700">Resizing...</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Comparison Bar */}
          <div className="h-12 mt-6 flex items-center justify-between px-2 shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">
                  Original: {imageState.original ? formatBytes(imageState.original.size) : '0 KB'}
                </span>
              </div>
              {imageState.resized && (
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-800">
                    New: {formatBytes(imageState.resized.size)} 
                    <span className="text-blue-600 ml-1.5">
                      ({Math.round((1 - imageState.resized.size / imageState.original!.size) * 100)}% smaller)
                    </span>
                  </span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 italic font-bold uppercase tracking-widest">
              Optimized via Canvas Lanczos-3 Rendering
            </div>
          </div>
        </section>
      </main>
      
      <input 
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={handleFileUpload}
        ref={fileInputRef}
      />
    </div>
  );
}

