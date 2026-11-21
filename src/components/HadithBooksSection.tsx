import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  Search,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Heart,
  X,
  FolderOpen,
  FolderClosed,
  Layers,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Hash,
  GitBranch,
  ListTree,
} from 'lucide-react';
import {
  ENCYCLOPEDIA_BOOKS_INDEX,
  CURATED_HADITH_BY_KEY,
  buildElectronicBookTree,
  ElectronicChapterMeta,
  ElectronicBookIndexItem,
  FullElectronicBookPayload,
  HadithBookId,
  HadithTreeCollectionNode,
} from '../data/hadithData';
import { speakArabicText, stopSpeech } from '../utils/soundHelper';
import {
  matchesArabicQuery,
  normalizeArabicForSearch,
} from '../utils/arabicSearch';

interface HadithBooksSectionProps {
  onBackHome: () => void;
}

const STORAGE_KEY_SAVED_HADITHS = 'azkar_memorized_hadiths_v1';

const QUICK_HADITH_SEARCH_CHIPS = [
  'إنما الأعمال بالنيات',
  'بني الإسلام على خمس',
  'من كذب علي متعمدا',
  'الدين النصيحة',
  'لا تغضب',
  'المسلم من سلم المسلمون',
  'كلمتان خفيفتان على اللسان',
  'خيركم من تعلم القرآن',
  'الطهور شطر الإيمان',
  'اتق الله حيثما كنت',
];

// Session-level memory cache for the index, full payloads, and built trees
let cachedIndexData: {
  totalBooks: number;
  totalHadiths: number;
  books: ElectronicBookIndexItem[];
} | null = null;

const cachedFullBooks = new Map<HadithBookId, FullElectronicBookPayload>();
const cachedBookTrees = new Map<HadithBookId, HadithTreeCollectionNode>();
const pendingBookPromises = new Map<HadithBookId, Promise<FullElectronicBookPayload>>();

async function loadElectronicHadithIndex() {
  if (cachedIndexData) return cachedIndexData;
  const res = await fetch('/data/hadith-books/index.json');
  if (!res.ok) throw new Error('Failed to load hadith index');
  const data = await res.json();
  cachedIndexData = data;
  return data as NonNullable<typeof cachedIndexData>;
}

