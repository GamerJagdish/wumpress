'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#1e1f22] text-[#f2f3f5] flex flex-col justify-center items-center p-4 selection:bg-[#5865f2] selection:text-white font-sans antialiased">
        <div className="w-full max-w-md bg-[#2b2d31] border border-[#383a40] rounded-2xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#392125] border border-[#5c2d33] mx-auto flex items-center justify-center text-[#f23f43] font-bold text-2xl">
            !
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f23f43]">
              Application Error
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Something went wrong
            </h2>
            <p className="text-xs sm:text-sm text-[#949ba4] leading-relaxed">
              {error.message || 'An unexpected application error occurred.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#313338] hover:bg-[#383a40] active:bg-[#2b2d31] border border-[#383a40] text-[#f2f3f5] font-bold text-sm transition-colors cursor-pointer inline-flex items-center justify-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
