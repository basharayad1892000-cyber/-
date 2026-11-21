import React, { useState } from 'react';
import { X, Volume2, VolumeX, Smartphone, Type, Sparkles, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { FontSizeOption } from '../hooks/useAzkarStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  showTashkeel: boolean;
  setShowTashkeel: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (val: boolean) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  autoFullscreen: boolean;
  setAutoFullscreen: (val: boolean) => void;
  onResetAllCounts: () => void;
  onOpenInstall?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  fontSize,
  setFontSize,
  showTashkeel,
  setShowTashkeel,
  soundEnabled,
  setSoundEnabled,
  hapticEnabled,
  setHapticEnabled,
  isFullscreen,
  onToggleFullscreen,
  autoFullscreen,
  setAutoFullscreen,
  onResetAllCounts,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            تخصيص القراءة والتفضيلات
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fullscreen Mode & Hide Chrome Top Bar Section */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Maximize2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  الفتح التلقائي بوضع ملء الشاشة
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  إخفاء الشريط العلوي لجوجل كروم تلقائياً فور لمس الشاشة
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoFullscreen(!autoFullscreen)}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                autoFullscreen ? 'bg-emerald-700' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoFullscreen ? '-translate-x-7' : '-translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={onToggleFullscreen}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>الخروج من وضع ملء الشاشة حالياً</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>تفعيل ملء الشاشة الآن (إخفاء الشريط العلوي)</span>
              </>
            )}
          </button>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
            <Type className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>حجم خط نصوص الأذكار</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
            {(['normal', 'large', 'xlarge'] as FontSizeOption[]).map(size => {
              const label = size === 'normal' ? 'عادي' : size === 'large' ? 'كبير' : 'كبير جداً';
              const isActive = fontSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tashkeel Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                إظهار التشكيل والحركات
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                قراءة أسهل مع الحركات الإعرابية الصحيحة
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTashkeel(!showTashkeel)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              showTashkeel ? 'bg-emerald-700' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                showTashkeel ? '-translate-x-7' : '-translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Sound Feedback */}
        <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                صوت نقرة التسبيح والتنبيه
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                صوت خفيف ناعم مع كل ضغطة ونغمة عند اكتمال الهدف
              </p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              soundEnabled ? 'bg-emerald-700' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                soundEnabled ? '-translate-x-7' : '-translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Haptic Feedback */}
        <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                الاهتزاز اللمسي (Haptic)
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                نبضة اهتزاز خفيفة على أجهزة الجوال عند كل تسبيحة
              </p>
            </div>
          </div>
          <button
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              hapticEnabled ? 'bg-emerald-700' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                hapticEnabled ? '-translate-x-7' : '-translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reset All Counts */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تصفير جميع عدادات الأذكار</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onResetAllCounts();
                  setConfirmReset(false);
                  onClose();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
              >
                تأكيد التصفير
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="py-2.5 px-4 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
