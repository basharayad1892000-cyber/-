import React, { useState } from 'react';
import { 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Copy, 
  Star, 
  Share2, 
  Sparkles,
  BookOpen,
  Trash2
} from 'lucide-react';
import { DhikrItem } from '../data/azkarData';
import { speakArabicText, stopArabicSpeech } from '../utils/soundHelper';
import { FontSizeOption } from '../hooks/useAzkarStorage';

interface DhikrCardProps {
  item: DhikrItem;
  currentCount: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onComplete: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  fontSize: FontSizeOption;
  showTashkeel: boolean;
  onOpenShare: (item: DhikrItem) => void;
  onDelete?: (id: string) => void;
}

export const DhikrCard: React.FC<DhikrCardProps> = ({
  item,
  currentCount,
  onIncrement,
  onReset,
  onComplete,
  isFavorite,
  onToggleFavorite,
  fontSize,
  showTashkeel,
  onOpenShare,
  onDelete,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copied, setCopied] = useState(false);

  const target = item.count;
  const isDone = currentCount >= target;
  const progressPercent = Math.min(100, Math.round((currentCount / target) * 100));

  const textToDisplay = showTashkeel ? item.tashkeelText : item.plainText;

  const fontClass = 
    fontSize === 'xlarge' 
      ? 'text-2xl sm:text-3xl leading-[2.2]' 
      : fontSize === 'large' 
      ? 'text-xl sm:text-2xl leading-[2.0]' 
      : 'text-lg sm:text-xl leading-[1.8]';

  const handleAudioToggle = () => {
    if (isPlayingAudio) {
      stopArabicSpeech();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      speakArabicText(item.plainText, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const handleCopy = () => {
    const shareContent = `${item.tashkeelText}\n\n[${item.fadl}]\nالمصدر: ${item.source}\n- تطبيق أذكاري`;
    navigator.clipboard.writeText(shareContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`relative group rounded-2xl transition-all duration-200 border ${
        isDone 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-sm' 
          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      {/* Top Card Utilities Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center gap-2">
          {/* Target count unboxed badge */}
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            الهدف: <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">{target} {target === 1 ? 'مرة' : target <= 10 ? 'مرات' : 'مرة'}</span>
          </span>
          {item.isCustom && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
              ذكرك الخاص
            </span>
          )}
          {isDone && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
              <Check className="w-3.5 h-3.5" />
              تم الإتمام
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Speech Audio */}
          <button
            onClick={handleAudioToggle}
            title={isPlayingAudio ? 'إيقاف الاستماع' : 'استماع صوتي للذكر'}
            className={`p-2 rounded-lg transition-colors text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 ${
              isPlayingAudio ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950' : ''
            }`}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            title="نسخ نص الذكر"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Share card */}
          <button
            onClick={() => onOpenShare(item)}
            title="مشاركة الذكر"
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Favorite */}
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite 
                ? 'text-amber-500 fill-amber-500' 
                : 'text-stone-400 hover:text-amber-500 dark:hover:text-amber-400'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Delete custom dhikr */}
          {item.isCustom && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('هل تريد حذف هذا الذكر الخاص بك؟')) {
                  onDelete(item.id);
                }
              }}
              title="حذف هذا الذكر الخاص"
              className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Dhikr Body */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Arabic Dhikr Text */}
        <p className={`font-amiri text-right text-stone-900 dark:text-stone-100 select-text whitespace-pre-line tracking-wide ${fontClass}`}>
          {textToDisplay}
        </p>

        {/* Virtue & Source Reference */}
        {(item.fadl || item.source) && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
            {item.fadl && (
              <div className="flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed"><strong className="text-stone-700 dark:text-stone-300">الفضل:</strong> {item.fadl}</span>
              </div>
            )}
            {item.source && (
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
                <BookOpen className="w-3 h-3 shrink-0" />
                <span className="tabular-nums">المصدر: {item.source}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ease-out ${
              isDone 
                ? 'bg-emerald-600 dark:bg-emerald-500' 
                : 'bg-emerald-600/80 dark:bg-emerald-500/80'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Counter Control Bar (Starts from 0, click to increment, saved) */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {/* Main Tap / Counter Action */}
          <button
            onClick={onIncrement}
            className={`flex-1 flex items-center justify-between px-4 py-3.5 rounded-xl font-cairo transition-all active:scale-[0.98] select-none ${
              isDone
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60'
                : 'bg-emerald-800 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm hover:shadow'
            }`}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              {isDone ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>اكتمل الورد (انقر للمزيد)</span>
                </>
              ) : (
                <span>اضغط للتسبيح والعد</span>
              )}
            </span>

            {/* Current vs Target Numerical Display */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/10 dark:bg-black/30 rounded-lg">
              <span className="font-bold text-base tabular-nums">{currentCount}</span>
              <span className="opacity-60 text-xs">/</span>
              <span className="text-xs opacity-80 tabular-nums">{target}</span>
            </div>
          </button>

          {/* Quick Complete / Reset actions */}
          <div className="flex items-center gap-1">
            {!isDone && (
              <button
                onClick={onComplete}
                title="إتمام كامل العدد بنقرة واحدة"
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            )}

            {currentCount > 0 && (
              <button
                onClick={onReset}
                title="تصفير عداد هذا الذكر"
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
