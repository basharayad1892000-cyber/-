import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Search,
  Sparkles,
  Award,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  X,
  BookOpen,
  CornerDownLeft,
} from 'lucide-react';
import {
  SURAHS_LIST,
  KHATMAH_30_DAYS,
  OFFLINE_SURAH_AYAHS,
  FEATURED_QURAN_AYAHS_INDEX,
  QuranAyahSearchResult,
  SurahMeta,
} from '../data/quranMeta';
import {
  matchesArabicQuery,
  normalizeArabicForSearch,
  normalizeArabicSkeleton,
  stripLeadingBismillah,
} from '../utils/arabicSearch';

interface QuranKhatmahSectionProps {
  onBackHome: () => void;
}

interface QuranBookmark {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
}

interface IndexedQuranAyah {
  numberInSurah: number;
  text: string;
  juz: number;
  page?: number;
  norm: string;
  skel: string;
  normNext: string;
  skelNext: string;
}

const STORAGE_KEYS = {
  KHATMAH_COMPLETED_DAYS: 'azkar_khatmah_days_v1',
  FRIDAY_WIRD_COMPLETED: 'azkar_friday_wird_surahs_v1',
  MEMORIZED_SURAHS: 'azkar_memorized_surahs_v1',
  READ_SURAHS: 'azkar_read_surahs_v1',
  QURAN_BOOKMARK: 'azkar_quran_bookmark_v1',
  SURAH_CACHE_PREFIX: 'azkar_surah_cache_v1_',
};

const FRIDAY_NIGHT_WIRD_SURAHS: {
  number: number;
  name: string;
  titleBadge: string;
  virtue: string;
}[] = [
  {
    number: 18,
    name: 'الكهف',
    titleBadge: 'نور ما بين الجمعتين',
    virtue: 'قال ﷺ: «من قرأ سورة الكهف في يوم الجمعة أضاء له من النور ما بين الجمعتين».',
  },
  {
    number: 36,
    name: 'يس',
    titleBadge: 'قلب القرآن',
    virtue: 'تُقرأ في ليلة الجمعة التماساً للبركة والمغفرة وتفريج الهموم والشدائد.',
  },
  {
    number: 56,
    name: 'الواقعة',
    titleBadge: 'سورة الغنى واليقين',
    virtue: 'تذكير عظيم بأحوال الآخرة وأصناف العباد، وكان السلف يواظبون على تلاوتها.',
  },
  {
    number: 44,
    name: 'الدخان',
    titleBadge: 'الليلة المباركة',
    virtue: 'تتضمن ذكر الليلة المباركة وعظمة القرآن الكريم ومغفرة الذنوب.',
  },
  {
    number: 67,
    name: 'الملك',
    titleBadge: 'المنجية من عذاب القبر',
    virtue: 'قال ﷺ: «إن سورة من القرآن ثلاثون آية شفعت لرجل حتى غفر له، وهي سورة تبارك الذي بيده الملك».',
  },
];

interface IndexedQuranSurah {
  number: number;
  name: string;
  cleanName: string;
  ayahs: IndexedQuranAyah[];
}

// Module-level cache for full Quran Surahs loaded from bundled /data/quran-full.json
let fullQuranSessionCache: IndexedQuranSurah[] | null = null;

let fullQuranLoadPromise: Promise<IndexedQuranSurah[]> | null = null;

function loadBundledFullQuran(): Promise<IndexedQuranSurah[]> {
  if (fullQuranSessionCache) {
    return Promise.resolve(fullQuranSessionCache);
  }
  if (fullQuranLoadPromise) {
    return fullQuranLoadPromise;
  }
  const promise = fetch('/data/quran-full.json')
    .then(res => res.json())
    .then((raw: { number: number; name: string; ayahs: { n: number; t: string; j: number; p?: number }[] }[]) => {
      if (Array.isArray(raw) && raw.length > 0) {
        fullQuranSessionCache = raw.map(s => {
          const meta = SURAHS_LIST.find(item => item.number === s.number);
          const cleanName = meta ? meta.name : s.name;
          const rawAyahs = s.ayahs || [];
          const cleanedTexts = rawAyahs.map(a => stripLeadingBismillah(a.t, s.number, a.n));
          const norms = cleanedTexts.map(t => normalizeArabicForSearch(t));
          const skels = cleanedTexts.map(t => normalizeArabicSkeleton(t));

          return {
            number: s.number,
            name: s.name,
            cleanName,
            ayahs: rawAyahs.map((a, idx) => ({
              numberInSurah: a.n,
              text: cleanedTexts[idx],
              juz: a.j || meta?.juz || 1,
              page: a.p || meta?.startPage,
              norm: norms[idx],
              skel: skels[idx],
              normNext: idx + 1 < norms.length ? `${norms[idx]} ${norms[idx + 1]}` : norms[idx],
              skelNext: idx + 1 < skels.length ? `${skels[idx]} ${skels[idx + 1]}` : skels[idx],
            })),
          };
        });
        return fullQuranSessionCache;
      }
      throw new Error('Invalid local quran json');
    });
  fullQuranLoadPromise = promise;
  return promise;
}

