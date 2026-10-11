'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import Header from '../components/Header';
import Icon from '../components/Icon';
import ClickSpark from '../components/ClickSpark';

export default function NotFound() {
  return (
    <ClickSpark sparkColor="#ffffff">
      <div className="min-h-screen flex flex-col bg-[#1e1f22] text-[#f2f3f5]">
        <Header />

        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-6 sm:p-8 text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#313338] border border-[#3f4147] mx-auto flex items-center justify-center text-[#5865f2]">
              <Icon name="error" size={32} />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5865f2] font-['Outfit']">
                404 Not Found
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                Lost in the void
              </h2>
              <p className="text-xs sm:text-sm text-[#949ba4] leading-relaxed">
                This page could not be found or has wandered away from the server.
              </p>
            </div>

            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Link
                href="/"
                className="w-full py-3.5 px-6 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors select-none font-['Outfit'] cursor-pointer"
              >
                <Icon name="home" size={20} className="translate-y-[0.5px]" />
                <span>Return to Home</span>
              </Link>
            </motion.div>
          </motion.div>
        </main>

        <footer className="w-full py-6 text-center text-xs text-[#949ba4]">
          <a
            href="https://github.com/gamerjagdish/wumpress"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#949ba4] hover:text-white underline underline-offset-2 transition-colors duration-150"
          >
            Wumpress v1.0
          </a>
        </footer>
      </div>
    </ClickSpark>
  );
}
