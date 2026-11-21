import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
import {
  buildMonthlyCalendar,
  getHijriFromDate,
  ISLAMIC_OCCASIONS,
} from '../data/hijriCalendarData';

interface HijriCalendarSectionProps {
  onBackHome: () => void;
}

const GREGORIAN_MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const HijriCalendarSection: React.FC<HijriCalendarSectionProps> = ({ onBackHome }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  const todayHijri = useMemo(() => getHijriFromDate(today), []);
  const monthDays = useMemo(() => buildMonthlyCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  // First day of week offset (0 = Sunday .. 6 = Saturday)
  const firstDayOffset = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Distinct Hijri months spanning this Gregorian month
  const hijriSpanLabel = useMemo(() => {
    if (monthDays.length === 0) return '';
    const first = monthDays[0];
    const last = monthDays[monthDays.length - 1];
    if (first.monthName === last.monthName && first.year === last.year) {
      return `${first.monthName} ${first.year} هـ`;
    }
    return `${first.monthName} - ${last.monthName} ${last.year} هـ`;
  }, [monthDays]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // White days in the currently viewed month
  const whiteDaysInView = useMemo(
    () => monthDays.filter(d => d.isWhiteDay),
    [monthDays]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-sky-50 to-teal-50/70 dark:from-indigo-950/50 dark:via-stone-900 dark:to-stone-900 border border-indigo-200/80 dark:border-indigo-800/50 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackHome}
            className="p-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-indigo-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-xs transition"
            title="العودة للرئيسية"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-indigo-950 dark:text-indigo-100 font-amiri">
              التقويم الهجري والميلادي والمناسبات الإسلامية
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              اليوم: <strong>{todayHijri.day} {todayHijri.monthName} {todayHijri.year} هـ</strong> · متابعة الأيام البيض وأيام الصيام المستحبة
            </p>
          </div>
        </div>

        <button
          onClick={handleGoToday}
          className="px-4 py-2.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
        >
          الانتقال لليوم الحالي
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main 2 Columns: Monthly Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
          {/* Month Switcher */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
            <button
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition"
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {hijriSpanLabel}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {GREGORIAN_MONTHS_AR[viewMonth]} {viewYear} م
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS_AR.map((dayName, i) => (
              <div
                key={dayName}
                className={`py-2 text-xs font-bold ${
                  i === 1 || i === 4
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : i === 5
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-stone-50/40 dark:bg-stone-950/20" />
            ))}

            {monthDays.map(dayInfo => {
              const gDay = dayInfo.gregorianDate.getDate();
              return (
                <div
                  key={gDay}
                  className={`relative h-16 sm:h-20 rounded-2xl border p-2 flex flex-col justify-between transition ${
                    dayInfo.isToday
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : dayInfo.isWhiteDay
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/70 text-stone-900 dark:text-stone-100'
                      : dayInfo.isSunnahMondayThursday
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50 text-stone-900 dark:text-stone-100'
                      : 'bg-stone-50/60 dark:bg-stone-950/40 border-stone-200/60 dark:border-stone-800/80 text-stone-900 dark:text-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Hijri Day (Large) */}
                    <span className="text-base sm:text-lg font-bold tabular-nums leading-none">
                      {dayInfo.day}
                    </span>

                    {/* Gregorian Day (Small) */}
                    <span
                      className={`text-[10px] sm:text-xs tabular-nums ${
                        dayInfo.isToday ? 'text-emerald-100' : 'text-stone-400 dark:text-stone-500'
                      }`}
                    >
                      {gDay}
                    </span>
                  </div>

                  {/* Bottom label for White Days or Today or Occasion */}
                  <div className="truncate">
                    {dayInfo.isToday ? (
                      <span className="text-[10px] font-bold text-amber-200 block truncate">
                        اليوم
                      </span>
                    ) : dayInfo.occasion ? (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block truncate">
                        {dayInfo.occasion}
                      </span>
                    ) : dayInfo.isWhiteDay ? (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block truncate">
                        الأيام البيض
                      </span>
                    ) : dayInfo.isSunnahMondayThursday ? (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block truncate">
                        صيام سنة
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 block truncate">
                        {dayInfo.monthName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-700 inline-block" />
              <span>اليوم الحالي</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-200 border border-amber-400 inline-block" />
              <span>الأيام البيض (13 و14 و15 هـ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-300 inline-block" />
              <span>صيام الإثنين والخميس</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sunnah Fasting & Islamic Occasions */}
        <div className="space-y-5">
          {/* White Days of Current Month */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50/70 to-orange-50/60 dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-900 border border-amber-200/80 dark:border-amber-800/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-base">
              <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3>أيام الصيام البيض في هذا الشهر</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              أوصى النبي ﷺ بصيام ثلاثة أيام من كل شهر هجري (13 و14 و15)، وصيامها كصيام الدهر كله:
            </p>
            <div className="space-y-2 pt-1">
              {whiteDaysInView.map((wd, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/85 dark:bg-stone-900/80 border border-amber-200/60 dark:border-stone-800 px-3.5 py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {wd.day} {wd.monthName} {wd.year} هـ
                  </span>
                  <span className="text-stone-500 dark:text-stone-400">
                    يوافق {wd.gregorianDate.getDate()} {GREGORIAN_MONTHS_AR[wd.gregorianDate.getMonth()]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Major Islamic Occasions */}
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-stone-900 dark:text-stone-100">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3>أهم المناسبات والمواسم الإسلامية</h3>
            </div>

            <div className="space-y-3">
              {ISLAMIC_OCCASIONS.map(occ => (
                <div
                  key={occ.id}
                  className="rounded-2xl bg-stone-50/80 dark:bg-stone-950/50 border border-stone-200/60 dark:border-stone-800 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {occ.title}
                    </h4>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {occ.hijriDay} {occ.monthName}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {occ.description}
                  </p>
                  {occ.fastingNote && (
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 pt-0.5">
                      • {occ.fastingNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
