import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // ── Obsidian Tactical palette ──
        void: '#000000',
        signal: {
          DEFAULT: '#7C3AED',
          green: '#7C3AED',
          dim: '#6D28D9',
          dark: '#2E1065',
        },
        threat: {
          DEFAULT: '#FF3B30',
          red: '#FF3B30',
          amber: '#FF9500',
          dim: '#FF6B30',
        },
        intel: {
          DEFAULT: '#00B4D8',
          cyan: '#00B4D8',
          dim: '#0090AD',
          dark: '#00243A',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#555555',
          inverse: '#000000',
        },
        // (note: shadcn token text-primary/text-muted below override these via HSL)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Semantic safety colors
        safety: {
          green: "hsl(var(--accent-safe))",
          yellow: "hsl(var(--accent-warning))",
          orange: "hsl(var(--safety-orange))",
          red: "hsl(var(--accent-threat))",
        },
        // Obsidian Tactical surface system (true-black hierarchy)
        surface: {
          DEFAULT: '#0A0A0A',
          0: '#000000',
          1: '#0A0A0A',
          2: '#111111',
          3: '#1A1A1A',
          4: '#242424',
          border: '#2A2A2A',
          base: "hsl(var(--surface-base))",
          "01": "hsl(var(--surface-01))",
          "02": "hsl(var(--surface-02))",
          deep: "hsl(var(--surface-deep))",
        },
        elite: {
          DEFAULT: '#FFD60A',
          gold: '#FFD60A',
          dim: '#B89B00',
          from: "hsl(var(--elite-gold-from))",
          to: "hsl(var(--elite-gold-to))",
        },
        // Semantic accent tokens
        "accent-safe": "hsl(var(--accent-safe))",
        "accent-warning": "hsl(var(--accent-warning))",
        "accent-threat": "hsl(var(--accent-threat))",
        "accent-gbv": "hsl(var(--accent-gbv))",
        "accent-info": "hsl(var(--accent-info))",
        // Border tokens
        "border-subtle": "hsl(var(--border-subtle))",
        "border-active": "hsl(var(--border-active))",
        // Text tokens
        "text-primary": "hsl(var(--text-primary))",
        "text-secondary": "hsl(var(--text-secondary))",
        "text-muted": "hsl(var(--text-muted))",
        "text-inverse": "hsl(var(--text-inverse))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'hero': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'hero-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'metric': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'section': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'section-sm': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['0.9375rem', { lineHeight: '1.5', fontWeight: '500' }],
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'small': ['0.8125rem', { lineHeight: '1.4', fontWeight: '400' }],
        'tiny': ['0.75rem', { lineHeight: '1.35', fontWeight: '400' }],
        'cta': ['0.9375rem', { lineHeight: '1', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
