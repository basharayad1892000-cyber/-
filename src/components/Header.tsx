import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Settings, Sparkles, Home, Palette, Check, RotateCcw, X, Maximize2, Minimize2, HelpCircle } from 'lucide-react';
import { AppSectionId } from './HomeLauncher';
import {
  APP_COLOR_PRESETS,
  CustomGradientConfig,
} from '../utils/themePalette';

interface HeaderProps {
  activeSection: AppSectionId;
  onSelectSection: (section: AppSectionId) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  gradientConfig: CustomGradientConfig;
  onChangeGradient: (config: CustomGradientConfig) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
  onOpenTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  theme,
  onToggleTheme,
  gradientConfig,
  onChangeGradient,
  isFullscreen,
  onToggleFullscreen,
  onOpenSettings,
  onOpenTour,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteContainerRef = useRef<HTMLDivElement | null>(null);

  // Close palette popover when clicking outside
  useEffect(() => {
    if (!isPaletteOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteContainerRef.current && !paletteContainerRef.current.contains(e.target as Node)) {
        setIsPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPaletteOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectSection('home')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 text-right"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs transition-all"
            style={{
              backgroundImage: `linear-gradient(135deg, ${gradientConfig.fromHex}, ${gradientConfig.toHex})`,
            }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-amiri">
            أذكاري
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectSection('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'home' || activeSection.startsWith('azkar-')
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-700 dark:border-emerald-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            واجهة الأذكار
          </button>

          <button
            onClick={() => onSelectSection('quran-khatmah')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'quran-khatmah'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-700 dark:border-emerald-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            المصحف والختمة
          </button>

          <button
            onClick={() => onSelectSection('hadith-books')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'hadith-books'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-700 dark:border-emerald-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            كتب الحديث الصحيحة
          </button>

          <button
            onClick={() => onSelectSection('hijri-calendar')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'hijri-calendar'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-700 dark:border-emerald-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            التقويم الهجري
          </button>

          <button
            onClick={() => onSelectSection('tasbeeh')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'tasbeeh'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-700 dark:border-emerald-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            السبحة
          </button>
        </nav>

        {/* Zone 3: Color Palette Picker, Theme Toggle (Dark/Light), & Settings */}
        <div className="flex items-center gap-2 shrink-0" ref={paletteContainerRef}>
          {activeSection !== 'home' && (
            <button
              onClick={() => onSelectSection('home')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/70 hover:bg-emerald-200/80 text-emerald-900 dark:text-emerald-200 font-bold text-xs transition whitespace-nowrap shrink-0"
              title="العودة للشاشة الرئيسية"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
          )}

          {/* Custom App Color Gradient Picker Button (Directly next to Dark/Light mode button) */}
          <div className="relative">
            <button
              onClick={() => setIsPaletteOpen(prev => !prev)}
              title="تغيير ألوان وتدرج التطبيق"
              aria-label="تخصيص ألوان وتدرج التطبيق"
              className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                isPaletteOpen
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800'
              }`}
            >
              <Palette className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/80 dark:border-stone-900 shadow-2xs"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${gradientConfig.fromHex}, ${gradientConfig.toHex})`,
                }}
              />
            </button>

            {/* Color Gradient Picker Popover */}
            {isPaletteOpen && (
              <div className="fixed sm:absolute left-3 right-3 sm:right-auto sm:left-0 top-18 sm:top-13 sm:w-96 z-50 rounded-3xl bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 shadow-xl p-5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${gradientConfig.fromHex}, ${gradientConfig.toHex})`,
                      }}
                    >
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        تخصيص ألوان وتدرج التطبيق
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        اختر تدرجاً مقترحاً أو صمّم تدرجك اللوني الخاص
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaletteOpen(false)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 6 Curated Preset Gradients */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    تدرجات لونية مقترحة:
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {APP_COLOR_PRESETS.map(preset => {
                      const isSelected = gradientConfig.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() =>
                            onChangeGradient({
                              presetId: preset.id,
                              fromHex: preset.fromHex,
                              toHex: preset.toHex,
                            })
                          }
                          className={`text-right rounded-2xl p-2.5 border transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-2xs'
                              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white shadow-xs"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${preset.fromHex}, ${preset.toHex})`,
                            }}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                              {preset.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom 2-Color Gradient Picker */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      تخصيص تدرج خاص بك (لونين):
                    </span>
                    {gradientConfig.presetId === 'custom' && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        مفعّل حالياً
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 cursor-pointer">
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                        اللون الأول
                      </span>
                      <input
                        type="color"
                        value={gradientConfig.fromHex}
                        onChange={e =>
                          onChangeGradient({
                            presetId: 'custom',
                            fromHex: e.target.value,
                            toHex: gradientConfig.toHex,
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 cursor-pointer">
                      <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                        اللون الثاني
                      </span>
                      <input
                        type="color"
                        value={gradientConfig.toHex}
                        onChange={e =>
                          onChangeGradient({
                            presetId: 'custom',
                            fromHex: gradientConfig.fromHex,
                            toHex: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                    </label>
                  </div>

                  {/* Live Preview Bar */}
                  <div
                    className="h-9 rounded-2xl flex items-center justify-center text-white text-xs font-bold shadow-inner"
                    style={{
                      backgroundImage: `linear-gradient(to left, ${gradientConfig.fromHex}, ${gradientConfig.toHex})`,
                    }}
                  >
                    معاينة التدرج اللوني المختار
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() =>
                        onChangeGradient({
                          presetId: 'emerald',
                          fromHex: '#059669',
                          toHex: '#0d9488',
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة اللون الافتراضي</span>
                    </button>

                    <button
                      onClick={() => setIsPaletteOpen(false)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                    >
                      تم
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'التحويل إلى الوضع النهاري' : 'التحويل إلى الوضع الليلي'}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors"
            aria-label="تبديل الوضع الليلي والنهاري"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-800" />
            )}
          </button>

          {/* Fullscreen Mode Toggle (Hides Chrome Top Bar) */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'إنهاء وضع ملء الشاشة' : 'وضع ملء الشاشة (إخفاء شريط المتصفح العلوي)'}
            className={`p-2.5 rounded-xl border transition-colors ${
              isFullscreen
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800'
            }`}
            aria-label="تبديل وضع ملء الشاشة"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Onboarding Guided Tour Button */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              title="دليل استخدام التطبيق والخطوات التلميحية"
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors"
              aria-label="دليل استخدام التطبيق"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Preferences Button */}
          <button
            onClick={onOpenSettings}
            title="إعدادات القراءة والتفضيلات"
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800 transition-colors"
            aria-label="إعدادات القراءة"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
