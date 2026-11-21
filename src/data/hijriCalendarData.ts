export interface HijriDateInfo {
  day: number;
  monthNumber: number;
  monthName: string;
  year: number;
  gregorianDate: Date;
  isToday: boolean;
  isWhiteDay: boolean; // 13, 14, 15 of Hijri month
  isSunnahMondayThursday: boolean;
  occasion?: string;
}

export interface IslamicOccasion {
  id: string;
  title: string;
  hijriMonth: number;
  hijriDay: number;
  monthName: string;
  description: string;
  fastingNote?: string;
  badgeColor: string;
}

export const HIJRI_MONTH_NAMES = [
  'محرّم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوّال',
  'ذو القعدة',
  'ذو الحجة',
];

export const ISLAMIC_OCCASIONS: IslamicOccasion[] = [
  {
    id: 'new-hijri-year',
    title: 'رأس السنة الهجرية',
    hijriMonth: 1,
    hijriDay: 1,
    monthName: 'محرّم',
    description: 'بداية العام الهجري الجديد وتذكير بهجرة النبي ﷺ من مكة إلى المدينة المنورة.',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  },
  {
    id: 'ashura',
    title: 'يوم عاشوراء (وتاسوعاء)',
    hijriMonth: 1,
    hijriDay: 10,
    monthName: 'محرّم',
    description: 'اليوم الذي نجّى الله فيه سيدنا موسى عليه السلام، وصيامه يكفّر سنة ماضية.',
    fastingNote: 'يُستحب صيام يومي التاسع والعاشر من محرّم',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  {
    id: 'ramadan-start',
    title: 'غرة شهر رمضان المبارك',
    hijriMonth: 9,
    hijriDay: 1,
    monthName: 'رمضان',
    description: 'شهر القرآن والصيام والقيام والرحمات ومضاعفة الحسنات.',
    fastingNote: 'فرض صيام شهر رمضان المبارك',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  {
    id: 'laylat-al-qadr',
    title: 'العشر الأواخر وليلة القدر',
    hijriMonth: 9,
    hijriDay: 27,
    monthName: 'رمضان',
    description: 'ليلة خير من ألف شهر تنزل فيها الملائكة بالخير والبركة والسلام.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  },
  {
    id: 'eid-al-fitr',
    title: 'عيد الفطر السعيد',
    hijriMonth: 10,
    hijriDay: 1,
    monthName: 'شوّال',
    description: 'يوم الفرحة والجائزة بعد إتمام صيام شهر رمضان المبارك، ويلي العيد صيام الست من شوال.',
    fastingNote: 'يحرم صيام يوم العيد، ويُستحب صيام 6 أيام من شوال بعده',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  },
  {
    id: 'dhul-hijjah-ten',
    title: 'بداية العشر الأوائل من ذي الحجة',
    hijriMonth: 12,
    hijriDay: 1,
    monthName: 'ذو الحجة',
    description: 'أفضل أيام الدنيا التي يحب الله فيها العمل الصالح والذكر والتكبير.',
    fastingNote: 'يُستحب الإكثار من الصيام والذكر في التسع الأوائل',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  },
  {
    id: 'yawm-arafah',
    title: 'يوم عرفة المبارك',
    hijriMonth: 12,
    hijriDay: 9,
    monthName: 'ذو الحجة',
    description: 'ركن الحج الأعظم ويوم العتق من النار، وصيامه لغير الحاج يكفّر سنتين (سنة ماضية وسنة قادمة).',
    fastingNote: 'صيام مؤكد مستحب لغير الحاج',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  {
    id: 'eid-al-adha',
    title: 'عيد الأضحى المبارك',
    hijriMonth: 12,
    hijriDay: 10,
    monthName: 'ذو الحجة',
    description: 'عيد الأضحى الأكبر وأيام التشريق المباركة والذكر والشكر لله.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
];

// Extract Hijri parts from a Gregorian Date using Intl API with Umm al-Qura calendar
export function getHijriFromDate(date: Date): { day: number; monthNumber: number; monthName: string; year: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
    const monthNumber = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '1446', 10);
    const monthName = HIJRI_MONTH_NAMES[(monthNumber - 1) % 12] || HIJRI_MONTH_NAMES[0];
    return { day, monthNumber, monthName, year };
  } catch {
    // Fallback Kuwaiti/Tabular algorithm if islamic-umalqura is unsupported
    const jd = Math.floor(date.getTime() / 86400000) + 2440588;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j =
      Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
      Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 =
      l2 -
      Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
      29;
    const monthNumber = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * monthNumber) / 24);
    const year = 30 * n + j - 30;
    const monthName = HIJRI_MONTH_NAMES[(monthNumber - 1) % 12] || HIJRI_MONTH_NAMES[0];
    return { day, monthNumber, monthName, year };
  }
}

export function buildMonthlyCalendar(gregorianYear: number, gregorianMonth: number): HijriDateInfo[] {
  const daysInMonth = new Date(gregorianYear, gregorianMonth + 1, 0).getDate();
  const today = new Date();
  const result: HijriDateInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(gregorianYear, gregorianMonth, d, 12, 0, 0);
    const hijri = getHijriFromDate(dt);
    const isToday =
      dt.getFullYear() === today.getFullYear() &&
      dt.getMonth() === today.getMonth() &&
      dt.getDate() === today.getDate();

    const isWhiteDay = hijri.day === 13 || hijri.day === 14 || hijri.day === 15;
    const dayOfWeek = dt.getDay(); // 1 = Monday, 4 = Thursday
    const isSunnahMondayThursday = dayOfWeek === 1 || dayOfWeek === 4;

    const matchedOccasion = ISLAMIC_OCCASIONS.find(
      occ => occ.hijriMonth === hijri.monthNumber && occ.hijriDay === hijri.day
    );

    result.push({
      day: hijri.day,
      monthNumber: hijri.monthNumber,
      monthName: hijri.monthName,
      year: hijri.year,
      gregorianDate: dt,
      isToday,
      isWhiteDay,
      isSunnahMondayThursday,
      occasion: matchedOccasion?.title,
    });
  }

  return result;
}
