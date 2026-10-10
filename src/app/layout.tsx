import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wumpress',
  description: 'Compress videos and images under Discord file limits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#1e1f22] text-[#f2f3f5] antialiased selection:bg-[#5865f2] selection:text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