function searchAcrossFullQuranCache(
  surahsData: IndexedQuranSurah[],
  rawQuery: string,
  limit = 100
): QuranAyahSearchResult[] {
  const q = rawQuery.trim();
  if (!q) return [];

  const exactMatches: QuranAyahSearchResult[] = [];
  const secondaryMatches: QuranAyahSearchResult[] = [];
  const seen = new Set<string>();

  const normQ = normalizeArabicForSearch(q);
  const skelQ = normalizeArabicSkeleton(q);

  // 1. First check Featured Ayahs for special titles like "آية الكرسي" or "أواخر البقرة"
  for (const item of FEATURED_QURAN_AYAHS_INDEX) {
    if (
      (item.label && matchesArabicQuery(item.label, q)) ||
      matchesArabicQuery(item.text, q)
    ) {
      const key = `${item.surahNumber}:${item.numberInSurah}`;
      if (!seen.has(key)) {
        seen.add(key);
        exactMatches.push(item);
      }
    }
  }

  // 2. Check all 6,236 Ayahs in the 114 Surahs
  for (const s of surahsData) {
    for (const a of s.ayahs) {
      const key = `${s.number}:${a.numberInSurah}`;
      if (seen.has(key)) continue;

      const isDirectPhrase =
        (normQ.length > 0 && a.norm.includes(normQ)) ||
        (skelQ.length >= 3 && a.skel.includes(skelQ));

      if (
        isDirectPhrase ||
        matchesArabicQuery(a.text, q, {
          norm: a.norm,
          skel: a.skel,
          normNext: a.normNext,
          skelNext: a.skelNext,
        }) ||
        matchesArabicQuery(`سورة ${s.cleanName} ${a.numberInSurah}`, q)
      ) {
        seen.add(key);
        const resultItem: QuranAyahSearchResult = {
          surahNumber: s.number,
          surahName: s.cleanName,
          numberInSurah: a.numberInSurah,
          text: a.text,
          juz: a.juz,
          page: a.page,
        };
        if (isDirectPhrase) {
          exactMatches.push(resultItem);
        } else {
          secondaryMatches.push(resultItem);
        }
        if (exactMatches.length + secondaryMatches.length >= limit) break;
      }
    }
    if (exactMatches.length + secondaryMatches.length >= limit) break;
  }

  return [...exactMatches, ...secondaryMatches].slice(0, limit);
}

const QUICK_AYAH_SEARCH_CHIPS = [
  'آية الكرسي',
  'ربنا آتنا في الدنيا حسنة',
  'إن مع العسر يسرا',
  'ألا بذكر الله تطمئن القلوب',
  'لا إله إلا أنت سبحانك',
  'رب اشرح لي صدري',
  'لا تقنطوا من رحمة الله',
  'قل هو الله أحد',
];

