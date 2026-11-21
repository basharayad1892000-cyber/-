import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Star,
  Volume2,
  VolumeX,
  Share2,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Home,
  BookOpen,
  Lightbulb,
  Heart,
  X,
} from 'lucide-react';
import { DhikrItem } from '../data/azkarData';
import { getTadabburForDhikr } from '../data/tadabburData';
import { FontSizeOption } from '../hooks/useAzkarStorage';
import { speakArabicText, stopSpeech } from '../utils/soundHelper';

interface SequentialDhikrViewProps {
  categoryTitle: string;
  categorySubtitle: string;
  items: DhikrItem[];
  counts: Record<string, number>;
  onIncrement: (id: string, target: number) => void;
  onResetItem: (id: string) => void;
  onResetCategory: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  fontSize: FontSizeOption;
  showTashkeel: boolean;
  onOpenShare: (item: DhikrItem) => void;
  onOpenAddDhikr: () => void;
  onDeleteCustomDhikr?: (id: string) => void;
  onBackHome: () => void;
}

export const SequentialDhikrView: React.FC<SequentialDhikrViewProps> = ({
  categoryTitle,
  categorySubtitle,
  items,
  counts,
  onIncrement,
  onResetItem,
  onResetCategory,
  favorites,
  onToggleFavorite,
  fontSize,
  showTashkeel,
  onOpenShare,
  onOpenAddDhikr,
  onDeleteCustomDhikr,
  onBackHome,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCategoryFinished, setIsCategoryFinished] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [justCompletedItem, setJustCompletedItem] = useState<boolean>(false);
  const [showTadabburModal, setShowTadabburModal] = useState<boolean>(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  // Stop speech and clear timers when unmounting or changing index
  useEffect(() => {
    stopSpeech();
    setIsSpeaking(false);
    setShowTadabburModal(false);
    return () => {
      stopSpeech();
      if (autoAdvanceTimerRef.current) {
        window.clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [currentIndex]);

  // Keep index within bounds if items change (e.g., custom item deleted or added)
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(items.length - 1);
    }
  }, [items.length, currentIndex]);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 sm:p-10 space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            لا توجد أذكار في هذا القسم حالياً
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            يمكنك إضافة أذكارك وأدعيتك الخاصة إلى هذا القسم أو العودة للشاشة الرئيسية لاختيار قسم آخر.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenAddDhikr}
              className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ذكر جديد</span>
            </button>
            <button
              onClick={onBackHome}
              className="px-5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-sm flex items-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex] || items[0];
  const currentCount = counts[currentItem.id] || 0;
  const targetCount = currentItem.count;
  const isCurrentDone = currentCount >= targetCount;
  const isFavorite = favorites.includes(currentItem.id);
  const currentTadabbur = getTadabburForDhikr(currentItem);

  // Handle tapping the big counter area
  const handleTapDhikr = () => {
    if (justCompletedItem) return;

    const nextCount = currentCount + 1;
    onIncrement(currentItem.id, targetCount);

    // If this tap completes the required count for the current dhikr, auto-advance to the next dhikr!
    if (nextCount >= targetCount) {
      setJustCompletedItem(true);
      if (autoAdvanceTimerRef.current) {
        window.clearTimeout(autoAdvanceTimerRef.current);
      }
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        setJustCompletedItem(false);
        if (currentIndex < items.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          // Automatically reset the category counters upon completing the last dhikr while keeping the celebration screen
          onResetCategory();
          setIsCategoryFinished(true);
        }
      }, 420);
    }
  };

  const handleToggleSpeech = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakArabicText(currentItem.plainText, () => setIsSpeaking(false));
    }
  };

  const fontSizeClass =
    fontSize === 'normal'
      ? 'text-xl sm:text-2xl leading-[2.1]'
      : fontSize === 'large'
      ? 'text-2xl sm:text-3xl leading-[2.2]'
      : 'text-3xl sm:text-4xl leading-[2.3]';

  // Celebration screen when all azkar in the category are completed
  if (isCategoryFinished) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-stone-900 border-2 border-emerald-200 dark:border-emerald-800/70 p-8 sm:p-10 text-center space-y-6 shadow-md">
          <div className="w-20 h-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-11 h-11" />
          </div>

          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-emerald-100 font-amiri">
              ما شاء الله! تقبّل الله طاعتك
            </h2>
            <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300">
              أتممت بحمد الله جميع أذكار <strong>{categoryTitle}</strong> ({items.length} ذكراً)
            </p>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تم تصفير عداد الأذكار تلقائياً ليكون جاهزاً للمرة القادمة</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onBackHome}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Home className="w-5 h-5" />
              <span>العودة لواجهة الأيقونات الرئيسية</span>
            </button>

            <button
              onClick={() => {
                onResetCategory();
                setCurrentIndex(0);
                setIsCategoryFinished(false);
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>قراءة القسم من البداية الآن</span>
            </button>
          </div>

          {/* Add Custom Dhikr at the end of the category */}
          <div className="pt-6 border-t border-emerald-200/70 dark:border-emerald-800/50">
            <button
              onClick={() => {
                setIsCategoryFinished(false);
                onOpenAddDhikr();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold text-xs hover:bg-amber-200/80 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة ذكر خاص بك في نهاية {categoryTitle}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overallProgressPct = Math.round(((currentIndex + (isCurrentDone ? 1 : currentCount / targetCount)) / items.length) * 100);
  const itemProgressPct = Math.min(100, Math.round((currentCount / targetCount) * 100));

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Top Navigation & Progress Header */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3.5 sm:p-4 shadow-xs">
        <button
          onClick={() => {
            onResetCategory();
            onBackHome();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-stone-800 dark:text-stone-200 font-bold text-xs sm:text-sm transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرئيسية</span>
        </button>

        <div className="text-center">
          <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
            {categoryTitle}
          </h1>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
            الذكر {currentIndex + 1} من {items.length} · يتصفر العداد تلقائياً عند الخروج
          </p>
        </div>

        <button
          onClick={onOpenAddDhikr}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200/80 text-emerald-900 dark:text-emerald-200 font-bold text-xs transition"
          title="إضافة ذكر خاص في نهاية هذا القسم"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">إضافة ذكر</span>
        </button>
      </div>

      {/* Step Progress Bar */}
      <div className="space-y-1.5 px-1">
        <div className="w-full h-3 rounded-full bg-stone-200/80 dark:bg-stone-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-300"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>
      </div>

      {/* Single Large Focused Dhikr Card */}
      <div
        className={`relative rounded-3xl border-2 transition-all duration-300 p-6 sm:p-8 md:p-10 shadow-sm flex flex-col justify-between gap-6 ${
          justCompletedItem || isCurrentDone
            ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-white dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 border-emerald-400 dark:border-emerald-600'
            : 'bg-white dark:bg-stone-900 border-stone-200/90 dark:border-stone-800'
        }`}
      >
        {/* Top Controls Row inside Card */}
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              التكرار المطلوب: {targetCount === 1 ? 'مرة واحدة' : targetCount === 3 ? '3 مرات' : `${targetCount} مرة`}
            </span>
            {currentItem.source && (
              <>
                <span aria-hidden="true">·</span>
                <span>{currentItem.source}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSpeech}
              title="الاستماع للذكر"
              className={`p-2.5 rounded-xl transition-colors ${
                isSpeaking
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onToggleFavorite(currentItem.id)}
              title="إضافة للمفضلة"
              className={`p-2.5 rounded-xl transition-colors ${
                isFavorite
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => onOpenShare(currentItem)}
              title="مشاركة الذكر"
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {currentItem.isCustom && onDeleteCustomDhikr && (
              <button
                onClick={() => onDeleteCustomDhikr(currentItem.id)}
                title="حذف هذا الذكر المخصص"
                className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Vocalized Dhikr Text (Clickable to increment as well) */}
        <div
          onClick={handleTapDhikr}
          className="py-4 sm:py-6 text-center cursor-pointer select-none"
        >
          <p className={`font-amiri font-bold text-stone-900 dark:text-stone-100 whitespace-pre-line ${fontSizeClass}`}>
            {showTashkeel ? currentItem.tashkeelText : currentItem.plainText}
          </p>
        </div>

        {/* Virtue / Fadl Box + Small Tadabbur Icon at Bottom-Left of Dhikr Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
          {currentItem.fadl ? (
            <div className="flex-1 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/40 px-4 py-3 text-right">
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                <strong className="font-bold">الفضل والبيان: </strong>
                {currentItem.fadl}
              </p>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Small Tadabbur Icon in Bottom-Left (in RTL, end of row is left) */}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setShowTadabburModal(true);
            }}
            title="تدبر الذكر ومعانيه"
            className="self-end inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>تدبر الذكر</span>
          </button>
        </div>

        {/* Giant Child-Friendly Interactive Counter Button */}
        <div className="pt-2 flex flex-col items-center gap-4">
          <button
            onClick={handleTapDhikr}
            className={`w-full py-5 sm:py-6 px-6 rounded-3xl font-bold transition-all duration-150 active:scale-[0.97] shadow-md flex flex-col items-center justify-center gap-2 select-none cursor-pointer ${
              justCompletedItem || isCurrentDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                : 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-600 hover:to-teal-600 text-white'
            }`}
          >
            <div className="flex items-center gap-3 text-2xl sm:text-3xl tabular-nums">
              <span>{currentCount}</span>
              <span className="text-emerald-200 text-lg">/</span>
              <span>{targetCount}</span>
            </div>
            <span className="text-xs sm:text-sm text-emerald-100 font-medium">
              {justCompletedItem
                ? 'أحسنت! جاري الانتقال للذكر التالي...'
                : 'اضغط هنا عند كل قراءة (ينتقل تلقائياً عند الاكتمال)'}
            </span>

            {/* Mini progress bar inside button */}
            <div className="w-48 h-1.5 rounded-full bg-black/20 overflow-hidden mt-1">
              <div
                className="h-full bg-amber-300 transition-all duration-200"
                style={{ width: `${itemProgressPct}%` }}
              />
            </div>
          </button>

          {/* Bottom Stepper Controls (Previous / Reset current / Next) */}
          <div className="w-full flex items-center justify-between gap-2 pt-2">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs disabled:opacity-40 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الذكر السابق</span>
            </button>

            {currentCount > 0 && (
              <button
                onClick={() => onResetItem(currentItem.id)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-stone-500 hover:text-rose-600 text-xs font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير العداد</span>
              </button>
            )}

            <button
              onClick={() => {
                if (currentIndex < items.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                } else {
                  onResetCategory();
                  setIsCategoryFinished(true);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            >
              <span>{currentIndex === items.length - 1 ? 'إنهاء القسم' : 'الذكر التالي'}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Dhikr Tadabbur Modal */}
      {showTadabburModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTadabburModal(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-stone-800 p-6 sm:p-8 shadow-2xl space-y-5 text-right"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    واحة التدبر والفهم القلبي
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-amiri">
                    {currentTadabbur.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setShowTadabburModal(false)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quoted Dhikr Preview */}
            <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 p-4 text-center">
              <p className="font-amiri font-bold text-base sm:text-lg text-emerald-950 dark:text-emerald-100 leading-loose line-clamp-4">
                {showTashkeel ? currentItem.tashkeelText : currentItem.plainText}
              </p>
            </div>

            {/* 1. Overall Meaning */}
            <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-sm">
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>المعنى الإجمالي للذكر:</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                {currentTadabbur.meaning}
              </p>
            </div>

            {/* 2. Linguistic & Spiritual Gems */}
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/50 p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>لطائف الكلمات وأسرارها:</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                {currentTadabbur.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Spiritual Impact on the Heart */}
            <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-300 font-bold text-sm">
                <Heart className="w-4 h-4 shrink-0" />
                <span>الأثر الإيماني والقلبي:</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                {currentTadabbur.heartImpact}
              </p>
            </div>

            {/* 4. Personal Reflection Question */}
            <div className="rounded-2xl bg-stone-100/80 dark:bg-stone-800/80 p-4 text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                سؤال للتأمل ومحاسبة النفس
              </span>
              <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-100">
                « {currentTadabbur.reflectionQuestion} »
              </p>
            </div>

            {/* Close Action */}
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowTadabburModal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition"
              >
                العودة لإتمام الذكر بخشوع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
