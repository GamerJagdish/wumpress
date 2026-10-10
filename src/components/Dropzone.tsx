'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, FileVideo, FileImage, Sparkles } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function Dropzone({ onFileSelect, isProcessing }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const triggerPicker = () => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,.gif,.mkv,.avi"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />

      <motion.div
        layout
        onClick={triggerPicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={isProcessing ? {} : { scale: 1.01 }}
        whileTap={isProcessing ? {} : { scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className={`relative w-full rounded-2xl border-2 cursor-pointer transition-colors p-6 sm:p-10 text-center select-none overflow-hidden ${
          isDragOver
            ? 'border-[#e2fd52] bg-[#141812]/90 shadow-[0_0_30px_rgba(226,253,82,0.15)]'
            : 'border-[#222734] bg-[#0c0e13] hover:border-[#384156] hover:bg-[#10131a]'
        }`}
      >
        {/* Subtle geometric dot grid background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={
              isDragOver
                ? { y: [-2, -8, -2], scale: 1.1 }
                : { y: 0, scale: 1 }
            }
            transition={{ repeat: isDragOver ? Infinity : 0, duration: 0.8 }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
              isDragOver
                ? 'bg-[#e2fd52] text-black shadow-[0_6px_0_#9bb814]'
                : 'bg-[#151922] text-[#e2fd52] border border-[#262c3b] shadow-[0_4px_0_#1a1f2c]'
            }`}
          >
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
          </motion.div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
            DROP MEDIA HERE
          </h2>
          <p className="text-sm sm:text-base text-[#8a95a8] max-w-md mx-auto mb-6">
            Drag video or image file, or tap to choose from your device.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e2fd52] text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_4px_0_#9bb814] active:shadow-none active:translate-y-1 transition-all">
            <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
            SELECT FILE
          </div>

          <div className="mt-8 pt-6 border-t border-[#1a1f2b] w-full max-w-lg flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-[#6c788d]">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#13161f] border border-[#1e2330]">
              <FileVideo className="w-3 h-3 text-[#38bdf8]" />
              MP4 / MOV / WEBM / MKV
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#13161f] border border-[#1e2330]">
              <FileImage className="w-3 h-3 text-[#f472b6]" />
              PNG / JPG / WEBP / GIF
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
