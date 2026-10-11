import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://wumpress.gamerjagdish.com'),
  title: 'Wumpress',
  description: 'Wumpress videos and images under Discord file limits.',
  icons: {
    icon: '/logo.webp',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Wumpress',
    description: 'Wumpress videos and images under Discord file limits.',
    url: 'https://wumpress.gamerjagdish.com',
    siteName: 'Wumpress',
    images: [
      {
        url: '/logo.png',
        width: 1254,
        height: 1254,
        alt: 'Wumpress Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Wumpress',
    description: 'Wumpress videos and images under Discord file limits.',
    images: ['/logo.png'],
  },
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
