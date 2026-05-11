import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const legalLinks = [
  { label: 'PRIVACY', href: '#privacy' },
  { label: 'TERMS', href: '#terms' },
  { label: 'POPIA', href: '#popia' },
  { label: 'COOKIES', href: '#cookies' },
];

const Welcome = () => {
  const navigate = useNavigate();
  const [fading, setFading] = useState(false);
  const [tick, setTick] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      setTick(`${hh}:${mm}:${ss} UTC`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleEnter = () => {
    setFading(true);
    setTimeout(() => navigate('/dashboard'), 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col bg-black transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background image — desaturated */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/table-mountain-hero.jpg')",
          filter: 'grayscale(0.85) contrast(1.1) brightness(0.45)',
        }}
      />
      {/* True-black overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #7C3AED 0, #7C3AED 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* TOP STATUS STRIP */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2 label-micro" style={{ color: '#7C3AED' }}>
          <span className="inline-block w-1.5 h-1.5 bg-[#7C3AED] animate-pulse" />
          SYS_ONLINE
        </div>
        <div className="label-micro mono" style={{ color: '#666' }}>
          {tick}
        </div>
        <div className="label-micro" style={{ color: '#666' }}>
          v2.0
        </div>
      </header>

      {/* Centered content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Brand mark */}
        <div className="label-micro mb-4" style={{ color: '#7C3AED' }}>
          [ URBAN INTELLIGENCE TERMINAL ]
        </div>

        <h1
          className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-white leading-[0.9]"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          ALMIEN
        </h1>

        {/* Acid green underline */}
        <div className="mt-3 h-[2px] w-24 bg-[#7C3AED]" />

        <p
          className="mt-6 text-sm sm:text-base font-medium tracking-[0.3em] uppercase text-white/70"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Your Safety. Always Near.
        </p>

        {/* Spec block */}
        <div className="mt-10 grid grid-cols-3 gap-3 max-w-md w-full">
          {[
            { l: 'COVERAGE', v: 'WC' },
            { l: 'WARDS', v: '116' },
            { l: 'STATUS', v: 'LIVE' },
          ].map((s) => (
            <div
              key={s.l}
              className="border border-[#1A1A1A] bg-black/60 backdrop-blur-sm px-3 py-2.5"
            >
              <div className="label-micro" style={{ color: '#666' }}>
                {s.l}
              </div>
              <div
                className="text-base font-bold mt-0.5"
                style={{ color: '#7C3AED', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleEnter} className="btn-primary mt-10 w-full max-w-xs">
          ENTER TERMINAL →
        </button>

        <button
          onClick={() => navigate('/auth')}
          className="btn-ghost mt-3"
          style={{ color: '#666' }}
        >
          STAFF ACCESS
        </button>
      </main>

      {/* Legal footer */}
      <footer className="relative z-10 border-t border-[#1A1A1A] bg-black/80 backdrop-blur-sm px-4 py-3">
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {legalLinks.map((link, i) => (
            <span key={link.label} className="flex items-center gap-3">
              {i > 0 && <span style={{ color: '#333' }}>·</span>}
              <a
                href={link.href}
                className="label-micro hover:text-[#7C3AED] transition-colors"
                style={{ color: '#666' }}
              >
                {link.label}
              </a>
            </span>
          ))}
        </nav>
        <p
          className="mt-2 text-center label-micro"
          style={{ color: '#444' }}
        >
          © 2026 ALMIEN · CAPE TOWN · POPIA COMPLIANT
        </p>
      </footer>
    </div>
  );
};

export default Welcome;