async function loadElectronicHadithBook(bookId: HadithBookId): Promise<FullElectronicBookPayload> {
  const existing = cachedFullBooks.get(bookId);
  if (existing) return existing;

  const pending = pendingBookPromises.get(bookId);
  if (pending) return pending;

  const promise = fetch(`/data/hadith-books/${bookId}.json`)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ${bookId}`);
      return res.json();
    })
    .then((bookData: FullElectronicBookPayload) => {
      cachedFullBooks.set(bookId, bookData);
      if (!cachedBookTrees.has(bookId)) {
        cachedBookTrees.set(bookId, buildElectronicBookTree(bookData));
      }
      pendingBookPromises.delete(bookId);
      return bookData;
    });

  pendingBookPromises.set(bookId, promise);
  return promise;
}

const PAGE_SIZE = 30;

export const HadithBooksSection: React.FC<HadithBooksSectionProps> = ({ onBackHome }) => {
  const [booksIndex, setBooksIndex] = useState<ElectronicBookIndexItem[]>(
    () => cachedIndexData?.books || ENCYCLOPEDIA_BOOKS_INDEX
  );
  const [totalEncyclopediaHadiths, setTotalEncyclopediaHadiths] = useState<number>(
    () => cachedIndexData?.totalHadiths || 41471
  );

  // View Mode: 'tree' (التصفح الشجري القابل للطي والفتح) or 'classic' (الفهرس الشبكي المتسلسل)
  const [browseMode, setBrowseMode] = useState<'tree' | 'classic'>('tree');
  const [selectedBookId, setSelectedBookId] = useState<HadithBookId>('bukhari');
  const [selectedSubBookId, setSelectedSubBookId] = useState<number | 'all'>('all');
  const [expandedSubBookIds, setExpandedSubBookIds] = useState<number[]>([1]);
  const [expandedChapterKeys, setExpandedChapterKeys] = useState<string[]>([
    'bukhari-sb1-ch1',
  ]);

  const [chapterFilterQuery, setChapterFilterQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'current-book' | 'all-books'>('current-book');
  const [hadithNumJump, setHadithNumJump] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [activeBookData, setActiveBookData] = useState<FullElectronicBookPayload | null>(
    () => cachedFullBooks.get('bukhari') || null
  );
  const [activeBookTree, setActiveBookTree] = useState<HadithTreeCollectionNode | null>(
    () => cachedBookTrees.get('bukhari') || null
  );
  const [isLoadingBook, setIsLoadingBook] = useState<boolean>(!cachedFullBooks.has('bukhari'));
  const [loadedBooksCount, setLoadedBooksCount] = useState<number>(() => cachedFullBooks.size);
  const [isSearchingAllBooks, setIsSearchingAllBooks] = useState<boolean>(false);
  const [allBooksSearchResults, setAllBooksSearchResults] = useState<
    {
      bookId: HadithBookId;
      bookTitle: string;
      grade: string;
      chapterTitle: string;
      chapterNumber: number;
      hadithNumber: number;
      text: string;
    }[]
  >([]);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [memorizedHadiths, setMemorizedHadiths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_HADITHS);
      return saved ? JSON.parse(saved) : ['bukhari-1', 'nawawi-1'];
    } catch {
      return ['bukhari-1', 'nawawi-1'];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED_HADITHS, JSON.stringify(memorizedHadiths));
  }, [memorizedHadiths]);

  // 1. Load index.json on mount and start background pre-caching of all 12 books
  useEffect(() => {
    let mounted = true;
    loadElectronicHadithIndex()
      .then(idx => {
        if (!mounted) return;
        setBooksIndex(idx.books);
        setTotalEncyclopediaHadiths(idx.totalHadiths);

        // Sequentially preload all books in the background for instant offline access
        (async () => {
          for (const b of idx.books) {
            if (!mounted) break;
            try {
              await loadElectronicHadithBook(b.id as HadithBookId);
              if (mounted) {
                setLoadedBooksCount(cachedFullBooks.size);
              }
            } catch {
              // ignore individual error
            }
          }
        })();
      })
      .catch(() => {
        // Fallback index already set
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load the currently selected book immediately and build its hierarchical tree
  useEffect(() => {
    let mounted = true;
    const cached = cachedFullBooks.get(selectedBookId);
    if (cached) {
      let tree = cachedBookTrees.get(selectedBookId);
      if (!tree) {
        tree = buildElectronicBookTree(cached);
        cachedBookTrees.set(selectedBookId, tree);
      }
      setActiveBookData(cached);
      setActiveBookTree(tree);
      setIsLoadingBook(false);
      // Auto-expand first subBook and its first chapter when switching books
      const firstSubBook = tree.subBooks[0];
      if (firstSubBook) {
        setExpandedSubBookIds([firstSubBook.subBookId]);
        if (firstSubBook.chapters[0]) {
          setExpandedChapterKeys([firstSubBook.chapters[0].chapterKey]);
        }
      }
      return;
    }

    setIsLoadingBook(true);
    loadElectronicHadithBook(selectedBookId)
      .then(data => {
        if (!mounted) return;
        let tree = cachedBookTrees.get(selectedBookId);
        if (!tree) {
          tree = buildElectronicBookTree(data);
          cachedBookTrees.set(selectedBookId, tree);
        }
        setActiveBookData(data);
        setActiveBookTree(tree);
        setIsLoadingBook(false);
        setLoadedBooksCount(cachedFullBooks.size);
        const firstSubBook = tree.subBooks[0];
        if (firstSubBook) {
          setExpandedSubBookIds([firstSubBook.subBookId]);
          if (firstSubBook.chapters[0]) {
            setExpandedChapterKeys([firstSubBook.chapters[0].chapterKey]);
          }
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsLoadingBook(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBookId]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBookId, selectedSubBookId, searchQuery, searchScope, hadithNumJump]);

  const toggleMemorized = (id: string) => {
    setMemorizedHadiths(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSubBookExpand = (subBookId: number, firstChapterKey?: string) => {
    setExpandedSubBookIds(prev => {
      const exists = prev.includes(subBookId);
      if (exists) {
        return prev.filter(id => id !== subBookId);
      }
      if (firstChapterKey && !expandedChapterKeys.includes(firstChapterKey)) {
        setExpandedChapterKeys(chPrev => [...chPrev, firstChapterKey]);
      }
      return [...prev, subBookId];
    });
  };

  const toggleChapterExpand = (chapterKey: string) => {
    setExpandedChapterKeys(prev =>
      prev.includes(chapterKey)
        ? prev.filter(k => k !== chapterKey)
        : [...prev, chapterKey]
    );
  };

  const activeBookMeta = useMemo(() => {
    return booksIndex.find(b => b.id === selectedBookId) || booksIndex[0];
  }, [booksIndex, selectedBookId]);

  // Filtered SubBooks in Tree View when user types in chapterFilterQuery
  const filteredTreeSubBooks = useMemo(() => {
    if (!activeBookTree) return [];
    const q = chapterFilterQuery.trim();
    if (!q) return activeBookTree.subBooks;
    return activeBookTree.subBooks.filter(
      sb =>
        matchesArabicQuery(sb.subBookTitle, q) ||
        String(sb.subBookNumber) === q ||
        sb.chapters.some(ch => matchesArabicQuery(ch.chapterTitle, q))
    );
  }, [activeBookTree, chapterFilterQuery]);

  // Map chapterId -> chapter meta for fast lookup
  const chapterMap = useMemo(() => {
    const map = new Map<number, ElectronicChapterMeta>();
    const list = activeBookData?.chapters?.length
      ? activeBookData.chapters
      : activeBookMeta?.chapters || [];
    list.forEach(ch => map.set(ch.id, ch));
    return map;
  }, [activeBookData, activeBookMeta]);

  // Global search across all 12 books when searchScope === 'all-books' and searchQuery is non-empty
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || searchScope !== 'all-books') {
      setAllBooksSearchResults([]);
      setIsSearchingAllBooks(false);
      return;
    }

    let cancelled = false;
    setIsSearchingAllBooks(true);

    const timer = window.setTimeout(async () => {
      const results: typeof allBooksSearchResults = [];
      const normQ = normalizeArabicForSearch(q);
      const isNumericQuery = /^\d+$/.test(q);
      const targetNum = isNumericQuery ? parseInt(q, 10) : null;

      for (const bMeta of booksIndex) {
        if (cancelled) return;
        try {
          const book = await loadElectronicHadithBook(bMeta.id as HadithBookId);
          if (cancelled) return;
          const chLookup = new Map<number, ElectronicChapterMeta>();
          book.chapters.forEach(c => chLookup.set(c.id, c));

          for (const h of book.hadiths) {
            if (targetNum !== null) {
              if (h.n === targetNum) {
                const ch = chLookup.get(h.c);
                results.push({
                  bookId: book.id,
                  bookTitle: book.title,
                  grade: book.grade,
                  chapterTitle: ch?.title || 'الباب الأصلي',
                  chapterNumber: ch?.number || h.c,
                  hadithNumber: h.n,
                  text: h.t,
                });
              }
            } else {
              if (!h.norm) {
                h.norm = normalizeArabicForSearch(h.t);
              }
              const ch = chLookup.get(h.c);
              if (
                h.norm.includes(normQ) ||
                matchesArabicQuery(h.t, q, { norm: h.norm }) ||
                (ch && matchesArabicQuery(ch.title, q))
              ) {
                results.push({
                  bookId: book.id,
                  bookTitle: book.title,
                  grade: book.grade,
                  chapterTitle: ch?.title || 'الباب الأصلي',
                  chapterNumber: ch?.number || h.c,
                  hadithNumber: h.n,
                  text: h.t,
                });
              }
            }
            if (results.length >= 150) break;
          }
        } catch {
          // ignore
        }
        if (results.length >= 150) break;
      }

      if (!cancelled) {
        setAllBooksSearchResults(results);
        setIsSearchingAllBooks(false);
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, searchScope, booksIndex]);

  // Filtered Hadiths inside the currently selected book (preserving original order!)
  const filteredBookHadiths = useMemo(() => {
    if (!activeBookData) return [];
    let list = activeBookData.hadiths;

    // 1. Filter by selected original sub-book (الكتاب الأصلي)
    if (selectedSubBookId !== 'all') {
      list = list.filter(h => h.c === selectedSubBookId);
    }

    // 2. Filter by Hadith number jump if entered
    const numJump = hadithNumJump.trim();
    if (numJump && /^\d+$/.test(numJump)) {
      const target = parseInt(numJump, 10);
      return list.filter(h => h.n === target || String(h.n).startsWith(numJump));
    }

    // 3. Filter by search query (if in current-book scope)
    const q = searchQuery.trim();
    if (q && searchScope === 'current-book') {
      if (/^\d+$/.test(q)) {
        const target = parseInt(q, 10);
        return list.filter(h => h.n === target || String(h.n).startsWith(q));
      }
      const normQ = normalizeArabicForSearch(q);
      return list.filter(h => {
        if (!h.norm) {
          h.norm = normalizeArabicForSearch(h.t);
        }
        if (h.norm.includes(normQ)) return true;
        const ch = chapterMap.get(h.c);
        if (ch && matchesArabicQuery(ch.title, q)) return true;
        return matchesArabicQuery(h.t, q, { norm: h.norm });
      });
    }

    return list;
  }, [activeBookData, selectedSubBookId, hadithNumJump, searchQuery, searchScope, chapterMap]);

  const isSearchOrJumpActive = Boolean(searchQuery.trim() || hadithNumJump.trim());

  // Pagination slice for smooth rendering of thousands of hadiths
  const totalFilteredCount =
    searchQuery.trim() && searchScope === 'all-books'
      ? allBooksSearchResults.length
      : filteredBookHadiths.length;

  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PAGE_SIZE));

  const paginatedBookHadiths = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBookHadiths.slice(start, start + PAGE_SIZE);
  }, [filteredBookHadiths, currentPage]);

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      stopSpeech();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      speakArabicText(text, () => setSpeakingId(null));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 via-yellow-50/80 to-orange-50/70 dark:from-amber-950/50 dark:via-stone-900 dark:to-stone-900 border border-amber-200/80 dark:border-amber-800/50 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => {
              stopSpeech();
              onBackHome();
            }}
            className="p-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-xs transition"
            title="العودة للرئيسية"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-100 font-amiri">
                موسوعة الحديث الشاملة (التصفح الشجري للكتب والأبواب الأصلية)
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{totalEncyclopediaHadiths.toLocaleString('en-US')} حديثاً بدون إنترنت</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1">
              شجرة تفاعلية متكاملة: المصنّف ← الكتب الأصلية ← الأبواب الأصلية ← متون الأحاديث الكاملة بالسند والتشكيل
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-amber-200/60 dark:border-stone-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
            الكتب المخزنة فوريّاً: {loadedBooksCount} / {booksIndex.length}
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-white/90 dark:bg-stone-900/90 border border-amber-200/60 dark:border-stone-800 text-xs font-bold text-amber-900 dark:text-amber-200 tabular-nums">
            أحاديث حفظتها: {memorizedHadiths.length}
          </div>
        </div>
      </div>

      {/* 1. Level-1 Root Tree Selector: Complete Electronic Hadith Collections (12 Books) */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <ListTree className="w-4 h-4 text-amber-600" />
            <span>المستوى الأول في الشجرة: اختر المصنّف الحديثي لتصفح شجرة كتبه وأبوابه الأصلية:</span>
          </h2>

          {/* Mode Switch: Interactive Tree vs Sequential View */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800">
            <button
              onClick={() => setBrowseMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                browseMode === 'tree'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-700 dark:text-stone-300'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>التصفح الشجري القابل للطي</span>
            </button>
            <button
              onClick={() => setBrowseMode('classic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                browseMode === 'classic'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-stone-700 dark:text-stone-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>العرض المتسلسل بالصفحات</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {booksIndex.map(book => {
            const isActive = selectedBookId === book.id;
            return (
              <button
                key={book.id}
                onClick={() => {
                  setSelectedBookId(book.id as HadithBookId);
                  setSelectedSubBookId('all');
                  setChapterFilterQuery('');
                  setHadithNumJump('');
                  if (searchScope === 'all-books') {
                    setSearchScope('current-book');
                  }
                }}
                className={`text-right rounded-2xl p-3.5 border-2 transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-500 dark:border-amber-500 shadow-xs'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 truncate">
                    {book.badge}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                    {book.totalHadiths.toLocaleString('en-US')} حديث
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 font-amiri">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    {book.chaptersCount} كتاباً فرعياً أصلياً
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Comprehensive Search & Hadith Number Jump Bar */}
      <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-amber-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`ابحث بكلمة أو جملة في ${
                searchScope === 'all-books'
                  ? 'جميع كتب الحديث الـ 12 الكاملة (41,471 حديثاً)'
                  : `متن وأسانيد وأبواب ${activeBookMeta.title} (${activeBookMeta.totalHadiths.toLocaleString('en-US')} حديثاً)`
              }...`}
              className="w-full pr-12 pl-10 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-sm focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-stone-200/70 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Direct Jump by Hadith Number */}
          <div className="relative w-full lg:w-52 shrink-0">
            <Hash className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              inputMode="numeric"
              value={hadithNumJump}
              onChange={e => setHadithNumJump(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="انتقال برقم الحديث..."
              className="w-full pr-10 pl-8 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 tabular-nums"
            />
            {hadithNumJump && (
              <button
                onClick={() => setHadithNumJump('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Scope Toggle (Current Book vs All 12 Books) */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 shrink-0">
            <button
              onClick={() => setSearchScope('current-book')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                searchScope === 'current-book'
                  ? 'bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-300 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              في {activeBookMeta.title}
            </button>
            <button
              onClick={() => setSearchScope('all-books')}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                searchScope === 'all-books'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              في جميع الكتب (12 كتاباً)
            </button>
          </div>
        </div>

        {/* Quick Hadith Search Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 ml-1">
            بحث سريع في الأحاديث:
          </span>
          {QUICK_HADITH_SEARCH_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setSearchQuery(searchQuery === chip ? '' : chip)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                searchQuery === chip
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Loading State */}
      {isLoadingBook || isSearchingAllBooks ? (
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-14 text-center space-y-3">
          <Loader2 className="w-9 h-9 animate-spin text-amber-600 mx-auto" />
          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
            {isSearchingAllBooks
              ? 'جاري البحث الشامل في جميع كتب الحديث الـ 12 الكاملة...'
              : `جاري بناء الشجرة الكاملة لـ ${activeBookMeta.title}...`}
          </p>
        </div>
      ) : isSearchOrJumpActive ? (
        /* 4. Search or Hadith-Number Jump Results */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3">
            <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
              {hadithNumJump.trim()
                ? `نتائج الانتقال لحديث رقم (${hadithNumJump}) في ${activeBookMeta.title}: (${totalFilteredCount} حديث)`
                : `نتائج البحث عن «${searchQuery}»: (${totalFilteredCount.toLocaleString('en-US')} حديث)`}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setHadithNumJump('');
              }}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              إلغاء البحث والعودة للشجرة الأصلية
            </button>
          </div>

          {searchScope === 'all-books' && searchQuery.trim() ? (
            allBooksSearchResults.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-10 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                  لا توجد أحاديث مطابقة لـ «{searchQuery}» في جميع الكتب
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {allBooksSearchResults.map(item => {
                  const uniqueId = `${item.bookId}-${item.hadithNumber}`;
                  const isMemorized = memorizedHadiths.includes(uniqueId);
                  const isSpeaking = speakingId === uniqueId;
                  const curated = CURATED_HADITH_BY_KEY.get(`${item.bookId}:${item.hadithNumber}`);

                  return (
                    <div
                      key={uniqueId}
                      className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 sm:p-7 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 font-bold">
                          <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                            {item.bookTitle}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 tabular-nums">
                            حديث رقم ({item.hadithNumber})
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                            {item.chapterNumber}. {item.chapterTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSpeak(uniqueId, item.text)}
                            title="الاستماع للحديث"
                            className={`p-2 rounded-xl transition ${
                              isSpeaking
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                            }`}
                          >
                            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => toggleMemorized(uniqueId)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              isMemorized
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isMemorized ? 'تم الحفظ' : 'حفظ'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#fffdf7] dark:bg-stone-950/70 border border-amber-200/70 dark:border-stone-800 p-5">
                        <p className="text-xl sm:text-2xl leading-[2.2] font-amiri font-bold text-stone-900 dark:text-stone-100 whitespace-pre-line">
                          {item.text}
                        </p>
                      </div>

                      {curated && (
                        <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-4 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            <Sparkles className="w-4 h-4" />
                            <span>الشرح والفائدة:</span>
                          </div>
                          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                            {curated.kidsExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : paginatedBookHadiths.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                لا توجد أحاديث مطابقة لبحثك في {activeBookMeta.title}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paginatedBookHadiths.map(h => {
                const uniqueId = `${selectedBookId}-${h.n}`;
                const isMemorized = memorizedHadiths.includes(uniqueId);
                const isSpeaking = speakingId === uniqueId;
                const ch = chapterMap.get(h.c);
                const curated = CURATED_HADITH_BY_KEY.get(`${selectedBookId}:${h.n}`);

                return (
                  <div
                    key={uniqueId}
                    className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 sm:p-7 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2 font-bold">
                        <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                          {activeBookMeta.title}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 tabular-nums">
                          حديث رقم ({h.n})
                        </span>
                        {ch && (
                          <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                            {ch.number}. {ch.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSpeak(uniqueId, h.t)}
                          title="الاستماع للحديث"
                          className={`p-2 rounded-xl transition ${
                            isSpeaking
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                          }`}
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => toggleMemorized(uniqueId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            isMemorized
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isMemorized ? 'حفظت الحديث' : 'حفظ'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#fffdf7] dark:bg-stone-950/70 border border-amber-200/70 dark:border-stone-800 p-5 sm:p-6">
                      <p className="text-xl sm:text-2xl leading-[2.2] font-amiri font-bold text-stone-900 dark:text-stone-100 whitespace-pre-line select-text">
                        {h.t}
                      </p>
                    </div>

                    {curated && (
                      <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <Sparkles className="w-4 h-4" />
                          <span>الشرح والبيان:</span>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                          {curated.kidsExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : browseMode === 'tree' && activeBookTree ? (
        /* 5. INTERACTIVE COLLAPSIBLE TREE BROWSER (المصنّف -> الكتب الأصلية -> الأبواب الأصلية -> الأحاديث) */
        <div className="space-y-4">
          {/* Tree Header & Controls */}
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-amiri">
                    الشجرة التفاعلية لـ «{activeBookTree.title}» ({activeBookTree.subBooksCount} كتاباً أصلياً · {activeBookTree.totalHadiths.toLocaleString('en-US')} حديث)
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    اضغط على أي كتاب أصلي لفتح أبوابه الفرعية، ثم اضغط على الباب لعرض أحاديثه مرتبة بالتسلسل الأصلي
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Inside Tree */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={chapterFilterQuery}
                    onChange={e => setChapterFilterQuery(e.target.value)}
                    placeholder={`تصفية الكتب والأبواب في ${activeBookTree.title}...`}
                    className="w-full pr-8 pl-7 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:border-amber-500"
                  />
                  {chapterFilterQuery && (
                    <button
                      onClick={() => setChapterFilterQuery('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setExpandedSubBookIds([])}
                  className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition"
                >
                  طيّ جميع الكتب
                </button>
              </div>
            </div>

            {/* Tree Nodes List: Sub-Books (الكتب الأصلية) */}
            <div className="space-y-2.5 pt-2">
              {filteredTreeSubBooks.map(subBook => {
                const isSubBookExpanded = expandedSubBookIds.includes(subBook.subBookId);
                const firstChapterKey = subBook.chapters[0]?.chapterKey;

                return (
                  <div
                    key={subBook.subBookId}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isSubBookExpanded
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-stone-900'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 hover:border-amber-300'
                    }`}
                  >
                    {/* Level 2 Node Header: Original Sub-Book (الكتاب الأصلي) */}
                    <button
                      type="button"
                      onClick={() => toggleSubBookExpand(subBook.subBookId, firstChapterKey)}
                      className="w-full px-4 py-3.5 text-right flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-stone-800/60 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                            isSubBookExpanded
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {isSubBookExpanded ? (
                            <FolderOpen className="w-4 h-4" />
                          ) : (
                            <FolderClosed className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 font-amiri truncate">
                            {subBook.subBookNumber}. {subBook.subBookTitle}
                          </h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                            يضم {subBook.chapters.length} {subBook.chapters.length === 1 ? 'باباً' : 'أبواب'} · إجمالي {subBook.totalHadiths} حديث
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-[11px] font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                          {subBook.totalHadiths} حديث
                        </span>
                        {isSubBookExpanded ? (
                          <ChevronUp className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>

                    {/* Level 3 Nodes: Chapters (الأبواب الأصلية) inside the Expanded Sub-Book */}
                    {isSubBookExpanded && (
                      <div className="px-3 sm:px-5 pb-4 pt-2 border-t border-amber-200/60 dark:border-stone-800 space-y-2.5 bg-white dark:bg-stone-950/40">
                        {subBook.chapters.map(chapter => {
                          const isChapterExpanded = expandedChapterKeys.includes(chapter.chapterKey);

                          return (
                            <div
                              key={chapter.chapterKey}
                              className="rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden bg-stone-50/50 dark:bg-stone-900/70"
                            >
                              {/* Chapter Node Header */}
                              <button
                                type="button"
                                onClick={() => toggleChapterExpand(chapter.chapterKey)}
                                className="w-full px-4 py-3 text-right flex items-center justify-between gap-3 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-stone-800 transition"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                                    {chapter.chapterNumber}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200 truncate">
                                    {chapter.chapterTitle}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                    ({chapter.hadiths.length} أحاديث)
                                  </span>
                                  {isChapterExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-stone-400" />
                                  )}
                                </div>
                              </button>

                              {/* Level 4 Leaf Nodes: Hadiths inside the Expanded Chapter */}
                              {isChapterExpanded && (
                                <div className="p-3 sm:p-4 border-t border-stone-200/70 dark:border-stone-800 space-y-3.5 bg-white dark:bg-stone-900">
                                  {chapter.hadiths.map(h => {
                                    const uniqueId = `${selectedBookId}-${h.n}`;
                                    const isMemorized = memorizedHadiths.includes(uniqueId);
                                    const isSpeaking = speakingId === uniqueId;
                                    const curated = CURATED_HADITH_BY_KEY.get(`${selectedBookId}:${h.n}`);

                                    return (
                                      <div
                                        key={uniqueId}
                                        className="rounded-2xl bg-[#fffdf7] dark:bg-stone-950/80 border border-amber-200/80 dark:border-stone-800 p-4 sm:p-5 space-y-3.5"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                          <div className="flex flex-wrap items-center gap-1.5 font-bold">
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 tabular-nums">
                                              حديث رقم ({h.n})
                                            </span>
                                            <span className="text-stone-400">·</span>
                                            <span className="text-stone-600 dark:text-stone-400">
                                              {activeBookTree.title} — {subBook.subBookTitle}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => handleSpeak(uniqueId, h.t)}
                                              title="الاستماع للحديث"
                                              className={`p-2 rounded-xl transition ${
                                                isSpeaking
                                                  ? 'bg-emerald-600 text-white'
                                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                                              }`}
                                            >
                                              {isSpeaking ? (
                                                <VolumeX className="w-4 h-4" />
                                              ) : (
                                                <Volume2 className="w-4 h-4" />
                                              )}
                                            </button>

                                            <button
                                              onClick={() => toggleMemorized(uniqueId)}
                                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                                isMemorized
                                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                              }`}
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                              <span>{isMemorized ? 'تم الحفظ' : 'حفظ'}</span>
                                            </button>
                                          </div>
                                        </div>

                                        <p className="text-xl sm:text-2xl leading-[2.2] font-amiri font-bold text-stone-900 dark:text-stone-100 whitespace-pre-line select-text">
                                          {h.t}
                                        </p>

                                        {curated && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-amber-100 dark:border-stone-800">
                                            <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-3 space-y-1">
                                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>الشرح والبيان:</span>
                                              </div>
                                              <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
                                                {curated.kidsExplanation}
                                              </p>
                                            </div>

                                            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-800/40 p-3 flex items-center gap-2">
                                              <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                              <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                                                <strong>العمل بالحديث: </strong>
                                                {curated.actionTip}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 6. CLASSIC SEQUENTIAL PAGINATED VIEW */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
              <span>{activeBookMeta.title}</span>
              <span className="text-stone-400">·</span>
              <span className="text-amber-700 dark:text-amber-400 tabular-nums">
                عدد الأحاديث: {totalFilteredCount.toLocaleString('en-US')} حديث
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <span className="text-xs font-bold text-stone-600 dark:text-stone-400 tabular-nums px-2">
                  صفحة {currentPage} من {totalPages.toLocaleString('en-US')}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {paginatedBookHadiths.map(h => {
              const uniqueId = `${selectedBookId}-${h.n}`;
              const isMemorized = memorizedHadiths.includes(uniqueId);
              const isSpeaking = speakingId === uniqueId;
              const ch = chapterMap.get(h.c);
              const curated = CURATED_HADITH_BY_KEY.get(`${selectedBookId}:${h.n}`);

              return (
                <div
                  key={uniqueId}
                  className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-5 sm:p-7 flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2 font-bold">
                      <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300">
                        {activeBookMeta.title}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 tabular-nums">
                        حديث رقم ({h.n})
                      </span>
                      {ch && (
                        <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                          {ch.number}. {ch.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSpeak(uniqueId, h.t)}
                        title="الاستماع للحديث"
                        className={`p-2 rounded-xl transition ${
                          isSpeaking
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => toggleMemorized(uniqueId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isMemorized
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isMemorized ? 'حفظت الحديث' : 'حفظ'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#fffdf7] dark:bg-stone-950/70 border border-amber-200/70 dark:border-stone-800 p-5 sm:p-6">
                    <p className="text-xl sm:text-2xl leading-[2.2] font-amiri font-bold text-stone-900 dark:text-stone-100 whitespace-pre-line select-text">
                      {h.t}
                    </p>
                  </div>

                  {curated && (
                    <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Sparkles className="w-4 h-4" />
                        <span>الشرح والبيان:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                        {curated.kidsExplanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
