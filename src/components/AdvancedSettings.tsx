'use client';

import { motion } from 'motion/react';
import { Volume2, Volume1, VolumeX, SlidersHorizontal, Monitor } from 'lucide-react';
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
          <motion.button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ imageFormat: 'webp' })}
            whileTap={disabled ? {} : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors select-none font-['Outfit'] ${
              selectedFormat === 'webp'
                ? 'border-[#5865f2] bg-[#5865f2] text-white'
                : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
            }`}
          >
            {isAutoActive ? 'WebP (Auto)' : 'WebP'}
          </motion.button>

          {/* JPEG */}
          <motion.button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ imageFormat: 'jpeg' })}
            whileTap={disabled ? {} : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors select-none font-['Outfit'] ${
              selectedFormat === 'jpeg'
                ? 'border-[#5865f2] bg-[#5865f2] text-white'
                : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
            }`}
          >
            JPEG
          </motion.button>

          {/* PNG */}
          <motion.button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ imageFormat: 'png' })}
            whileTap={disabled ? {} : { scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors select-none font-['Outfit'] ${
              selectedFormat === 'png'
                ? 'border-[#5865f2] bg-[#5865f2] text-white'
                : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
            }`}
          >
            PNG
          </motion.button>
        </div>
      </div>
    );
  }

  const isVideo = mediaType === 'video';

  return (
    <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-[#5865f2]" />
        <span className="text-xs sm:text-sm uppercase tracking-wider text-[#f2f3f5] font-bold font-['Outfit']">
          {isVideo ? 'Audio & Resolution' : 'Resolution'}
        </span>
      </div>

      {/* Audio Profile - ONLY for video */}
      {isVideo && (
        <div>
          <span className="text-xs text-[#949ba4] font-bold flex items-center gap-1.5 mb-2 font-['Outfit']">
            <Volume2 className="w-3.5 h-3.5 text-[#5865f2]" />
            Audio
          </span>
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ audioMode: 'standard' })}
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-colors select-none font-['Outfit'] ${
                config.audioMode === 'standard'
                  ? 'border-[#5865f2] bg-[#5865f2] text-white'
                  : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
              }`}
            >
              <Volume2 className="w-4 h-4 mb-1" />
              <span>Standard</span>
              <span className="text-[10px] opacity-75 font-normal">128 kbps</span>
            </motion.button>

            <motion.button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ audioMode: 'voice' })}
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-colors select-none font-['Outfit'] ${
                config.audioMode === 'voice'
                  ? 'border-[#5865f2] bg-[#5865f2] text-white'
                  : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
              }`}
            >
              <Volume1 className="w-4 h-4 mb-1" />
              <span>Voice Only</span>
              <span className="text-[10px] opacity-75 font-normal">64 kbps</span>
            </motion.button>

            <motion.button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ audioMode: 'mute' })}
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-colors select-none font-['Outfit'] ${
                config.audioMode === 'mute'
                  ? 'border-[#5865f2] bg-[#5865f2] text-white'
                  : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
              }`}
            >
              <VolumeX className="w-4 h-4 mb-1" />
              <span>Mute</span>
              <span className="text-[10px] opacity-75 font-normal">0 kbps</span>
            </motion.button>
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
              <motion.button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ scaleMode: mode })}
                whileTap={disabled ? {} : { scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`py-2 px-2 text-center rounded-xl border text-xs uppercase font-bold transition-colors select-none font-['Outfit'] ${
                  isSelected
                    ? 'border-[#5865f2] bg-[#5865f2] text-white'
                    : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058]'
                }`}
              >
                {mode}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
