import React from 'react';
import { Download, Calendar, Monitor, Folder, ArrowDownToLine, MousePointer2 } from 'lucide-react';
import HeroParallaxTilt from './components/HeroParallaxTilt';

export default function DownloadsPage() {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#fafafa] text-slate-900 font-sans relative">
      {/* Subtle dotted background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-70" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Lumina Terminal</h1>
          {/* <span className="text-sm font-medium text-slate-500">Web Access</span> */}
        </div>
        {/* <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Download
        </button> */}
      </header>

      {/* Main scrollable content */}
      <main className="relative z-10 flex-1 overflow-y-auto min-h-0 px-8 pt-2 pb-32">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* Hero Section */}
          <HeroParallaxTilt />

          {/* Platforms Grid Card */}
          <section>
            <div className="rounded-xl border border-slate-200 bg-white/40 shadow-sm backdrop-blur-sm relative overflow-x-auto">
              {/* Grid Container */}
              <div className="grid grid-cols-[180px_minmax(240px,1fr)_minmax(240px,1fr)_minmax(240px,1fr)] text-sm min-w-[900px]">

                {/* --- Row 1: Headers --- */}
                <div className="p-6 font-semibold text-slate-900 border-b border-r border-slate-200 flex items-center">
                  Status
                </div>
                <div className="p-6 border-b border-r border-slate-200 flex flex-col justify-center">
                  <span className="font-semibold text-slate-900">macOS (Apple Silicon)</span>
                  <span className="text-slate-500 mt-1 text-xs">M1 or later • .dmg</span>
                </div>
                <div className="p-6 border-b border-r border-slate-200 flex flex-col justify-center">
                  <span className="font-semibold text-slate-900">Windows (64-bit)</span>
                  <span className="text-slate-500 mt-1 text-xs">x64 • Windows 10/11</span>
                </div>
                <div className="p-6 border-b border-slate-200 flex flex-col justify-center">
                  <span className="font-semibold text-slate-900">Windows (ARM64)</span>
                  <span className="text-slate-500 mt-1 text-xs">Snapdragon X Series • Windows 11 ARM</span>
                </div>

                {/* --- Row 2: v2.0 Upcoming --- */}
                <div className="p-6 border-b border-r border-slate-200 flex items-center gap-3 bg-white/60">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                    v2.0
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Upcoming
                  </span>
                </div>
                <div className="p-6 border-b border-r border-slate-200 bg-slate-50/80 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200/50 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> coming soon
                  </span>
                </div>
                <div className="p-6 border-b border-r border-slate-200 bg-slate-50/80 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200/50 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> coming soon
                  </span>
                </div>
                <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200/50 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> coming soon
                  </span>
                </div>

                {/* --- Row 3: v1.0 Released --- */}
                <div className="p-6 border-r border-slate-200 flex items-center gap-3 bg-white/60 rounded-bl-xl">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white">
                    v1.0
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                    Released
                  </span>
                </div>

                {/* Download cell 1 */}
                <a href="https://kosha-releases.s3.ap-south-2.amazonaws.com/DairyFlow-Setup-0.1.0-arm64.dmg" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center text-center p-6 border-r border-slate-200 bg-white/60 hover:bg-slate-50/50 transition-colors cursor-pointer w-full h-full focus:outline-none appearance-none">
                  <span className="whitespace-nowrap px-5 py-2 rounded-full underline decoration-slate-400 decoration-dotted underline-offset-[6px] group-hover:bg-black group-hover:text-white group-hover:no-underline transition-all duration-200 text-slate-900 font-medium">
                    Download .dmg (630.0 MB)
                  </span>
                </a>

                {/* Download cell 2 */}
                <button className="group flex items-center justify-center text-center p-6 border-r border-slate-200 bg-white/60 hover:bg-slate-50/50 transition-colors cursor-pointer w-full h-full focus:outline-none appearance-none">
                  <span className="whitespace-nowrap px-5 py-2 rounded-full underline decoration-slate-400 decoration-dotted underline-offset-[6px] group-hover:bg-black group-hover:text-white group-hover:no-underline transition-all duration-200 text-slate-900 font-medium">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200/50 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> coming soon
                    </span>
                  </span>
                </button>

                {/* Download cell 3 */}
                <button className="group flex items-center justify-center text-center p-6 bg-white/60 hover:bg-slate-50/50 transition-colors cursor-pointer w-full h-full focus:outline-none appearance-none rounded-br-xl">
                  <span className="whitespace-nowrap px-5 py-2 rounded-full underline decoration-slate-400 decoration-dotted underline-offset-[6px] group-hover:bg-black group-hover:text-white group-hover:no-underline transition-all duration-200 text-slate-900 font-medium">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-200/50 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> coming soon
                    </span>
                  </span>
                </button>

              </div>
            </div>
          </section>

          {/* Release Tracker Section */}
          <section className="space-y-6 pt-4">
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">Release Tracker</h3>

            <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm backdrop-blur-sm divide-y divide-slate-200">

              {/* Row 1 */}
              <div className="p-6 flex items-center justify-between text-sm hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                    v2.0
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Upcoming
                  </span>
                </div>
                <div className="flex items-center gap-8 text-slate-600">
                  <span className="flex items-center gap-2"><Monitor className="w-4 h-4 text-slate-400" /> macOS, Windows</span>
                  <span className="flex items-center gap-2 w-24"><Folder className="w-4 h-4 text-slate-400" /> TBD</span>
                  <span className="flex items-center gap-2 w-32"><Calendar className="w-4 h-4 text-slate-400" /> Q4 2024</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="p-6 flex items-center justify-between text-sm hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white">
                    v1.0
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                    Released
                  </span>
                </div>
                <div className="flex items-center gap-8 text-slate-800 font-medium">
                  <span className="flex items-center gap-2"><Monitor className="w-4 h-4 text-slate-500" /> macOS, Windows</span>
                  <span className="flex items-center gap-2 w-24"><Folder className="w-4 h-4 text-slate-500" /> .dmg, .exe</span>
                  <span className="flex items-center gap-2 w-32"><Calendar className="w-4 h-4 text-slate-500" /> June, 2026</span>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 w-full z-50 px-8 py-5 flex items-center justify-between border-t border-slate-200/60 bg-[#fafafa]/90 backdrop-blur-md">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Lumina Terminal</h4>
          <p className="text-xs text-slate-500">© 2026 Lumina Terminal. Engineered for precision.</p>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
          {/* <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a> */}
          <a href="https://github.com/bharath9812/dairyflow" className="hover:text-slate-900 transition-colors">Github</a>
          {/* <a href="#" className="hover:text-slate-900 transition-colors">Changelog</a> */}
          {/* <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a> */}
        </div>
      </footer>
    </div>
  );
}
