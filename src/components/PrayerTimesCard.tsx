import React, { useState, useMemo } from 'react';
import { Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface CityPrayerInfo {
  name: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const CITIES: CityPrayerInfo[] = [
  { name: 'مكة المكرمة', fajr: '05:08', sunrise: '06:24', dhuhr: '12:18', asr: '15:37', maghrib: '18:11', isha: '19:41' },
  { name: 'المدينة المنورة', fajr: '05:09', sunrise: '06:27', dhuhr: '12:19', asr: '15:38', maghrib: '18:10', isha: '19:40' },
  { name: 'القدس الشريف', fajr: '04:49', sunrise: '06:12', dhuhr: '11:47', asr: '15:02', maghrib: '17:22', isha: '18:42' },
  { name: 'القاهرة', fajr: '04:52', sunrise: '06:16', dhuhr: '11:51', asr: '15:05', maghrib: '17:26', isha: '18:45' },
  { name: 'الرياض', fajr: '04:47', sunrise: '06:05', dhuhr: '11:53', asr: '15:13', maghrib: '17:41', isha: '19:11' },
  { name: 'عمّان', fajr: '04:48', sunrise: '06:10', dhuhr: '11:46', asr: '15:01', maghrib: '17:21', isha: '18:41' },
  { name: 'دبي', fajr: '05:14', sunrise: '06:30', dhuhr: '12:21', asr: '15:42', maghrib: '18:11', isha: '19:26' },
  { name: 'إسطنبول', fajr: '05:42', sunrise: '07:12', dhuhr: '12:54', asr: '15:53', maghrib: '18:27', isha: '19:50' },
  { name: 'الرباط', fajr: '05:48', sunrise: '07:11', dhuhr: '12:47', asr: '15:58', maghrib: '18:23', isha: '19:42' },
];

export const PrayerTimesCard: React.FC = () => {
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const city = CITIES[selectedCityIndex];

  // Calculate current prayer period
  const currentPeriod = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const parseToMins = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const f = parseToMins(city.fajr);
    const s = parseToMins(city.sunrise);
    const d = parseToMins(city.dhuhr);
    const a = parseToMins(city.asr);
    const m = parseToMins(city.maghrib);
    const i = parseToMins(city.isha);

    if (currentMins >= f && currentMins < s) return { current: 'الفجر', recommended: 'أذكار الصباح' };
    if (currentMins >= s && currentMins < d) return { current: 'الضحى', recommended: 'أذكار الصباح وجوامع الكلم' };
    if (currentMins >= d && currentMins < a) return { current: 'الظهر', recommended: 'أذكار بعد الصلاة' };
    if (currentMins >= a && currentMins < m) return { current: 'العصر', recommended: 'أذكار المساء' };
    if (currentMins >= m && currentMins < i) return { current: 'المغرب', recommended: 'أذكار المساء' };
    return { current: 'العشاء والليل', recommended: 'أذكار النوم والاستغفار' };
  }, [city]);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* City and Recommendation */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <MapPin className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              <select
                value={selectedCityIndex}
                onChange={e => setSelectedCityIndex(Number(e.target.value))}
                className="bg-transparent font-medium text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
              >
                {CITIES.map((c, idx) => (
                  <option key={c.name} value={idx} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
              الوقت الحالي: <span className="text-emerald-800 dark:text-emerald-400 font-bold">{currentPeriod.current}</span> · المقترح: <span className="font-bold text-amber-700 dark:text-amber-400">{currentPeriod.recommended}</span>
            </p>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <span>مواقيت الصلوات</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded prayer times row */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center animate-fade-in">
          {[
            { label: 'الفجر', time: city.fajr },
            { label: 'الشروق', time: city.sunrise },
            { label: 'الظهر', time: city.dhuhr },
            { label: 'العصر', time: city.asr },
            { label: 'المغرب', time: city.maghrib },
            { label: 'العشاء', time: city.isha },
          ].map(p => (
            <div key={p.label} className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <span className="block text-[11px] text-stone-500 dark:text-stone-400 font-medium">{p.label}</span>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 tabular-nums">{p.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