export const QuranKhatmahSection: React.FC<QuranKhatmahSectionProps> = ({ onBackHome }) => {
  const [subTab, setSubTab] = useState<'mushaf' | 'ayah-search' | 'khatmah' | 'friday-wird' | 'memorization'>('mushaf');
  const [fridayWirdActiveSurahNum, setFridayWirdActiveSurahNum] = useState<number>(18);
  const [searchQuery, setSearchQuery] = useState('');
  const [ayahSearchQuery, setAyahSearchQuery] = useState('');
  const [inSurahQuery, setInSurahQuery] = useState('');
  const [activeSurah, setActiveSurah] = useState<SurahMeta | null>(null);
  const [surahAyahs, setSurahAyahs] = useState<{ numberInSurah: number; text: string }[]>([]);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [isQuranPreloaded, setIsQuranPreloaded] = useState<boolean>(() => Boolean(fullQuranSessionCache));

  // Full Quran search states
  const [isSearchingFullQuran, setIsSearchingFullQuran] = useState(false);
  const [remoteAyahResults, setRemoteAyahResults] = useState<QuranAyahSearchResult[]>([]);
  const ayahRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  // Preload bundled offline Quran dataset (all 114 surahs) immediately on mount
  useEffect(() => {
    let mounted = true;
    loadBundledFullQuran()
      .then(() => {
        if (mounted) setIsQuranPreloaded(true);
      })
      .catch(() => {
        // Fallback to OFFLINE_SURAH_AYAHS if needed
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Khatmah completed days (1..30)
  const [completedKhatmahDays, setCompletedKhatmahDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.KHATMAH_COMPLETED_DAYS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Friday Night Wird completed surahs (18, 36, 56, 44, 67)
  const [completedFridayWird, setCompletedFridayWird] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FRIDAY_WIRD_COMPLETED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Memorized surahs (1..114)
  const [memorizedSurahs, setMemorizedSurahs] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMORIZED_SURAHS);
      return saved ? JSON.parse(saved) : [1, 112, 113, 114];
    } catch {
      return [1, 112, 113, 114];
    }
  });

  // Read surahs (1..114)
  const [readSurahs, setReadSurahs] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READ_SURAHS);
      return saved ? JSON.parse(saved) : [1];
    } catch {
      return [1];
    }
  });

  // Bookmark
  const [bookmark, setBookmark] = useState<QuranBookmark | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QURAN_BOOKMARK);
      return saved ? JSON.parse(saved) : { surahNumber: 18, surahName: 'الكهف', ayahNumber: 1 };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KHATMAH_COMPLETED_DAYS, JSON.stringify(completedKhatmahDays));
  }, [completedKhatmahDays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRIDAY_WIRD_COMPLETED, JSON.stringify(completedFridayWird));
  }, [completedFridayWird]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMORIZED_SURAHS, JSON.stringify(memorizedSurahs));
  }, [memorizedSurahs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.READ_SURAHS, JSON.stringify(readSurahs));
  }, [readSurahs]);

  useEffect(() => {
    if (bookmark) {
      localStorage.setItem(STORAGE_KEYS.QURAN_BOOKMARK, JSON.stringify(bookmark));
    }
  }, [bookmark]);

  // Load Surah ayahs from bundled local dataset when a Surah is selected (100% offline)
  useEffect(() => {
    if (!activeSurah) return;

    const num = activeSurah.number;
    setFetchError(null);
    setInSurahQuery('');

    // 1. Check session full-Quran memory cache (all 114 surahs)
    if (fullQuranSessionCache) {
      const foundSurah = fullQuranSessionCache.find(s => s.number === num);
      if (foundSurah && foundSurah.ayahs.length > 0) {
        setSurahAyahs(foundSurah.ayahs.map(a => ({ numberInSurah: a.numberInSurah, text: a.text })));
        setLoadingSurah(false);
        return;
      }
    }

    // 2. Check built-in quick offline surahs
    if (OFFLINE_SURAH_AYAHS[num]) {
      setSurahAyahs(OFFLINE_SURAH_AYAHS[num]);
      setLoadingSurah(false);
      return;
    }

    // 3. Load from bundled local /data/quran-full.json
    let isMounted = true;
    setLoadingSurah(true);
    loadBundledFullQuran()
      .then(allSurahs => {
        if (!isMounted) return;
        const found = allSurahs.find(s => s.number === num);
        if (found && found.ayahs.length > 0) {
          setSurahAyahs(found.ayahs.map(a => ({ numberInSurah: a.numberInSurah, text: a.text })));
        } else {
          setFetchError('تعذّر قراءة بيانات السورة المحلية.');
        }
        setLoadingSurah(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setFetchError('تعذّر تحميل بيانات السورة المحلية.');
        setLoadingSurah(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSurah]);

  // Smooth scroll to highlighted ayah once surahAyahs are loaded
  useEffect(() => {
    if (!activeSurah || !highlightedAyah || loadingSurah || surahAyahs.length === 0) return;
    const timer = window.setTimeout(() => {
      const el = ayahRefs.current[highlightedAyah];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeSurah, highlightedAyah, loadingSurah, surahAyahs]);

  // Local Ayah Search across featured ayahs and built-in offline surahs (instant fallback while full JSON loads)
  const localAyahSearchResults = useMemo(() => {
    const q = ayahSearchQuery.trim();
    if (!q) return FEATURED_QURAN_AYAHS_INDEX.slice(0, 12);

    if (fullQuranSessionCache) {
      return searchAcrossFullQuranCache(fullQuranSessionCache, q, 100);
    }

    const results: QuranAyahSearchResult[] = [];
    const seen = new Set<string>();

    const addResult = (item: QuranAyahSearchResult) => {
      const key = `${item.surahNumber}:${item.numberInSurah}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
    };

    const numMatch = q.match(/^(\d+)$/);
    if (numMatch) {
      const ayahNum = parseInt(numMatch[1], 10);
      FEATURED_QURAN_AYAHS_INDEX.forEach(item => {
        if (item.numberInSurah === ayahNum) addResult(item);
      });
    }

    FEATURED_QURAN_AYAHS_INDEX.forEach(item => {
      if (
        matchesArabicQuery(item.text, q) ||
        (item.label && matchesArabicQuery(item.label, q)) ||
        matchesArabicQuery(`سورة ${item.surahName} ${item.numberInSurah}`, q)
      ) {
        addResult(item);
      }
    });

    Object.entries(OFFLINE_SURAH_AYAHS).forEach(([surahNumStr, ayahs]) => {
      const surahNum = Number(surahNumStr);
      const meta = SURAHS_LIST.find(s => s.number === surahNum);
      if (!meta) return;
      ayahs.forEach(a => {
        if (matchesArabicQuery(a.text, q)) {
          addResult({
            surahNumber: surahNum,
            surahName: meta.name,
            numberInSurah: a.numberInSurah,
            text: a.text,
            juz: meta.juz,
            page: meta.startPage,
          });
        }
      });
    });

    return results.slice(0, 60);
  }, [ayahSearchQuery, isQuranPreloaded]);

  // Full Quran Search across all 114 Surahs using local bundled dataset
  useEffect(() => {
    const q = ayahSearchQuery.trim();
    if (!q) {
      setRemoteAyahResults([]);
      setIsSearchingFullQuran(false);
      return;
    }

    if (fullQuranSessionCache) {
      setRemoteAyahResults(searchAcrossFullQuranCache(fullQuranSessionCache, q, 100));
      setIsSearchingFullQuran(false);
      return;
    }

    let isCancelled = false;
    setIsSearchingFullQuran(true);
    loadBundledFullQuran()
      .then(allSurahs => {
        if (isCancelled) return;
        const matches = searchAcrossFullQuranCache(allSurahs, q, 100);
        setRemoteAyahResults(matches);
        setIsSearchingFullQuran(false);
      })
      .catch(() => {
        if (isCancelled) return;
        setIsSearchingFullQuran(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [ayahSearchQuery, isQuranPreloaded]);

  // Combined deduplicated Ayah search results (local + full 114 surahs)
  const combinedAyahResults = useMemo(() => {
    const map = new Map<string, QuranAyahSearchResult>();
    remoteAyahResults.forEach(item => {
      map.set(`${item.surahNumber}:${item.numberInSurah}`, item);
    });
    localAyahSearchResults.forEach(item => {
      const key = `${item.surahNumber}:${item.numberInSurah}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  }, [localAyahSearchResults, remoteAyahResults]);

  // Also compute instant Ayah search results when user types inside the main Mushaf search bar (`searchQuery`)
  const mushafBarAyahResults = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 2 || !fullQuranSessionCache) return [];
    return searchAcrossFullQuranCache(fullQuranSessionCache, q, 25);
  }, [searchQuery, isQuranPreloaded]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return SURAHS_LIST;
    const q = searchQuery.trim();
    const normQ = normalizeArabicForSearch(q);
    return SURAHS_LIST.filter(
      s =>
        normalizeArabicForSearch(s.name).includes(normQ) ||
        normalizeArabicForSearch(`سورة ${s.name}`).includes(normQ) ||
        s.englishName.toLowerCase().includes(q.toLowerCase()) ||
        String(s.number) === q
    );
  }, [searchQuery]);

  // Jump directly to a specific Surah & Ayah and highlight it
  const handleNavigateToAyah = (surahNumber: number, ayahNumber: number) => {
    const targetSurah = SURAHS_LIST.find(s => s.number === surahNumber);
    if (!targetSurah) return;
    setHighlightedAyah(ayahNumber);
    setActiveSurah(targetSurah);
    setSubTab('mushaf');
  };

  const toggleKhatmahDay = (day: number) => {
    setCompletedKhatmahDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleFridayWirdSurah = (surahNum: number) => {
    setCompletedFridayWird(prev =>
      prev.includes(surahNum) ? prev.filter(n => n !== surahNum) : [...prev, surahNum]
    );
  };

  const toggleMemorizedSurah = (num: number) => {
    setMemorizedSurahs(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const toggleReadSurah = (num: number) => {
    setReadSurahs(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const khatmahPct = Math.round((completedKhatmahDays.length / 30) * 100);
  const fridayWirdPct = Math.round((completedFridayWird.length / FRIDAY_NIGHT_WIRD_SURAHS.length) * 100);
  const memorizedPct = Math.round((memorizedSurahs.length / 114) * 100);

  // Ayahs for the active Friday Night Wird Surah (from fullQuranSessionCache or OFFLINE_SURAH_AYAHS)
  const fridayWirdActiveAyahs = useMemo(() => {
    if (fullQuranSessionCache) {
      const found = fullQuranSessionCache.find(s => s.number === fridayWirdActiveSurahNum);
      if (found && found.ayahs.length > 0) {
        return found.ayahs.map(a => ({ numberInSurah: a.numberInSurah, text: a.text }));
      }
    }
    return OFFLINE_SURAH_AYAHS[fridayWirdActiveSurahNum] || [];
  }, [fridayWirdActiveSurahNum, isQuranPreloaded]);

  // Filter ayahs inside currently open Surah if user types in `inSurahQuery`
  const displayedSurahAyahs = useMemo(() => {
    const q = inSurahQuery.trim();
    if (!q) return surahAyahs;
    if (/^\d+$/.test(q)) {
      const targetNum = parseInt(q, 10);
      return surahAyahs.filter(a => a.numberInSurah === targetNum);
    }
    return surahAyahs.filter(a => matchesArabicQuery(a.text, q));
  }, [surahAyahs, inSurahQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/70 dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-stone-900 border border-emerald-200/80 dark:border-emerald-800/50 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => {
              if (activeSurah) {
                setActiveSurah(null);
                setHighlightedAyah(null);
              } else {
                onBackHome();
              }
            }}
            className="p-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-xs transition"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-950 dark:text-emerald-100 font-amiri">
              المصحف الكامل والختمة والبحث عن آية
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
              تلاوة السور الكاملة، البحث الفوري عن أي آية في القرآن الكريم، وجدول الختمة والحفظ
            </p>
          </div>
        </div>

        {/* Sub-Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/90 dark:bg-stone-900/90 rounded-2xl border border-emerald-200/60 dark:border-stone-800 self-start lg:self-auto">
          <button
            onClick={() => {
              setSubTab('mushaf');
              setActiveSurah(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              subTab === 'mushaf'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            المصحف الشريف
          </button>

          <button
            onClick={() => {
              setSubTab('ayah-search');
              setActiveSurah(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'ayah-search'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>البحث عن آية</span>
          </button>

          <button
            onClick={() => {
              setSubTab('khatmah');
              setActiveSurah(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              subTab === 'khatmah'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            جدول الختمة ({completedKhatmahDays.length}/30)
          </button>

          <button
            onClick={() => {
              setSubTab('friday-wird');
              setActiveSurah(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'friday-wird'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ورد ليلة الجمعة ({completedFridayWird.length}/5)</span>
          </button>

          <button
            onClick={() => {
              setSubTab('memorization');
              setActiveSurah(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              subTab === 'memorization'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            سجل الحفظ ({memorizedSurahs.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE SURAH READER */}
      {subTab === 'mushaf' && activeSurah ? (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4">
            <button
              onClick={() => {
                setActiveSurah(null);
                setHighlightedAyah(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-200 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>فهرس السور</span>
            </button>

            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-200 font-amiri">
                سورة {activeSurah.name}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {activeSurah.revelationType} · {activeSurah.ayahs} آية · الجزء {activeSurah.juz} · صفحة {activeSurah.startPage}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleReadSurah(activeSurah.number)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  readSurahs.includes(activeSurah.number)
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{readSurahs.includes(activeSurah.number) ? 'تمت قراءتها' : 'تحديد كمقروءة'}</span>
              </button>
            </div>
          </div>

          {/* In-Surah Quick Ayah Filter / Jump Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inSurahQuery}
                onChange={e => setInSurahQuery(e.target.value)}
                placeholder={`ابحث عن كلمة أو رقم آية داخل سورة ${activeSurah.name}...`}
                className="w-full pr-10 pl-9 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:border-emerald-500"
              />
              {inSurahQuery && (
                <button
                  onClick={() => setInSurahQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {highlightedAyah && (
              <div className="flex items-center justify-between sm:justify-end gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                <span className="font-bold">تم الانتقال إلى الآية ({highlightedAyah})</span>
                <button
                  onClick={() => setHighlightedAyah(null)}
                  className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white font-bold px-1"
                  title="إلغاء التمييز"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Mushaf Page Container */}
          <div className="rounded-3xl bg-[#fffdf7] dark:bg-stone-900 border-2 border-amber-200/80 dark:border-stone-800 p-6 sm:p-10 shadow-sm space-y-6">
            {activeSurah.number !== 1 && activeSurah.number !== 9 && !inSurahQuery && (
              <div className="text-center pb-4 border-b border-amber-200/50 dark:border-stone-800">
                <p className="text-2xl sm:text-3xl font-amiri font-bold text-emerald-900 dark:text-emerald-300">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
              </div>
            )}

            {loadingSurah ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  جاري تحميل آيات سورة {activeSurah.name} بالرسم العثماني...
                </p>
              </div>
            ) : fetchError ? (
              <div className="py-10 text-center space-y-3 max-w-md mx-auto">
                <p className="text-sm text-amber-800 dark:text-amber-300">{fetchError}</p>
              </div>
            ) : displayedSurahAyahs.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  لا توجد آية مطابقة لـ «{inSurahQuery}» في سورة {activeSurah.name}
                </p>
                <button
                  onClick={() => {
                    setAyahSearchQuery(inSurahQuery);
                    setActiveSurah(null);
                    setSubTab('ayah-search');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold mt-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>البحث عن «{inSurahQuery}» في جميع سور القرآن الكريم</span>
                </button>
              </div>
            ) : (
              <div className="text-right leading-[2.6] sm:leading-[2.8] text-2xl sm:text-3xl font-amiri text-stone-900 dark:text-stone-100 select-text">
                {displayedSurahAyahs.map(ayah => {
                  const isBookmarked =
                    bookmark?.surahNumber === activeSurah.number &&
                    bookmark?.ayahNumber === ayah.numberInSurah;
                  const isHighlighted = highlightedAyah === ayah.numberInSurah;
                  const cleanText =
                    activeSurah.number !== 1 &&
                    ayah.numberInSurah === 1 &&
                    ayah.text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')
                      ? ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim()
                      : ayah.text;

                  return (
                    <span
                      key={ayah.numberInSurah}
                      ref={el => {
                        ayahRefs.current[ayah.numberInSurah] = el;
                      }}
                      onClick={() => {
                        setBookmark({
                          surahNumber: activeSurah.number,
                          surahName: activeSurah.name,
                          ayahNumber: ayah.numberInSurah,
                        });
                        setHighlightedAyah(ayah.numberInSurah);
                      }}
                      title="اضغط لحفظ العلامة المرجعية عند هذه الآية"
                      className={`inline cursor-pointer rounded-xl px-1.5 py-0.5 transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-emerald-200/90 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500 shadow-xs'
                          : isBookmarked
                          ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100'
                          : 'hover:bg-amber-100/60 dark:hover:bg-stone-800'
                      }`}
                    >
                      {cleanText}{' '}
                      <span className="inline-flex items-center justify-center mx-1 px-2 py-0.5 text-base font-cairo font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                        {ayah.numberInSurah}
                      </span>{' '}
                    </span>
                  );
                })}
              </div>
            )}

            <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-4 border-t border-amber-200/50 dark:border-stone-800">
              ملاحظة: اضغط على أي آية لحفظ علامة التوقف (العلامة المرجعية) عندها
            </p>
          </div>

          {/* Previous / Next Surah Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={activeSurah.number <= 1}
              onClick={() => {
                const prev = SURAHS_LIST.find(s => s.number === activeSurah.number - 1);
                if (prev) {
                  setHighlightedAyah(null);
                  setActiveSurah(prev);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السورة السابقة</span>
            </button>

            <button
              disabled={activeSurah.number >= 114}
              onClick={() => {
                const next = SURAHS_LIST.find(s => s.number === activeSurah.number + 1);
                if (next) {
                  setHighlightedAyah(null);
                  setActiveSurah(next);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>السورة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* VIEW 2: MUSHAF INDEX (114 SURAHS) */}
      {subTab === 'mushaf' && !activeSurah ? (
        <div className="space-y-5">
          {/* Saved Bookmark Quick Card */}
          {bookmark && (
            <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                  <Bookmark className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold block">
                    آخر علامة محفوظة في المصحف
                  </span>
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    سورة {bookmark.surahName} — الآية {bookmark.ayahNumber}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleNavigateToAyah(bookmark.surahNumber, bookmark.ayahNumber)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
              >
                متابعة القراءة من العلامة
              </button>
            </div>
          )}

          {/* Unified Search Bar: Filter Surahs & Instant Ayah Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم السورة أو اكتب أي كلمة أو جزء من آية للبحث الفوري في القرآن..."
                className="w-full pr-12 pl-10 py-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  setAyahSearchQuery(searchQuery.trim());
                }
                setSubTab('ayah-search');
              }}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>البحث المتقدم عن آية</span>
            </button>
          </div>

          {/* 114 Surahs Grid (shown when matching Surahs exist) */}
          {filteredSurahs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSurahs.map(surah => {
                const isMemorized = memorizedSurahs.includes(surah.number);
                const isRead = readSurahs.includes(surah.number);

                return (
                  <button
                    key={surah.number}
                    onClick={() => {
                      setHighlightedAyah(null);
                      setActiveSurah(surah);
                    }}
                    className="text-right rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-600 p-4 transition-all hover:-translate-y-0.5 hover:shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 font-amiri">
                          سورة {surah.name}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {surah.revelationType} · {surah.ayahs} آية · جزء {surah.juz}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      <span className="text-stone-400 tabular-nums">ص {surah.startPage}</span>
                      {isMemorized ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">محفوظة</span>
                      ) : isRead ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">مقروءة</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Instant Matching Ayahs directly inside the Mushaf tab when user searches */}
          {searchQuery.trim().length >= 2 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>
                    الآيات المطابقة لـ «{searchQuery}» في القرآن الكريم ({mushafBarAyahResults.length} آية)
                  </span>
                </h3>
                {mushafBarAyahResults.length > 0 && (
                  <button
                    onClick={() => {
                      setAyahSearchQuery(searchQuery.trim());
                      setSubTab('ayah-search');
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    عرض جميع النتائج ({mushafBarAyahResults.length}+)
                  </button>
                )}
              </div>

              {mushafBarAyahResults.length === 0 ? (
                filteredSurahs.length === 0 ? (
                  <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 text-center space-y-2">
                    <BookOpen className="w-9 h-9 text-stone-400 mx-auto" />
                    <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                      لم يتم العثور على سورة أو آية مطابقة لـ «{searchQuery}»
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      تأكد من إملاء الكلمة أو جرّب كتابة كلمة مميزة من الآية الكريمة
                    </p>
                  </div>
                ) : null
              ) : (
                <div className="space-y-3">
                  {mushafBarAyahResults.map(item => (
                    <div
                      key={`mushaf-hit-${item.surahNumber}:${item.numberInSurah}`}
                      onClick={() => handleNavigateToAyah(item.surahNumber, item.numberInSurah)}
                      className="group cursor-pointer rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:border-emerald-500 p-5 transition-all hover:shadow-sm space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            سورة {item.surahName} · الآية {item.numberInSurah}
                          </span>
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            الجزء {item.juz}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <span>الانتقال لموضع الآية</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <p className="text-xl sm:text-2xl leading-[2.1] font-amiri font-bold text-stone-900 dark:text-stone-100 bg-[#fffdf7] dark:bg-stone-950/60 border border-amber-200/60 dark:border-stone-800 rounded-2xl p-4">
                        {item.text}{' '}
                        <span className="inline-flex items-center justify-center mx-1 px-2 py-0.5 text-sm font-cairo font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {item.numberInSurah}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* VIEW 3: FULL QURAN AYAH SEARCH ENGINE */}
      {subTab === 'ayah-search' ? (
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                <span>البحث الذكي عن آية في القرآن الكريم</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                اكتب أي كلمة أو جزء من الآية (بدون الحاجة للتشكيل أو الهمزات) واضغط على الآية للانتقال مباشرة إلى موضعها في السورة
              </p>
            </div>

            <div className="relative">
              <Search className="w-5 h-5 text-emerald-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={ayahSearchQuery}
                onChange={e => setAyahSearchQuery(e.target.value)}
                placeholder="اكتب جزءاً من الآية (مثل: الله لا اله الا هو الحي القيوم، ربنا اتنا، ان مع العسر يسرا)..."
                className="w-full pr-12 pl-10 py-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border-2 border-emerald-200 dark:border-stone-700 text-sm sm:text-base focus:outline-none focus:border-emerald-600"
                autoFocus
              />
              {ayahSearchQuery && (
                <button
                  onClick={() => setAyahSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Search Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block">
                آيات وأدعية قرآنية سريعة الوصول:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_AYAH_SEARCH_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => setAyahSearchQuery(chip)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      ayahSearchQuery === chip
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Status Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300">
              {ayahSearchQuery.trim()
                ? `نتائج البحث عن «${ayahSearchQuery}» (${combinedAyahResults.length} آية)`
                : 'أشهر الآيات والأدعية القرآنية المختارة'}
            </span>
            {isSearchingFullQuran && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري البحث في جميع سور المصحف (114 سورة)...</span>
              </span>
            )}
          </div>

          {/* Matching Ayahs Cards */}
          {combinedAyahResults.length === 0 && !isSearchingFullQuran ? (
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                لم يتم العثور على آيات مطابقة لـ «{ayahSearchQuery}»
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                جرّب كتابة كلمة واحدة أو كلمتين من الآية الكريمة دون علامات ترقيم.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {combinedAyahResults.map(item => (
                <div
                  key={`${item.surahNumber}:${item.numberInSurah}`}
                  onClick={() => handleNavigateToAyah(item.surahNumber, item.numberInSurah)}
                  className="group cursor-pointer rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:border-emerald-500 dark:hover:border-emerald-500 p-5 sm:p-6 transition-all hover:shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        سورة {item.surahName} · الآية {item.numberInSurah}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        الجزء {item.juz}
                      </span>
                      {item.label && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                          {item.label}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-[-2px] transition-transform">
                      <span>الانتقال لموضع الآية في المصحف</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <p className="text-xl sm:text-2xl leading-[2.2] font-amiri font-bold text-stone-900 dark:text-stone-100 bg-[#fffdf7] dark:bg-stone-950/60 border border-amber-200/60 dark:border-stone-800 rounded-2xl p-4">
                    {item.text}{' '}
                    <span className="inline-flex items-center justify-center mx-1 px-2 py-0.5 text-sm font-cairo font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {item.numberInSurah}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* VIEW 4: 30-DAY KHATMAH SCHEDULE */}
      {subTab === 'khatmah' ? (
        <div className="space-y-5 animate-fade-in">
          {/* Khatmah Progress Card */}
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                  جدول الختمة الكاملة (30 جزءاً)
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  أتممت {completedKhatmahDays.length} من 30 جزءاً ({khatmahPct}%) — اضغط على أي يوم عند إتمام قراءته
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubTab('ayah-search')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>البحث عن آية في الختمة</span>
                </button>
                {completedKhatmahDays.length > 0 && (
                  <button
                    onClick={() => setCompletedKhatmahDays([])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بدء ختمة جديدة</span>
                  </button>
                )}
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${khatmahPct}%` }}
              />
            </div>
          </div>

          {/* 30 Days Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KHATMAH_30_DAYS.map(item => {
              const isDone = completedKhatmahDays.includes(item.day);
              return (
                <div
                  key={item.day}
                  onClick={() => toggleKhatmahDay(item.day)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        اليوم {item.day} · الجزء {item.juzNumber}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                      من {item.fromSurah} إلى {item.toSurah}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      الصفحات: من ص {item.startPage} إلى ص {item.endPage}
                    </p>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* VIEW 4.5: FRIDAY NIGHT WIRD (ورد ليلة الجمعة: الكهف، يس، الواقعة، الدخان، الملك) */}
      {subTab === 'friday-wird' ? (
        <div className="space-y-5 animate-fade-in">
          {/* Top Progress & Overview Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-amber-50 via-emerald-50/70 to-teal-50 dark:from-amber-950/40 dark:via-emerald-950/30 dark:to-stone-900 border border-amber-200/80 dark:border-amber-800/50 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-amiri">
                    ورد ليلة الجمعة المباركة (السور الخمس الكاملة)
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                  سورة الكهف · سورة يس · سورة الواقعة · سورة الدخان · سورة الملك — أتممت {completedFridayWird.length} من 5 سور ({fridayWirdPct}%)
                </p>
              </div>

              {completedFridayWird.length > 0 && (
                <button
                  onClick={() => setCompletedFridayWird([])}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-stone-700 text-xs font-bold hover:bg-rose-50 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تصفير ورد الجمعة الجديدة</span>
                </button>
              )}
            </div>

            <div className="w-full h-3 rounded-full bg-white/80 dark:bg-stone-800 overflow-hidden border border-amber-200/60 dark:border-stone-700">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${fridayWirdPct}%` }}
              />
            </div>

            {/* 5 Surahs Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {FRIDAY_NIGHT_WIRD_SURAHS.map((item, idx) => {
                const isSelected = fridayWirdActiveSurahNum === item.number;
                const isDone = completedFridayWird.includes(item.number);
                const meta = SURAHS_LIST.find(s => s.number === item.number);

                return (
                  <div
                    key={item.number}
                    onClick={() => setFridayWirdActiveSurahNum(item.number)}
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-white dark:bg-stone-900 border-amber-500 dark:border-amber-500 shadow-sm'
                        : isDone
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-white/90 dark:bg-stone-900/80 border-stone-200 dark:border-stone-800 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        {idx + 1}. {item.titleBadge}
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleFridayWirdSurah(item.number);
                        }}
                        title={isDone ? 'تمت قراءتها' : 'تحديد كمقروءة'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-emerald-600'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-amiri">
                        سورة {item.name}
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                        {meta?.ayahs || ''} آية · جزء {meta?.juz || ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Reader for the Currently Selected Friday Wird Surah */}
          {(() => {
            const currentWirdItem =
              FRIDAY_NIGHT_WIRD_SURAHS.find(s => s.number === fridayWirdActiveSurahNum) ||
              FRIDAY_NIGHT_WIRD_SURAHS[0];
            const currentMeta = SURAHS_LIST.find(s => s.number === currentWirdItem.number);
            const isCurrentDone = completedFridayWird.includes(currentWirdItem.number);
            const currentIdx = FRIDAY_NIGHT_WIRD_SURAHS.findIndex(
              s => s.number === currentWirdItem.number
            );

            return (
              <div className="space-y-4">
                {/* Surah Header & Virtue Bar */}
                <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-200 font-amiri">
                        سورة {currentWirdItem.name}
                      </h3>
                      <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                        ({currentMeta?.ayahs} آية · الجزء {currentMeta?.juz})
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {currentWirdItem.virtue}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleFridayWirdSurah(currentWirdItem.number)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shrink-0 ${
                      isCurrentDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isCurrentDone
                        ? `تم إتمام قراءة سورة ${currentWirdItem.name}`
                        : `تحديد سورة ${currentWirdItem.name} كمقروءة`}
                    </span>
                  </button>
                </div>

                {/* Full Uthmani Text of the Friday Wird Surah */}
                <div className="rounded-3xl bg-[#fffdf7] dark:bg-stone-900 border-2 border-amber-200/80 dark:border-stone-800 p-6 sm:p-10 shadow-sm space-y-6">
                  <div className="text-center pb-4 border-b border-amber-200/50 dark:border-stone-800">
                    <p className="text-2xl sm:text-3xl font-amiri font-bold text-emerald-900 dark:text-emerald-300">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </p>
                  </div>

                  {fridayWirdActiveAyahs.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <Loader2 className="w-7 h-7 animate-spin text-emerald-600 mx-auto" />
                      <p className="text-xs text-stone-500">جاري تجهيز آيات سورة {currentWirdItem.name}...</p>
                    </div>
                  ) : (
                    <div className="text-right leading-[2.6] sm:leading-[2.8] text-2xl sm:text-3xl font-amiri text-stone-900 dark:text-stone-100 select-text">
                      {fridayWirdActiveAyahs.map(ayah => (
                        <span
                          key={ayah.numberInSurah}
                          className="inline rounded-xl px-1 py-0.5 hover:bg-amber-100/60 dark:hover:bg-stone-800 transition-colors"
                        >
                          {ayah.text}{' '}
                          <span className="inline-flex items-center justify-center mx-1 px-2 py-0.5 text-base font-cairo font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 tabular-nums">
                            {ayah.numberInSurah}
                          </span>{' '}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom bar inside Mushaf page to mark done and advance to next Surah in the Friday Wird */}
                  <div className="pt-6 border-t border-amber-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      disabled={currentIdx <= 0}
                      onClick={() => {
                        if (currentIdx > 0) {
                          setFridayWirdActiveSurahNum(FRIDAY_NIGHT_WIRD_SURAHS[currentIdx - 1].number);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>السورة السابقة في الورد</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!isCurrentDone) {
                          toggleFridayWirdSurah(currentWirdItem.number);
                        }
                        if (currentIdx < FRIDAY_NIGHT_WIRD_SURAHS.length - 1) {
                          setFridayWirdActiveSurahNum(FRIDAY_NIGHT_WIRD_SURAHS[currentIdx + 1].number);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {currentIdx < FRIDAY_NIGHT_WIRD_SURAHS.length - 1
                          ? `إتمام سورة ${currentWirdItem.name} والانتقال لسورة ${FRIDAY_NIGHT_WIRD_SURAHS[currentIdx + 1].name}`
                          : `إتمام سورة ${currentWirdItem.name} وختم ورد ليلة الجمعة`}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {/* VIEW 5: MEMORIZATION & READING TRACKER */}
      {subTab === 'memorization' ? (
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-3xl bg-gradient-to-r from-amber-50 via-yellow-50/80 to-emerald-50/70 dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-900 border border-amber-200/80 dark:border-amber-800/50 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                  لوحة تشجيع الحفظ والتلاوة
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                  حفظت <strong>{memorizedSurahs.length}</strong> سورة ({memorizedPct}%) وقرأت <strong>{readSurahs.length}</strong> سورة من المصحف الشريف!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SURAHS_LIST.map(surah => {
              const isMemorized = memorizedSurahs.includes(surah.number);
              const isRead = readSurahs.includes(surah.number);

              return (
                <div
                  key={surah.number}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 font-amiri">
                      {surah.number}. سورة {surah.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {surah.ayahs} آية · جزء {surah.juz}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleReadSurah(surah.number)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        isRead
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      {isRead ? '✓ مقروءة' : 'قراءة'}
                    </button>
                    <button
                      onClick={() => toggleMemorizedSurah(surah.number)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        isMemorized
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      {isMemorized ? '★ محفوظة' : 'حفظ'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
