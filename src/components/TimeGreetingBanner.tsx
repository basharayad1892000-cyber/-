import React, { useMemo } from 'react';
import { Sun, Sunset, Moon, Sparkles, ArrowLeft, HelpCircle, X } from 'lucide-react';
import { AppSectionId } from './HomeLauncher';

interface TimeGreetingBannerProps {
  onSelectSection: (section: AppSectionId) => void;
  onOpenOnboardingTour: () => void;
  onDismiss?: () => void;
}

export const TimeGreetingBanner: React.FC<TimeGreetingBannerProps> = ({
  onSelectSection,
  onOpenOnboardingTour,
  onDismiss,
}) => {
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();

    // Morning Azkar Window: 4:00 AM to 11:59 AM
    if (hour >= 4 && hour < 12) {
      return {
        period: 'morning' as const,
        greetingTitle: 'صبّحك الله بالخير والنور والسرور',
        subtitle:
          'أصبحنا وأصبح الملك لله — خير ما تستفتح به يومك أذكار الصباح لحفظك وبركة يومك وطمأنينة قلبك.',
        primaryActionLabel: 'ابدأ أذكار الصباح الآن',
        targetSection: 'azkar-morning' as AppSectionId,
        secondaryLabel: 'السبحة الإلكترونية',
        secondarySection: 'tasbeeh' as AppSectionId,
        timeWindowNote: 'وقت أذكار الصباح المبارك',
        containerStyle:
          'from-amber-50/95 via-emerald-50/80 to-teal-50/90 dark:from-amber-950/50 dark:via-emerald-950/35 dark:to-stone-900 border-amber-300/80 dark:border-amber-800/60',
        iconBgStyle:
          'bg-amber-500 text-white shadow-amber-500/20',
      };
    }

    // Evening Azkar Window: 12:00 PM to 9:59 PM
    if (hour >= 12 && hour < 22) {
      return {
        period: 'evening' as const,
        greetingTitle: 'مسّاك الله بالخير والسكينة والعافية',
        subtitle:
          'أمسينا وأمسى الملك لله — حصّن نفسك وأهلك في هذا المساء بأذكار المساء والأذكار المضاعفة.',
        primaryActionLabel: 'ابدأ أذكار المساء الآن',
        targetSection: 'azkar-evening' as AppSectionId,
        secondaryLabel: 'أذكار بعد الصلاة',
        secondarySection: 'azkar-prayer' as AppSectionId,
        timeWindowNote: 'وقت أذكار المساء والتحصين',
        containerStyle:
          'from-emerald-50/95 via-teal-50/85 to-amber-50/80 dark:from-emerald-950/55 dark:via-teal-950/40 dark:to-stone-900 border-emerald-300/80 dark:border-emerald-800/60',
        iconBgStyle:
          'bg-emerald-600 text-white shadow-emerald-600/20',
      };
    }

    // Late Night Window (10:00 PM to 3:59 AM): Still says مساك الله بالخير with evening & sleep options
    return {
      period: 'night' as const,
      greetingTitle: 'مسّاك الله بالخير والطمأنينة والرضوان',
      subtitle:
        'في سكون الليل تطيب المناجاة — يمكنك قراءة أذكار المساء أو أذكار النوم لاختتام يومك في حفظ الله.',
      primaryActionLabel: 'قراءة أذكار المساء',
      targetSection: 'azkar-evening' as AppSectionId,
      secondaryLabel: 'أذكار النوم والاستيقاظ',
      secondarySection: 'azkar-sleep' as AppSectionId,
      timeWindowNote: 'وقت أذكار المساء والنوم',
      containerStyle:
        'from-indigo-50/90 via-emerald-50/75 to-stone-50 dark:from-indigo-950/50 dark:via-stone-900 dark:to-stone-900 border-indigo-200/80 dark:border-indigo-800/50',
      iconBgStyle:
        'bg-indigo-600 text-white shadow-indigo-600/20',
    };
  }, []);

  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-l ${greetingInfo.containerStyle} border-2 p-5 sm:p-6 shadow-xs transition-all animate-fade-in`}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          title="إخفاء بطاقة الترحيب"
          className="absolute top-3.5 left-3.5 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-white/60 dark:hover:bg-stone-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-6 lg:pl-8">
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${greetingInfo.iconBgStyle}`}
          >
            {greetingInfo.period === 'morning' ? (
              <Sun className="w-7 h-7" />
            ) : greetingInfo.period === 'evening' ? (
              <Sunset className="w-7 h-7" />
            ) : (
              <Moon className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{greetingInfo.timeWindowNote}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-amiri">
              {greetingInfo.greetingTitle}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              {greetingInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectSection(greetingInfo.targetSection)}
            className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <span>{greetingInfo.primaryActionLabel}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectSection(greetingInfo.secondarySection)}
            className="px-4 py-3 rounded-2xl bg-white/90 dark:bg-stone-800 hover:bg-white text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700 font-bold text-xs sm:text-sm transition cursor-pointer"
          >
            {greetingInfo.secondaryLabel}
          </button>

          <button
            type="button"
            onClick={onOpenOnboardingTour}
            title="عرض خطوات إرشاد وتعليم استخدام التطبيق"
            className="px-3.5 py-3 rounded-2xl bg-amber-100/90 dark:bg-amber-950/60 hover:bg-amber-200/80 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>جولة تعليمية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
