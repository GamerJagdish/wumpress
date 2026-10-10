# Wumpress

Client-side media compression designed to shrink videos, images, and GIFs to fit under Discord upload limits.

All processing runs 100% locally in your browser using WebAssembly and HTML5 Canvas. Zero bytes are uploaded to any external server.

## Features

- **Local WebAssembly Processing**: Powered by `@ffmpeg/ffmpeg` compiled to WebAssembly. Your files never leave your device.
- **Dynamic Bitrate Budgeting**: Computes exact video and audio bitrate thresholds based on duration and container muxing overhead to guarantee the target file size.
- **Faststart Streaming**: Sets `-movflags +faststart` on videos so Discord plays media inline without requiring full downloads.
- **GIF Optimization**: Re-encodes animated GIFs with palette generation and Bayer dithering to preserve the original format while drastically reducing file size.
- **Canvas Image Engine**: Employs iterative quality search and downscaling to deliver lightweight WebP, JPEG, or PNG outputs.
- **Minimal Comfy UI**: Responsive dark interface styled with Discord-inspired tokens and Outfit typography.

## Target Presets

- **10 MB**: Standard free-tier Discord upload limit.
- **20 MB**: Enhanced upload limit for regular users.
- **25 MB**: Extended preset for mid-sized media.
- **50 MB**: Nitro tier threshold.
- **Custom**: Any budget from 2 MB up to 500 MB via the interactive slider or direct input.

## Tech Stack

- Next.js 16 (App Router, Webpack mode)
- Tailwind CSS v4 & PostCSS
- `@ffmpeg/ffmpeg` 0.12 (WebAssembly)
- Motion
- Lucide React
- Fonts: Outfit, Google Sans Flex, Google Sans Code

## Getting Started

### Prerequisites

Node.js 18 or newer and npm.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/wumpress.git
cd wumpress
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

To compile a static production build:
```bash
npm run build
npm run start
```

## License

MIT
