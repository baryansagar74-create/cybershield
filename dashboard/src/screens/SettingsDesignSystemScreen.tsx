import React from 'react';
import { useApp } from '../lib/state';
import { Button } from '../components/Button';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceChip } from '../components/EvidenceChip';
import { SlaTimer } from '../components/SlaTimer';
import { 
  Sun, 
  Moon, 
  Languages, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Palette, 
  Activity,
  CheckCircle2
} from 'lucide-react';

export const SettingsDesignSystemScreen: React.FC = () => {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    density,
    setDensity,
    reducedMotion,
    setReducedMotion,
  } = useApp();

  return (
    <div className="space-y-8 select-none">
      {/* Title */}
      <div className="pb-3 border-b border-line">
        <h1 className="text-xl font-semibold text-txt tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-teal" />
          <span>Workstation Settings & Design System Specification</span>
        </h1>
        <p className="text-xs text-txt-muted mt-0.5">
          Design tokens, typography standards, accessibility controls, and UI primitives
        </p>
      </div>

      {/* SECTION 1: USER WORKSTATION PREFERENCES */}
      <div className="bg-raised border border-line rounded-panel p-6 space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono pb-2 border-b border-line">
          Workstation Environment Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Theme */}
          <div className="p-4 bg-sunken rounded-panel border border-line space-y-2">
            <span className="font-semibold text-txt block">Color Theme</span>
            <p className="text-txt-muted text-[11px]">Dark operations default, light theme alternative.</p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant={theme === 'dark' ? 'primary' : 'secondary'}
                onClick={() => setTheme('dark')}
                icon={<Moon className="w-3.5 h-3.5" />}
              >
                Dark
              </Button>
              <Button
                size="sm"
                variant={theme === 'light' ? 'primary' : 'secondary'}
                onClick={() => setTheme('light')}
                icon={<Sun className="w-3.5 h-3.5" />}
              >
                Light
              </Button>
            </div>
          </div>

          {/* Language */}
          <div className="p-4 bg-sunken rounded-panel border border-line space-y-2">
            <span className="font-semibold text-txt block">Language & Script</span>
            <p className="text-txt-muted text-[11px]">English / Hindi (Noto Sans Devanagari).</p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant={language === 'en' ? 'primary' : 'secondary'}
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Button
                size="sm"
                variant={language === 'hi' ? 'primary' : 'secondary'}
                onClick={() => setLanguage('hi')}
              >
                हिन्दी (Hindi)
              </Button>
            </div>
          </div>

          {/* Density */}
          <div className="p-4 bg-sunken rounded-panel border border-line space-y-2">
            <span className="font-semibold text-txt block">Information Density</span>
            <p className="text-txt-muted text-[11px]">Comfortable baseline or compact dense mode.</p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant={density === 'comfortable' ? 'primary' : 'secondary'}
                onClick={() => setDensity('comfortable')}
              >
                Comfortable
              </Button>
              <Button
                size="sm"
                variant={density === 'compact' ? 'primary' : 'secondary'}
                onClick={() => setDensity('compact')}
              >
                Compact
              </Button>
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="p-4 bg-sunken rounded-panel border border-line space-y-2">
            <span className="font-semibold text-txt block">Motion Standard</span>
            <p className="text-txt-muted text-[11px]">WCAG reduced motion compliance toggle.</p>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant={!reducedMotion ? 'primary' : 'secondary'}
                onClick={() => setReducedMotion(false)}
              >
                Full Motion
              </Button>
              <Button
                size="sm"
                variant={reducedMotion ? 'danger' : 'secondary'}
                onClick={() => setReducedMotion(true)}
              >
                Reduced
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COLOR TOKENS SWATCHES (WCAG AA) */}
      <div className="bg-raised border border-line rounded-panel p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono pb-2 border-b border-line flex items-center gap-2">
          <Palette className="w-4 h-4 text-teal" />
          <span>Color Tokens Matrix (WCAG AA Verified)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="p-3 bg-base border border-line rounded-input">
            <span className="text-[10px] text-txt-muted block">--bg-base</span>
            <span className="font-semibold text-txt">{theme === 'dark' ? '#081A33' : '#F3F6FA'}</span>
          </div>
          <div className="p-3 bg-raised border border-line rounded-input">
            <span className="text-[10px] text-txt-muted block">--bg-raised</span>
            <span className="font-semibold text-txt">{theme === 'dark' ? '#0F2A4D' : '#FFFFFF'}</span>
          </div>
          <div className="p-3 bg-sunken border border-line rounded-input">
            <span className="text-[10px] text-txt-muted block">--bg-sunken</span>
            <span className="font-semibold text-txt">{theme === 'dark' ? '#06142A' : '#E6ECF4'}</span>
          </div>
          <div className="p-3 bg-teal text-white rounded-input">
            <span className="text-[10px] opacity-80 block">--brand-teal</span>
            <span className="font-semibold">{theme === 'dark' ? '#12A89D' : '#0E8C83'}</span>
          </div>
          <div className="p-3 bg-saffron text-white rounded-input">
            <span className="text-[10px] opacity-80 block">--brand-saffron</span>
            <span className="font-semibold">{theme === 'dark' ? '#F28C28' : '#C96A0C'}</span>
          </div>
          <div className="p-3 bg-risk-high text-white rounded-input">
            <span className="text-[10px] opacity-80 block">--risk-high</span>
            <span className="font-semibold">{theme === 'dark' ? '#E5484D' : '#C73338'}</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: PRIMITIVE COMPONENTS SHOWCASE */}
      <div className="bg-raised border border-line rounded-panel p-6 space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-txt font-mono pb-2 border-b border-line flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal" />
          <span>Interactive Primitives & Component Catalog</span>
        </h2>

        {/* Buttons */}
        <div>
          <span className="text-xs font-medium text-txt block mb-2 font-mono uppercase">Buttons & Variants</span>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="danger">Danger / Confirm Fake</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" isLoading>Loading State</Button>
            <Button variant="secondary" disabled>Disabled State</Button>
          </div>
        </div>

        {/* Risk Badges */}
        <div>
          <span className="text-xs font-medium text-txt block mb-2 font-mono uppercase">
            Risk Badges (Color + Shape + Label Standard)
          </span>
          <div className="flex flex-wrap gap-4 items-center">
            <RiskBadge band="HIGH" score={0.88} />
            <RiskBadge band="MEDIUM" score={0.64} />
            <RiskBadge band="LOW" score={0.21} />
          </div>
        </div>

        {/* Evidence Chips & Timers */}
        <div>
          <span className="text-xs font-medium text-txt block mb-2 font-mono uppercase">
            Forensic Chips & SLA Clocks
          </span>
          <div className="flex flex-wrap gap-4 items-center">
            <EvidenceChip hash="a7f3e829b41c09d5e38192a6c08e5f14e912bc48d901a238e9102c48d910283a" label="SHA-256 Digest" />
            <SlaTimer initialMinutes={25} />
            <SlaTimer initialMinutes={115} />
            <SlaTimer initialMinutes={1440} />
          </div>
        </div>
      </div>
    </div>
  );
};
