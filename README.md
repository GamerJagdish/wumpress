# WAMPRESS

In-browser media compression engine designed to shrink videos, images, and animated GIFs to fit under Discord file limits (10 MB, 20 MB, 25 MB, 50 MB, or custom thresholds).

All processing is executed entirely within the client's web browser using WebAssembly (FFmpeg.wasm) and HTML5 Canvas. Zero bytes are uploaded to external servers.

---

## Features

- **Discord-Compliant Outputs**: Produces MP4 video using H.264 video codec, AAC audio, and the `faststart` flag (`-movflags +faststart`). Discord web, desktop, and mobile clients can stream the file inline without requiring users to download the complete file first.
- **Target Bitrate Mathematics**: Dynamically inspects media duration and computes the maximum allowable video and audio bitrate budget with a 5% safety buffer to account for container muxing overhead.
- **Client-Side Privacy**: Runs 100% locally on the device using WebAssembly. No server infrastructure, no data collection, no storage costs.
- **Adaptive Image Processing**: Employs iterative binary-search quantization and canvas downscaling for images and WebP outputs.
- **Animated GIF to MP4 Conversion**: Converts heavy GIFs into lightweight, looping MP4 videos that achieve up to 90% size reductions while rendering seamlessly in Discord chat.
- **Expressive Tactile Interface**: Built with high-contrast neo-utilitarian styling, spring physics, and mobile-first touch optimization.

---

## Target Bitrate Formula

To ensure videos strictly land beneath the specified target size, the engine applies the following formula:

```text
Target Kilobits = (Target Size in MB * 1024 * 1024 * 8 * 0.94) / 1000
Total Bitrate (kbps) = Target Kilobits / Duration (seconds)
Video Bitrate (kbps) = Total Bitrate - Audio Bitrate (128, 64, or 0 kbps)
```

The `0.94` factor reserves a 6% buffer for MP4 container metadata (moov and mdat boxes) and index headers, preventing overshoot.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Video Engine**: `@ffmpeg/ffmpeg` (WebAssembly)
- **Animation**: `motion` (Spring physics)
- **Icons**: `lucide-react`
- **Typography**: Space Grotesk and JetBrains Mono

---

## Getting Started

### Prerequisites

Node.js 18 or newer and npm.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/wampress.git
cd wampress
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

---

## Production Build

To compile an optimized static production build:

```bash
npm run build
npm run start
```

---

## Browser Requirements

- Chromium-based browsers (Chrome, Edge, Brave), Firefox, or Safari with WebAssembly support.
- Hardware acceleration enabled for maximum encoding speed.

---

## License

MIT License.
