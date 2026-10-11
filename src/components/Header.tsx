import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full pt-8 pb-4 text-center select-none">
      <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3.5 select-text">
        <Image
          src="/logo.webp"
          alt="Wumpress Logo"
          width={192}
          height={192}
          quality={90}
          priority
          className="w-9 h-9 sm:w-12 sm:h-12 object-contain rounded-xl select-none pointer-events-none"
        />
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-['Outfit'] select-text">
          Wumpress
        </h1>
      </div>
    </header>
  );
}

