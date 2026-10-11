'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Header from '../components/Header';
import ClickSpark from '../components/ClickSpark';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <ClickSpark sparkColor="#ffffff">
      <div className="min-h-screen flex flex-col bg-[#1e1f22] text-[#f2f3f5] select-none">
        <Header />

        <main className="flex-1 w-full max-w-md mx-auto px-4 py-8 flex flex-col justify-center items-center select-text">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-6 sm:p-8 text-center space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#392125] border border-[#5c2d33] mx-auto flex items-center justify-center text-[#f23f43]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#f23f43] font-['Outfit']">
                Unexpected Error
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-[#949ba4] leading-relaxed">
                {error.message || 'An unexpected error occurred while loading this page.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <motion.button
                type="button"
                onClick={() => reset()}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors select-none font-['Outfit'] cursor-pointer"
              >
                <RotateCcw className="w-4.5 h-4.5" />
                <span>Try Again</span>
              </motion.button>

              <motion.div
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-full sm:flex-1"
              >
                <Link
                  href="/"
                  className="w-full py-3 px-5 rounded-xl bg-[#313338] hover:bg-[#383a40] active:bg-[#2b2d31] border border-[#3f4147] text-[#f2f3f5] font-bold text-sm flex items-center justify-center gap-2 transition-colors select-none font-['Outfit'] cursor-pointer"
                >
                  <Home className="w-4.5 h-4.5 text-[#949ba4]" />
                  <span>Return Home</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </main>

        <footer className="w-full py-6 text-center text-xs text-[#949ba4] select-none">
          <span className="inline-block select-text">
            <a
              href="https://github.com/gamerjagdish/wumpress"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#949ba4] hover:text-white underline underline-offset-2 transition-colors duration-150"
            >
              Wumpress v1.0
            </a>
          </span>
        </footer>
      </div>
    </ClickSpark>
  );
}
