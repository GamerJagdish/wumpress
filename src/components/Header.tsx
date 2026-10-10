'use client';

import { motion } from 'motion/react';
import { ShieldCheck, Cpu } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-[#1c2028] bg-[#090b0e]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-md bg-[#e2fd52] flex items-center justify-center font-black text-black text-xl shadow-[0_0_16px_rgba(226,253,82,0.35)] select-none">
            W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-mono">
                WAMPRESS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#171a22] text-[#8e98aa] border border-[#232733]">
                V1.0
              </span>
            </div>
            <p className="text-[11px] text-[#788293] font-mono leading-none hidden sm:block">
              DISCORD MEDIA COMPRESSOR
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="flex items-center gap-2 text-xs font-mono"
        >
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12151c] border border-[#1f2430] text-[#a0abbd]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#e2fd52]" />
            <span className="text-[11px] font-medium">100% PRIVATE</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12151c] border border-[#1f2430] text-[#a0abbd]">
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="text-[11px] font-medium">CLIENT WASM</span>
          </div>
        </motion.div>
      </div>
    </header>
  );
}
