import React from 'react';
import { Sparkles, RotateCcw, CheckCheck, Sun, Sunset, Moon } from 'lucide-react';
import { CATEGORIES } from '../data/azkarData';

interface HeroSectionProps {
  currentCategoryTitle: string;
  currentCategorySubtitle: string;
  totalCategoryItems: number;
  completedCategoryItems: number;
  onResetCategory: () => void;
  onCompleteCategory: () => void;
  onSelectCategory: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentCategoryTitle,
  currentCategorySubtitle,
  totalCategoryItems,
  completedCategoryItems,
  onResetCategory,
  onCompleteCategory,
  onSelectCategory,
}) => {
  // Determine time-appropriate recommendation
  const hour = new Date().getHours();
  let timeGreeting = 'حان وقت الذكر المبارك';
  let recommendedCategory = 'morning';
  let RecommendationIcon = Sun;

  if (hour >= 4 && hour < 12) {
    timeGreeting = 'طاب صباحك بذكر الله · وقت أذكار الصباح';
    recommendedCategory = 'morning';
    RecommendationIcon = Sun;
  } else if (hour >= 12 && hour < 18) {
    timeGreeting = 'طاب مساؤك بالسكينة · وقت أذكار المساء';
    recommendedCategory = 'evening';
    RecommendationIcon = Sunset;
  } else {
    timeGreeting = 'ليلة مباركة هانئة · وقت أذكار النوم والاستغفار';
    recommendedCategory = 'sleep';
    RecommendationIcon = Moon;
  }

  const progressPercent = totalCategoryItems > 0 
    ? Math.round((completedCategoryItems / totalCategoryItems) * 100) 
    : 0;

  return (
    <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-7 shadow-sm transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Category info & Proverb */}
        <div className="space-y-2 max-w-xl">
          {/* Time greeting */}
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            <RecommendationIcon className="w-4 h-4 shrink-0 text-amber-500" />
            <span>{timeGreeting}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-amiri">
            {currentCategoryTitle}
          </h1>

          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {currentCategorySubtitle}
          </p>

          <div className="pt-2 text-xs text-stone-500 dark:text-stone-400 italic">
            قال رسول الله ﷺ: «مَثَلُ الَّذِي يَذْكُرُ رَبَّهُ وَالَّذِي لا يَذْكُرُ رَبَّهُ مَثَلُ الْحَيِّ وَالْمَيِّتِ»
          </div>
        </div>

        {/* Right Side: Progress Bar and Batch Actions */}
        <div className="w-full lg:w-80 bg-stone-50 dark:bg-stone-800/60 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span>نسبة إنجاز القسم:</span>
            <span className="tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
              {completedCategoryItems} من {totalCategoryItems} ({progressPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-700 dark:bg-emerald-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Category Actions */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <button
              onClick={onCompleteCategory}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-semibold shadow-xs hover:border-emerald-300 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>إتمام كل أذكار القسم</span>
            </button>

            {completedCategoryItems > 0 && (
              <button
                onClick={onResetCategory}
                title="تصفير عدادات هذا القسم"
                className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
