'use client';

import React, { useState, useRef, useCallback, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Image, Globe, Sparkles, Loader2, Check, Key, ChevronDown } from 'lucide-react';
import { Button, GlassPanel, Input } from '@/components/ui';
import { useApp } from '@/lib/store/AppContext';
import { CapturedInput, InputType } from '@/lib/scene/types';
import { createDemoPanoramaDataUrl } from '@/lib/scene/demoScene';
import { ApiKeyInput } from '@/components/ui/ApiKeyInput';

export function CaptureArea() {
  const { setCapturedInput, setStage, setDemo, setError } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputType, setInputType] = useState<InputType>('photo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };
  
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const blob = await fetch(dataUrl).then(r => r.blob());
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      handleFileSelect(file);
      setInputType('photo');
    } catch (err) {
      setError('Camera access denied or not available');
    }
  };
  
  const handleDemoLoad = () => {
    setIsProcessing(true);
    setDemo(true);
    
    setTimeout(() => {
      const demoUrl = createDemoPanoramaDataUrl();
      const demoInput: CapturedInput = {
        type: 'panorama',
        data: demoUrl,
        width: 1024,
        height: 512,
        metadata: { isEquirectangular: true },
      };
      setCapturedInput(demoInput);
      setStage('analyzing');
      setIsProcessing(false);
    }, 500);
  };
  
  const handleProceed = () => {
    if (!selectedFile || !previewUrl) return;
    
    const capturedInput: CapturedInput = {
      type: inputType,
      data: previewUrl,
      metadata: { 
        isEquirectangular: inputType === 'panorama' 
      },
    };
    
    setCapturedInput(capturedInput);
    setStage('analyzing');
  };
  
  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    fileInputRef.current!.value = '';
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-12">
        <motion.h1 
          className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight gradient-text mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          SceneWeave
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Turn spaces into experiences.
        </motion.p>
        <motion.p 
          className="mt-4 text-sm text-text-muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Capture a panorama or photo of your space, and let AI transform it into an adaptive workspace.
        </motion.p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <ApiKeyInput />
      </motion.div>
      
      <GlassPanel 
        variant="strong" 
        padding="xl" 
        radius="xl" 
        className="relative overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/5 pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-center gap-4 mb-8">
            {['panorama', 'photo'].map((type) => (
              <motion.button
                key={type}
                onClick={() => setInputType(type as InputType)}
                className={`
                  px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${inputType === type 
                    ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30' 
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                  }
               `}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  {type === 'panorama' ? <Globe className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </motion.button>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            {previewUrl && selectedFile ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mb-6"
              >
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-bg-secondary">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  {inputType === 'panorama' && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-xs text-white">
                      <Globe className="w-3 h-3" />
                      Equirectangular
                    </div>
                  )}
                </div>
                <motion.button
                  onClick={removeFile}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <div
                  className={`
                    relative border-2 border-dashed rounded-2xl p-12 md:p-16 text-center transition-all duration-300
                    ${dragActive 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-bg-border hover:border-accent-primary/50 hover:bg-bg-tertiary/50'
                    }
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Upload image"
                  />
                  
                  <motion.div
                    className="flex flex-col items-center gap-4"
                    animate={dragActive ? { scale: 1.02 } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="p-4 rounded-2xl bg-bg-tertiary border border-bg-border"
                      animate={dragActive ? { rotate: 180 } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <Upload className="w-12 h-12 text-text-secondary" />
                    </motion.div>
                    
                    <div>
                      <p className="text-lg font-medium text-text-primary">
                        {dragActive ? 'Drop your image here' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        JPG, PNG up to 10MB • Panorama or regular photo
                      </p>
                    </div>
                  </motion.div>
                </div>
                
                <div className="flex items-center justify-center gap-4 mt-6">
                  <span className="text-text-muted">or</span>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    leftIcon={<Camera className="w-5 h-5" />}
                    onClick={handleCameraCapture}
                    disabled={isProcessing}
                  >
                    Use Camera
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-bg-border">
            <Button
              variant="primary"
              size="xl"
              fullWidth={true}
              className="sm:w-auto sm:flex-1"
              leftIcon={<Sparkles className="w-5 h-5" />}
              onClick={handleDemoLoad}
              disabled={isProcessing}
              loading={isProcessing}
            >
              Try Demo Space
            </Button>
            
            <AnimatePresence mode="wait">
              {previewUrl && selectedFile && (
                <motion.button
                  key="proceed"
                  onClick={handleProceed}
                  className={`
                    w-full sm:w-auto sm:flex-1 px-8 py-4 rounded-xl font-medium text-lg
                    bg-bg-tertiary text-text-primary border border-bg-border
                    hover:bg-accent-primary/10 hover:border-accent-primary/50 hover:text-accent-primary
                    transition-all duration-200 active:scale-[0.98]
                  `}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    Analyze Space
                    <Check className="w-5 h-5" />
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}