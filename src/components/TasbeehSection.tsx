import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, Sparkles, Plus, Trash2, Award } from 'lucide-react';
import { TASBEEH_PRESETS, TasbeehPreset } from '../data/azkarData';
import { playBeadSound, playCompletionChime, triggerHaptic } from '../utils/soundHelper';
import { AddTasbeehModal } from './AddTasbeehModal';

interface TasbeehSectionProps {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onIncrementDaily: () => void;
  customPresets: TasbeehPreset[];
  onAddPreset: (data: { name: string; target: number; virtue?: string }) => void;
  onDeletePreset: (id: string) => void;
}

interface TapRipple {
  id: number;
}

export const TasbeehSection: React.FC<TasbeehSectionProps> = ({
  soundEnabled,
  hapticEnabled,
  onIncrementDaily,
  customPresets,
  onAddPreset,
  onDeletePreset,
}) => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [count, setCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem('azkar_tasbeeh_count_v1');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [rounds, setRounds] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem('azkar_tasbeeh_rounds_v1');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [customTarget, setCustomTarget] = useState<number>(33);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<TapRipple[]>([]);
  const [justCompletedRound, setJustCompletedRound] = useState(false);

  // Combine standard and user's custom presets
  const allPresets = useMemo(() => {
    return [...TASBEEH_PRESETS, ...customPresets];
  }, [customPresets]);

  const currentPreset: TasbeehPreset =
    allPresets[activePresetIndex] || allPresets[0] || TASBEEH_PRESETS[0];
  const target = customTarget;

  // Persist Tasbeeh counter and completed rounds across exits to Home
  useEffect(() => {
    try {
      localStorage.setItem('azkar_tasbeeh_count_v1', count.toString());
      localStorage.setItem('azkar_tasbeeh_rounds_v1', rounds.toString());
    } catch {
      // Ignore storage errors
    }
  }, [count, rounds]);

  const handleTap = () => {
    const next = count + 1;
    const rippleId = Date.now() + Math.random();

    triggerHaptic(hapticEnabled);
    setIsPressed(true);
    setRipples(prev => [...prev.slice(-3), { id: rippleId }]);

    window.setTimeout(() => setIsPressed(false), 180);
    window.setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 750);

    onIncrementDaily();

    if (next >= target) {
      setCount(0);
      setRounds(prev => prev + 1);
      setJustCompletedRound(true);
      playCompletionChime(soundEnabled);
      window.setTimeout(() => setJustCompletedRound(false), 1200);
    } else {
      setCount(next);
      playBeadSound(soundEnabled);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleFullReset = () => {
    setCount(0);
    setRounds(0);
  };

  const progressPercent = Math.min(100, (count / target) * 100);

  // Larger SVG circular gauge calculation (320x320 viewBox, radius 138)
  const radius = 138;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Preset Selector Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
            اختر صيغة التسبيح (عداد السبحة محفوظ دائماً ولا يتصفر عند الخروج)
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>الدورات المكتملة:</span>
            <span className="font-black tabular-nums">{rounds}</span>
          </div>
        </div>

        {/* Horizontal preset badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allPresets.map((preset, idx) => {
            const isSelected = idx === activePresetIndex;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePresetIndex(idx);
                  setCustomTarget(preset.target);
                  setConfirmDeleteId(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-800 text-white dark:bg-emerald-600 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>{preset.name}</span>
                {preset.isCustom && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-emerald-950 font-bold">
                    خاص
                  </span>
                )}
              </button>
            );
          })}

          {/* Add custom tasbeeh button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة تسبيح</span>
          </button>
        </div>

        {/* Selected Dhikr Virtue & Custom Options */}
        {(currentPreset.virtue || currentPreset.isCustom) && (
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {currentPreset.virtue || 'تسبيح مخصص أضافه المستخدم'}
              </span>
            </div>
            {currentPreset.isCustom && (
              <div className="flex items-center gap-1.5 shrink-0">
                {confirmDeleteId === currentPreset.id ? (
                  <>
                    <button
                      onClick={() => {
                        onDeletePreset(currentPreset.id);
                        setActivePresetIndex(0);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
                    >
                      تأكيد الحذف
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                    >
                      إلغاء
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(currentPreset.id)}
                    className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="حذف هذا التسبيح المخصص"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Target Selector Bar */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 ml-2">
          هدف الدورة:
        </span>
        {[33, 100, 1000].map(val => (
          <button
            key={val}
            onClick={() => {
              setCustomTarget(val);
              if (count >= val) setCount(0);
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors tabular-nums ${
              customTarget === val
                ? 'bg-emerald-800 text-white dark:bg-emerald-600 shadow-xs'
                : 'bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
            }`}
          >
            {val}
          </button>
        ))}
      </div>

      {/* Main Centered Large Interactive Tasbeeh Button with Elegant Tap Effects */}
      <div className="flex flex-col items-center justify-center py-6 sm:py-10 min-h-[420px] sm:min-h-[470px] select-none">
        <div className="relative flex items-center justify-center w-80 h-80 sm:w-96 sm:h-96">
          {/* Ambient Radial Glow Aura Behind the Button */}
          <div
            className={`pointer-events-none absolute inset-2 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-amber-400/25 blur-2xl transition-all duration-300 ${
              isPressed
                ? 'scale-110 opacity-95'
                : justCompletedRound
                ? 'scale-125 opacity-100'
                : 'scale-95 opacity-60'
            }`}
          />

          {/* Expanding Concentric Ripple Rings on Every Tap */}
          {ripples.map(r => (
            <span
              key={r.id}
              className="pointer-events-none absolute inset-4 rounded-full border-2 border-amber-400/70 dark:border-emerald-400/70 animate-ping"
              style={{ animationDuration: '700ms' }}
            />
          ))}

          {/* Secondary Outer Luminous Ring on Tap */}
          <div
            className={`pointer-events-none absolute inset-1 rounded-full border border-emerald-400/40 dark:border-emerald-500/30 transition-transform duration-300 ${
              isPressed ? 'scale-105 opacity-90' : 'scale-100 opacity-40'
            }`}
          />

          {/* Circular SVG Gauge */}
          <svg
            className="w-80 h-80 sm:w-96 sm:h-96 -rotate-90 transform drop-shadow-sm"
            viewBox="0 0 320 320"
          >
            <defs>
              <linearGradient id="tasbeehRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Background track ring */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              className="text-stone-200/90 dark:text-stone-800 stroke-current"
              strokeWidth="12"
              fill="transparent"
            />

            {/* Animated gradient progress ring */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="url(#tasbeehRingGrad)"
              className="transition-all duration-150 ease-out"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Central Large Touch Button */}
          <button
            type="button"
            onClick={handleTap}
            className={`group absolute inset-6 sm:inset-7 rounded-full flex flex-col items-center justify-center transition-transform duration-150 cursor-pointer shadow-xl border-4 overflow-hidden ${
              isPressed ? 'scale-[0.95]' : 'hover:scale-[1.015]'
            } ${
              justCompletedRound
                ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-amber-700 border-amber-300 dark:border-amber-400'
                : 'bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 border-emerald-500/50 dark:border-emerald-400/40'
            } text-white`}
          >
            {/* Subtle Inner Shimmer Overlay on Tap */}
            <div
              className={`pointer-events-none absolute inset-0 rounded-full bg-radial from-amber-300/25 via-emerald-300/10 to-transparent transition-opacity duration-200 ${
                isPressed ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
              }`}
            />

            {/* Top Sparkle / Round Completion Badge */}
            <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 mb-2">
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 transition-transform duration-200 ${isPressed ? 'scale-125 rotate-12' : ''}`} />
              <span className="text-[11px] font-bold text-amber-200">
                {justCompletedRound ? 'تمت الدورة بحمد الله!' : `الدورة رقم ${rounds + 1}`}
              </span>
            </div>

            {/* Selected Tasbeeh Phrase */}
            <span className="relative z-10 font-amiri text-2xl sm:text-3xl font-bold tracking-wide text-amber-200 px-4 text-center line-clamp-2">
              {currentPreset.name}
            </span>

            {/* Giant Tactile Numerical Count */}
            <span
              className={`relative z-10 font-cairo text-6xl sm:text-7xl font-black tracking-tight tabular-nums my-2 transition-transform duration-150 ${
                isPressed ? 'scale-110 text-amber-300' : 'scale-100 text-white'
              }`}
            >
              {count}
            </span>

            {/* Target Indicator */}
            <div className="relative z-10 flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-200/95 tabular-nums">
              <span>من {target}</span>
              <span>·</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>

            <span className="relative z-10 text-xs text-emerald-200/75 mt-3 font-medium">
              انقر في أي مكان داخل الدائرة للتسبيح
            </span>
          </button>
        </div>

        {/* Counter Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold shadow-xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير الدورة الحالية</span>
          </button>

          <button
            onClick={handleFullReset}
            className="px-5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 text-xs font-bold transition-colors"
          >
            تصفير الكل (مع الدورات)
          </button>
        </div>
      </div>

      {/* Add Custom Tasbeeh Modal */}
      <AddTasbeehModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={data => {
          onAddPreset(data);
          setActivePresetIndex(allPresets.length);
          setCustomTarget(data.target);
          setCount(0);
        }}
      />
    </div>
  );
};
