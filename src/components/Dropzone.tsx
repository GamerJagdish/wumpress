'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud } from 'lucide-react';

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
        className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 sm:p-14 text-center select-none ${
          isDragOver
            ? 'border-[#5865f2] bg-[#313338]'
            : 'border-[#3f4147] bg-[#2b2d31] hover:border-[#5865f2]/70 hover:bg-[#313338]/80'
        }`}
      >
        <div className="flex flex-col items-center">
          <motion.div
            animate={
              isDragOver
                ? { y: [-2, -6, -2], scale: 1.08 }
                : { y: 0, scale: 1 }
            }
            transition={{ repeat: isDragOver ? Infinity : 0, duration: 0.8 }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 transition-colors ${
              isDragOver
                ? 'bg-[#5865f2] text-white'
                : 'bg-[#313338] text-[#5865f2] border border-[#3f4147]'
            }`}
          >
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.2]" />
          </motion.div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-['Outfit']">
            Drop your file here
          </h2>
          <p className="text-sm sm:text-base text-[#949ba4] max-w-sm mx-auto mb-6">
            Videos or images of any format to fit Discord.
          </p>

          <div className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm sm:text-base tracking-wide transition-colors">
            Choose File
          </div>
        </div>
      </motion.div>
    </div>
  );
}
