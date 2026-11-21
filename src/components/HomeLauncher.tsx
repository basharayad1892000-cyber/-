import React from 'react';
import {
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Compass,
  BookOpen,
  HeartHandshake,
  ShieldCheck,
  Star,
  Calendar,
  Library,
  BookMarked,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { getHijriFromDate } from '../data/hijriCalendarData';

export type AppSectionId =
  | 'home'
  | 'azkar-morning'
  | 'azkar-evening'
  | 'azkar-sleep'
  | 'azkar-prayer'
  | 'azkar-general'
  | 'azkar-quranic'
  | 'azkar-prophetic'
  | 'azkar-ruqyah'
  | 'azkar-favorites'
  | 'quran-khatmah'
  | 'hadith-books'
  | 'hijri-calendar'
  | 'tasbeeh';

interface HomeLauncherProps {
  onSelectSection: (section: AppSectionId) => void;
  completedCountsByCategory: Record<string, number>;
  totalCountsByCategory: Record<string, number>;
  favoritesCount: number;
  streakDays: number;
  todayCount: number;
}

interface LauncherCardItem {
  id: AppSectionId;
  categoryKey?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  lightBg: string;
  darkBg: string;
  iconBoxBg: string;
  accentText: string;
  progressColor: string;
}

export const HomeLauncher: React.FC<HomeLauncherProps> = ({
  onSelectSection,
  completedCountsByCategory,
  totalCountsByCategory,
  favoritesCount,
  streakDays,
  todayCount,
}) => {
  const todayHijri = getHijriFromDate(new Date());

  const azkarCards: LauncherCardItem[] = [
    {
      id: 'azkar-morning',
      categoryKey: 'morning',
      title: 'أذكار الصباح',
      subtitle: 'نور وبركة وحفظ في بداية يومك',
      icon: <Sun className="w-8 h-8 sm:w-9 sm:h-9 text-amber-600 dark:text-amber-300" />,
      lightBg: 'bg-gradient-to-br from-amber-50 via-orange-50/70 to-yellow-50 border-amber-200/80 hover:border-amber-300',
      darkBg: 'dark:from-amber-950/40 dark:via-orange-950/30 dark:to-stone-900 dark:border-amber-800/50',
      iconBoxBg: 'bg-amber-100/90 dark:bg-amber-900/50 shadow-inner',
      accentText: 'text-amber-900 dark:text-amber-200',
      progressColor: 'bg-amber-500',
    },
    {
      id: 'azkar-evening',
      categoryKey: 'evening',
      title: 'أذكار المساء',
      subtitle: 'سكينة وطمأنينة وحفظ حتى تصبح',
      icon: <Sunset className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-600 dark:text-indigo-300" />,
      lightBg: 'bg-gradient-to-br from-indigo-50 via-violet-50/70 to-blue-50 border-indigo-200/80 hover:border-indigo-300',
      darkBg: 'dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-stone-900 dark:border-indigo-800/50',
      iconBoxBg: 'bg-indigo-100/90 dark:bg-indigo-900/50 shadow-inner',
      accentText: 'text-indigo-900 dark:text-indigo-200',
      progressColor: 'bg-indigo-500',
    },
    {
      id: 'azkar-sleep',
      categoryKey: 'sleep',
      title: 'أذكار النوم والاستيقاظ',
      subtitle: 'نوم هادئ في حفظ الله ورعايته',
      icon: <Moon className="w-8 h-8 sm:w-9 sm:h-9 text-sky-600 dark:text-sky-300" />,
      lightBg: 'bg-gradient-to-br from-sky-50 via-cyan-50/70 to-blue-50 border-sky-200/80 hover:border-sky-300',
      darkBg: 'dark:from-sky-950/40 dark:via-cyan-950/30 dark:to-stone-900 dark:border-sky-800/50',
      iconBoxBg: 'bg-sky-100/90 dark:bg-sky-900/50 shadow-inner',
      accentText: 'text-sky-900 dark:text-sky-200',
      progressColor: 'bg-sky-500',
    },
    {
      id: 'azkar-prayer',
      categoryKey: 'prayer',
      title: 'أذكار بعد الصلاة',
      subtitle: 'التسبيحات والأدعية عقب كل صلاة',
      icon: <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600 dark:text-emerald-300" />,
      lightBg: 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-green-50 border-emerald-200/80 hover:border-emerald-300',
      darkBg: 'dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-stone-900 dark:border-emerald-800/50',
      iconBoxBg: 'bg-emerald-100/90 dark:bg-emerald-900/50 shadow-inner',
      accentText: 'text-emerald-900 dark:text-emerald-200',
      progressColor: 'bg-emerald-500',
    },
    {
      id: 'azkar-general',
      categoryKey: 'general',
      title: 'أذكار عامة ومأثورة',
      subtitle: 'تسابيح واستغفار وأذكار طوال اليوم',
      icon: <Compass className="w-8 h-8 sm:w-9 sm:h-9 text-teal-600 dark:text-teal-300" />,
      lightBg: 'bg-gradient-to-br from-teal-50 via-cyan-50/60 to-emerald-50 border-teal-200/80 hover:border-teal-300',
      darkBg: 'dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-stone-900 dark:border-teal-800/50',
      iconBoxBg: 'bg-teal-100/90 dark:bg-teal-900/50 shadow-inner',
      accentText: 'text-teal-900 dark:text-teal-200',
      progressColor: 'bg-teal-500',
    },
    {
      id: 'azkar-quranic',
      categoryKey: 'quranic',
      title: 'أدعية قرآنية',
      subtitle: 'أدعية الأنبياء والصالحين من القرآن',
      icon: <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-rose-600 dark:text-rose-300" />,
      lightBg: 'bg-gradient-to-br from-rose-50 via-pink-50/60 to-orange-50 border-rose-200/80 hover:border-rose-300',
      darkBg: 'dark:from-rose-950/40 dark:via-pink-950/30 dark:to-stone-900 dark:border-rose-800/50',
      iconBoxBg: 'bg-rose-100/90 dark:bg-rose-900/50 shadow-inner',
      accentText: 'text-rose-900 dark:text-rose-200',
      progressColor: 'bg-rose-500',
    },
    {
      id: 'azkar-prophetic',
      categoryKey: 'prophetic',
      title: 'أدعية نبوية ومواقف',
      subtitle: 'أدعية المنزل والطعام والسفر والفرج',
      icon: <HeartHandshake className="w-8 h-8 sm:w-9 sm:h-9 text-purple-600 dark:text-purple-300" />,
      lightBg: 'bg-gradient-to-br from-purple-50 via-fuchsia-50/60 to-indigo-50 border-purple-200/80 hover:border-purple-300',
      darkBg: 'dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-stone-900 dark:border-purple-800/50',
      iconBoxBg: 'bg-purple-100/90 dark:bg-purple-900/50 shadow-inner',
      accentText: 'text-purple-900 dark:text-purple-200',
      progressColor: 'bg-purple-500',
    },
    {
      id: 'azkar-ruqyah',
      categoryKey: 'ruqyah',
      title: 'الرقية الشرعية والشفاء',
      subtitle: 'آيات وأدعية التحصين والشفاء بإذن الله',
      icon: <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-600 dark:text-cyan-300" />,
      lightBg: 'bg-gradient-to-br from-cyan-50 via-sky-50/60 to-teal-50 border-cyan-200/80 hover:border-cyan-300',
      darkBg: 'dark:from-cyan-950/40 dark:via-sky-950/30 dark:to-stone-900 dark:border-cyan-800/50',
      iconBoxBg: 'bg-cyan-100/90 dark:bg-cyan-900/50 shadow-inner',
      accentText: 'text-cyan-900 dark:text-cyan-200',
      progressColor: 'bg-cyan-500',
    },
  ];

  const companionCards = [
    {
      id: 'quran-khatmah' as AppSectionId,
      title: 'المصحف الكامل والختمة',
      subtitle: 'سور القرآن الـ 114 محفوظة كاملة بدون إنترنت، مع البحث وجدول الختمة',
      icon: <BookMarked className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-700 dark:text-emerald-300" />,
      lightBg: 'bg-gradient-to-br from-emerald-100/80 via-teal-50 to-amber-50/70 border-emerald-300/80',
      darkBg: 'dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-stone-900 dark:border-emerald-700/60',
      iconBoxBg: 'bg-white/90 dark:bg-emerald-900/60 shadow-xs',
      accentText: 'text-emerald-950 dark:text-emerald-100',
    },
    {
      id: 'hadith-books' as AppSectionId,
      title: 'كتب الحديث الصحيحة',
      subtitle: 'البخاري ومسلم وأبو داود والترمذي والنسائي وابن ماجه ومالك والنووية ورياض الصالحين',
      icon: <Library className="w-8 h-8 sm:w-9 sm:h-9 text-amber-700 dark:text-amber-300" />,
      lightBg: 'bg-gradient-to-br from-amber-100/80 via-yellow-50 to-orange-50/70 border-amber-300/80',
      darkBg: 'dark:from-amber-950/60 dark:via-yellow-950/30 dark:to-stone-900 dark:border-amber-700/60',
      iconBoxBg: 'bg-white/90 dark:bg-amber-900/60 shadow-xs',
      accentText: 'text-amber-950 dark:text-amber-100',
    },
    {
      id: 'hijri-calendar' as AppSectionId,
      title: 'التقويم الهجري والمناسبات',
      subtitle: `اليوم: ${todayHijri.day} ${todayHijri.monthName} ${todayHijri.year} هـ · أيام الصيام`,
      icon: <Calendar className="w-8 h-8 sm:w-9 sm:h-9 text-indigo-700 dark:text-indigo-300" />,
      lightBg: 'bg-gradient-to-br from-indigo-100/80 via-blue-50 to-sky-50/70 border-indigo-300/80',
      darkBg: 'dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-stone-900 dark:border-indigo-700/60',
      iconBoxBg: 'bg-white/90 dark:bg-indigo-900/60 shadow-xs',
      accentText: 'text-indigo-950 dark:text-indigo-100',
    },
    {
      id: 'tasbeeh' as AppSectionId,
      title: 'السبحة الإلكترونية',
      subtitle: 'عداد التسبيح الملون السهل مع إضافة تسبيحاتك الخاصة',
      icon: <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-rose-600 dark:text-rose-300" />,
      lightBg: 'bg-gradient-to-br from-rose-100/80 via-pink-50 to-purple-50/70 border-rose-300/80',
      darkBg: 'dark:from-rose-950/60 dark:via-pink-950/40 dark:to-stone-900 dark:border-rose-700/60',
      iconBoxBg: 'bg-white/90 dark:bg-rose-900/60 shadow-xs',
      accentText: 'text-rose-950 dark:text-rose-100',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcoming Calm Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/80 to-amber-50/80 dark:from-emerald-950/50 dark:via-teal-950/40 dark:to-stone-900 border border-emerald-200/70 dark:border-emerald-800/50 p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs">
        <div className="space-y-2 text-center md:text-right">
          <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {todayHijri.day} {todayHijri.monthName} {todayHijri.year} هـ
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-amiri">
            أهلاً بك في واحة الأذكار والقرآن
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xl">
            اختر أيقونة القسم الذي تود قراءته ليبدأ معك الذكر خطوة بخطوة وينتقل تلقائياً للذكر التالي بكل سهولة
          </p>
        </div>

        {/* Friendly Stats Counter */}
        <div className="flex items-center gap-4 bg-white/85 dark:bg-stone-900/85 backdrop-blur-xs px-5 py-3.5 rounded-2xl border border-emerald-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">أيام متتالية</span>
              <span className="text-base font-bold text-stone-900 dark:text-white tabular-nums">
                {streakDays} {streakDays === 1 ? 'يوم' : 'أيام'}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-stone-200 dark:bg-stone-800" />

          <div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block">تسبيحات اليوم</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {todayCount}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Big Colorful Azkar Icons */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100">
            الأذكار اليومية (اضغط للبدء بالترتيب)
          </h2>
          {favoritesCount > 0 && (
            <button
              onClick={() => onSelectSection('azkar-favorites')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-200/80 transition"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>أذكاري المفضلة ({favoritesCount})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {azkarCards.map(card => {
            const total = card.categoryKey ? totalCountsByCategory[card.categoryKey] || 0 : 0;
            const completed = card.categoryKey ? completedCountsByCategory[card.categoryKey] || 0 : 0;
            const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            const isAllDone = total > 0 && completed >= total;

            return (
              <button
                key={card.id}
                onClick={() => onSelectSection(card.id)}
                className={`group text-right rounded-3xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] flex flex-col justify-between gap-4 min-h-[168px] ${card.lightBg} ${card.darkBg}`}
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${card.iconBoxBg}`}>
                    {card.icon}
                  </div>
                  {isAllDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>مكتمل</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-stone-500 dark:text-stone-400 tabular-nums">
                      {completed} / {total}
                    </span>
                  )}
                </div>

                <div className="space-y-1 w-full">
                  <h3 className={`text-xl font-bold ${card.accentText}`}>
                    {card.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1">
                    {card.subtitle}
                  </p>
                </div>

                {/* Gentle Progress Bar */}
                <div className="w-full h-2 rounded-full bg-white/70 dark:bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${card.progressColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Major Islamic Companion Sections (Quran/Khatmah, Hadith, Hijri Calendar, Tasbeeh) */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-stone-100 px-1">
          القرآن الكريم والحديث والتقويم والسبحة
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {companionCards.map(card => (
            <button
              key={card.id}
              onClick={() => onSelectSection(card.id)}
              className={`group text-right rounded-3xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] flex items-center gap-4 sm:gap-5 ${card.lightBg} ${card.darkBg}`}
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${card.iconBoxBg}`}>
                {card.icon}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className={`text-xl sm:text-2xl font-bold ${card.accentText}`}>
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
