'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing: boolean;
}

export default function Dropzone({ onFilesSelect, isProcessing }: DropzoneProps) {
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
      const files = Array.from(e.dataTransfer.files);
      onFilesSelect(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelect(files);
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
        multiple
      />

      <motion.div
        onClick={triggerPicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileTap={isProcessing ? {} : { scale: 0.99 }}
        transition={{ duration: 0.1 }}
        className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-150 p-8 sm:p-14 text-center select-none ${
          isDragOver
            ? 'border-[#5865f2] bg-[#313338]'
            : 'border-[#3f4147] bg-[#2b2d31] hover:border-[#5865f2] hover:bg-[#313338]'
        }`}
      >
        <div className="flex flex-col items-center">
          <motion.div
            animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-150 ${
              isDragOver
                ? 'bg-[#5865f2] text-white'
                : 'bg-[#313338] text-[#5865f2] border border-[#3f4147]'
            }`}
          >
            <UploadCloud className="w-9 h-9 sm:w-11 sm:h-11 stroke-[2.2]" />
          </motion.div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-['Outfit']">
            Drop your files here
          </h2>
          <p className="text-sm sm:text-base text-[#949ba4] max-w-sm mx-auto mb-6">
            Videos or images of any format to fit Discord.
          </p>

          <div className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white font-bold text-sm sm:text-base tracking-wide transition-colors duration-150 font-['Outfit']">
            Choose Files
          </div>
        </div>
      </motion.div>
    </div>
  );
}
