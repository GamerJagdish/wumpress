'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Volume1, VolumeX, ChevronDown, SlidersHorizontal, Monitor } from 'lucide-react';
import { CompressionConfig, MediaType } from '../lib/types';

interface AdvancedSettingsProps {
  config: CompressionConfig;
  onChange: (updated: Partial<CompressionConfig>) => void;
  mediaType: MediaType;
  disabled?: boolean;
}

export default function AdvancedSettings({
  config,
  onChange,
  mediaType,
  disabled = false,
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (mediaType === 'image') {
    const selectedFormat = config.imageFormat === 'auto' ? 'webp' : config.imageFormat;
    const isAutoActive = config.imageFormat === 'auto' || config.imageFormat === 'webp';

    return (
      <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5">
        <label className="text-xs uppercase tracking-wider text-[#949ba4] font-bold font-['Outfit'] block mb-2.5">
          Image Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {/* WebP */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ imageFormat: 'webp' })}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
              selectedFormat === 'webp'
                ? 'border-[#5865f2] bg-[#5865f2] text-white'
                : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
            }`}
          >
            {isAutoActive ? 'WebP (Auto)' : 'WebP'}
          </button>

          {/* JPEG */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ imageFormat: 'jpeg' })}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
              selectedFormat === 'jpeg'
                ? 'border-[#5865f2] bg-[#5865f2] text-white'
                : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
            }`}
          >
            JPEG
          </button>

          {/* PNG */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ imageFormat: 'png' })}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors ${
              selectedFormat === 'png'
                ? 'border-[#5865f2] bg-[#5865f2] text-white'
                : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
            }`}
          >
            PNG
          </button>
        </div>
      </div>
    );
  }

  const isVideo = mediaType === 'video';

  return (
    <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#313338] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-[#5865f2]" />
          <span className="text-xs sm:text-sm uppercase tracking-wider text-[#f2f3f5] font-bold font-['Outfit']">
            {isVideo ? 'Audio & Resolution' : 'Resolution'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-[#949ba4]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden bg-[#2b2d31]"
          >
            <div className="border-t border-[#383a40] p-4 sm:p-5 space-y-4">
              {/* Audio Profile - ONLY for video */}
              {isVideo && (
                <div>
                  <span className="text-xs text-[#949ba4] font-bold flex items-center gap-1.5 mb-2 font-['Outfit']">
                    <Volume2 className="w-3.5 h-3.5 text-[#5865f2]" />
                    Audio
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange({ audioMode: 'standard' })}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        config.audioMode === 'standard'
                          ? 'border-[#5865f2] bg-[#5865f2] text-white'
                          : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
                      }`}
                    >
                      <Volume2 className="w-4 h-4 mb-1" />
                      <span>Standard</span>
                      <span className="text-[10px] opacity-75 font-normal">128 kbps</span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange({ audioMode: 'voice' })}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        config.audioMode === 'voice'
                          ? 'border-[#5865f2] bg-[#5865f2] text-white'
                          : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
                      }`}
                    >
                      <Volume1 className="w-4 h-4 mb-1" />
                      <span>Voice Only</span>
                      <span className="text-[10px] opacity-75 font-normal">64 kbps</span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange({ audioMode: 'mute' })}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        config.audioMode === 'mute'
                          ? 'border-[#5865f2] bg-[#5865f2] text-white'
                          : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
                      }`}
                    >
                      <VolumeX className="w-4 h-4 mb-1" />
                      <span>Mute</span>
                      <span className="text-[10px] opacity-75 font-normal">0 kbps</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resolution Scaling */}
              <div>
                <span className="text-xs text-[#949ba4] font-bold flex items-center gap-1.5 mb-2 font-['Outfit']">
                  <Monitor className="w-3.5 h-3.5 text-[#5865f2]" />
                  Resolution
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(['auto', 'native', '720p', '480p'] as const).map((mode) => {
                    const isSelected = config.scaleMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange({ scaleMode: mode })}
                        className={`py-2 px-2 text-center rounded-xl border text-xs uppercase font-bold transition-colors ${
                          isSelected
                            ? 'border-[#5865f2] bg-[#5865f2] text-white'
                            : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
