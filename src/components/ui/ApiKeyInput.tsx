'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { GlassPanel, Button, Input, Icon } from '@/components/ui';

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setApiKey(stored);
      setSaved(true);
    }
  }, []);
  
  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSaved(true);
      setTestResult(null);
    } else {
      localStorage.removeItem('gemini_api_key');
      setSaved(false);
    }
  };
  
  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "OK"' }] }],
        }),
      });
      
      if (res.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };
  
  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setSaved(false);
    setTestResult(null);
  };
  
  return (
    <GlassPanel variant="strong" padding="lg" radius="xl" className="w-full max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="key" size={20} className="text-accent-primary" />
        <h3 className="font-medium text-text-primary">Gemini API Key</h3>
      </div>
      
      <p className="text-sm text-text-muted mb-4">
        Get your free key at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google AI Studio</a>
      </p>
      
      <div className="relative mb-3">
        <Input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIzaSy..."
          leftIcon={<Key className="w-5 h-5" />}
          rightIcon={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-text-muted hover:text-text-primary"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          }
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={saved ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleSave}
          disabled={!apiKey.trim() && !saved}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Saved
            </>
          ) : (
            <>
              <Icon name="key" size={16} />
              Save Key
            </>
          )}
        </Button>
        
        {saved && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-text-muted hover:text-red-400">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {saved && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-bg-border"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTest}
              disabled={testing}
              loading={testing}
            >
              Test Key
            </Button>
            
            {testResult === 'success' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-green-400 text-sm"
              >
                <Check className="w-4 h-4" />
                Valid
              </motion.span>
            )}
            
            {testResult === 'error' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 text-red-400 text-sm"
              >
                <X className="w-4 h-4" />
                Invalid
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </GlassPanel>
  );
}