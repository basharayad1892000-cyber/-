/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  BookMarked,
  Library,
  Calendar,
  Home,
  WifiOff,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { AZKAR_DATABASE, CATEGORIES, DhikrItem } from './data/azkarData';
import { useAzkarStorage } from './hooks/useAzkarStorage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header } from './components/Header';
import { HomeLauncher, AppSectionId } from './components/HomeLauncher';
import { SequentialDhikrView } from './components/SequentialDhikrView';
import { QuranKhatmahSection } from './components/QuranKhatmahSection';
import { HadithBooksSection } from './components/HadithBooksSection';
import { HijriCalendarSection } from './components/HijriCalendarSection';
import { TasbeehSection } from './components/TasbeehSection';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { AddDhikrModal } from './components/AddDhikrModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { TimeGreetingBanner } from './components/TimeGreetingBanner';
import {
  CustomGradientConfig,
  loadSavedGradientConfig,
  saveGradientConfig,
  applyGradientToDOM,
} from './utils/themePalette';

const ONBOARDING_STORAGE_KEY = 'azkari_onboarding_completed_v1';

export default function App() {
  const {
    theme,
    toggleTheme,
    counts,
    incrementCount,
    resetCount,
    resetCategoryCounts,
    favorites,
    toggleFavorite,
    fontSize,
    setFontSize,
    showTashkeel,
    setShowTashkeel,
    soundEnabled,
    setSoundEnabled,
    hapticEnabled,
    setHapticEnabled,
    dailyStats,
    customAzkar,
    addCustomDhikr,
    deleteCustomDhikr,
    customTasbeehPresets,
    addCustomTasbeehPreset,
    deleteCustomTasbeehPreset,
  } = useAzkarStorage();

  const isOnline = useOnlineStatus();
  const [activeSection, setActiveSection] = useState<AppSectionId>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddDhikrOpen, setIsAddDhikrOpen] = useState(false);
  const [sharingItem, setSharingItem] = useState<DhikrItem | null>(null);
  const [showGreetingBanner, setShowGreetingBanner] = useState<boolean>(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });
  const [gradientConfig, setGradientConfig] = useState<CustomGradientConfig>(() =>
    loadSavedGradientConfig()
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement);
  });
  const [autoFullscreen, setAutoFullscreen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('azkari_auto_fullscreen');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [showFullscreenWelcome, setShowFullscreenWelcome] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    const isStandalonePWA =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const currentlyFull = Boolean(
      document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );
    try {
      const saved = localStorage.getItem('azkari_auto_fullscreen');
      const shouldAuto = saved === null ? true : saved === 'true';
      return shouldAuto && !isStandalonePWA && !currentlyFull;
    } catch {
      return !isStandalonePWA && !currentlyFull;
    }
  });

  // Save autoFullscreen preference
  useEffect(() => {
    try {
      localStorage.setItem('azkari_auto_fullscreen', String(autoFullscreen));
    } catch {
      // Ignore storage errors
    }
  }, [autoFullscreen]);

  // Helper to enter fullscreen and hide Chrome top bar
  const enterFullscreen = async () => {
    try {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen({ navigationUI: 'hide' });
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch {
      // Ignore if blocked by iframe permissions or browser policy
    }
  };

  const exitFullscreen = async () => {
    try {
      const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void>;
      };
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
    } catch {
      // Ignore errors
    }
  };

  const handleToggleFullscreen = () => {
    const currentlyFull = Boolean(
      document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
    );
    if (currentlyFull) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // Track fullscreen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(active);
      if (active) {
        setShowFullscreenWelcome(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  // Automatically enter fullscreen on initial load (if allowed) or first user click/tap
  useEffect(() => {
    if (!autoFullscreen) return;

    // Attempt immediately on load (works in installed PWAs / TWAs)
    enterFullscreen();

    const handleFirstClickOrTap = () => {
      const currentlyFull = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      if (!currentlyFull && autoFullscreen) {
        enterFullscreen();
      }
      setShowFullscreenWelcome(false);
      window.removeEventListener('click', handleFirstClickOrTap);
      window.removeEventListener('touchend', handleFirstClickOrTap);
    };

    window.addEventListener('click', handleFirstClickOrTap, { once: true });
    window.addEventListener('touchend', handleFirstClickOrTap, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstClickOrTap);
      window.removeEventListener('touchend', handleFirstClickOrTap);
    };
  }, [autoFullscreen]);

  // Apply custom color gradient to root CSS variables whenever it changes
  useEffect(() => {
    applyGradientToDOM(gradientConfig);
    saveGradientConfig(gradientConfig);
  }, [gradientConfig]);

  // Combine standard azkar database with user's custom added azkar
  const allAzkar = useMemo(() => {
    return [...AZKAR_DATABASE, ...customAzkar];
  }, [customAzkar]);

  // Determine the selected Azkar category key if activeSection starts with 'azkar-'
  const activeAzkarCategoryId = useMemo(() => {
    if (!activeSection.startsWith('azkar-')) return 'morning';
    return activeSection.replace('azkar-', '');
  }, [activeSection]);

  // Items for the currently selected Azkar category
  const activeCategoryItems = useMemo(() => {
    if (activeAzkarCategoryId === 'favorites') {
      return allAzkar.filter(it => favorites.includes(it.id));
    }
    return allAzkar.filter(it => it.category === activeAzkarCategoryId);
  }, [allAzkar, activeAzkarCategoryId, favorites]);

  // Metadata for the currently selected Azkar category
  const activeCategoryMeta = useMemo(() => {
    if (activeAzkarCategoryId === 'favorites') {
      return {
        id: 'favorites',
        title: 'أذكاري المفضلة',
        subtitle: 'مجموعة الأذكار والأدعية التي اخترت المداومة عليها يومياً',
      };
    }
    const found = CATEGORIES.find(c => c.id === activeAzkarCategoryId);
    return found || { id: 'morning', title: 'أذكار الصباح', subtitle: 'حصن المسلم اليومي' };
  }, [activeAzkarCategoryId]);

  // Completed counts grouped by category for the HomeLauncher cards
  const completedCountsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allAzkar.forEach(it => {
      const current = counts[it.id] || 0;
      if (current >= it.count) {
        map[it.category] = (map[it.category] || 0) + 1;
      }
    });
    return map;
  }, [counts, allAzkar]);

  // Total counts grouped by category for the HomeLauncher cards
  const totalCountsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allAzkar.forEach(it => {
      map[it.category] = (map[it.category] || 0) + 1;
    });
    return map;
  }, [allAzkar]);

  const handleResetCurrentCategory = () => {
    const ids = activeCategoryItems.map(it => it.id);
    resetCategoryCounts(ids);
  };

  const handleResetAllCounts = () => {
    const allIds = allAzkar.map(it => it.id);
    resetCategoryCounts(allIds);
  };

  // Navigate between sections; automatically reset Azkar counters when exiting an Azkar section
  const handleSelectSection = (nextSection: AppSectionId) => {
    if (activeSection.startsWith('azkar-') && nextSection !== activeSection) {
      const ids = activeCategoryItems.map(it => it.id);
      resetCategoryCounts(ids);
    }
    setActiveSection(nextSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore storage errors
    }
  };

  const isMorningGreetingTime = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 4 && hour < 12;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-[#0b1120] text-stone-900 dark:text-stone-100 transition-colors font-cairo">
      {/* Top Bar Header */}
      <Header
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        theme={theme}
        onToggleTheme={toggleTheme}
        gradientConfig={gradientConfig}
        onChangeGradient={setGradientConfig}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTour={() => setIsOnboardingOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeSection === 'home' && (
          <div className="space-y-6">
            {showGreetingBanner && (
              <TimeGreetingBanner
                onSelectSection={handleSelectSection}
                onOpenOnboardingTour={() => setIsOnboardingOpen(true)}
                onDismiss={() => setShowGreetingBanner(false)}
              />
            )}

            <HomeLauncher
              onSelectSection={handleSelectSection}
              completedCountsByCategory={completedCountsByCategory}
              totalCountsByCategory={totalCountsByCategory}
              favoritesCount={favorites.length}
              streakDays={dailyStats.streakDays}
              todayCount={dailyStats.todayCount}
            />
          </div>
        )}

        {activeSection.startsWith('azkar-') && (
          <SequentialDhikrView
            key={activeSection}
            categoryTitle={activeCategoryMeta.title}
            categorySubtitle={activeCategoryMeta.subtitle}
            items={activeCategoryItems}
            counts={counts}
            onIncrement={(id, target) => incrementCount(id, target)}
            onResetItem={id => resetCount(id)}
            onResetCategory={handleResetCurrentCategory}
            favorites={favorites}
            onToggleFavorite={id => toggleFavorite(id)}
            fontSize={fontSize}
            showTashkeel={showTashkeel}
            onOpenShare={item => setSharingItem(item)}
            onOpenAddDhikr={() => setIsAddDhikrOpen(true)}
            onDeleteCustomDhikr={deleteCustomDhikr}
            onBackHome={() => handleSelectSection('home')}
          />
        )}

        {activeSection === 'quran-khatmah' && (
          <QuranKhatmahSection onBackHome={() => handleSelectSection('home')} />
        )}

        {activeSection === 'hadith-books' && (
          <HadithBooksSection onBackHome={() => handleSelectSection('home')} />
        )}

        {activeSection === 'hijri-calendar' && (
          <HijriCalendarSection onBackHome={() => handleSelectSection('home')} />
        )}

        {activeSection === 'tasbeeh' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50/70 dark:from-rose-950/40 dark:via-stone-900 dark:to-stone-900 border border-rose-200/80 dark:border-rose-800/50 rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => handleSelectSection('home')}
                  className="p-3 rounded-2xl bg-white dark:bg-stone-800 hover:bg-rose-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 shadow-xs transition"
                  title="العودة للرئيسية"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-rose-950 dark:text-rose-100 font-amiri">
                    السبحة الإلكترونية الذكية
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                    تسبيح مريح مع حفظ تلقائي لعداد السبحة ودوراتك المكتملة
                  </p>
                </div>
              </div>
            </div>

            <TasbeehSection
              soundEnabled={soundEnabled}
              hapticEnabled={hapticEnabled}
              onIncrementDaily={() => {
                incrementCount('tasbeeh_general', 1);
              }}
              customPresets={customTasbeehPresets}
              onAddPreset={addCustomTasbeehPreset}
              onDeletePreset={deleteCustomTasbeehPreset}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
          <button
            onClick={() => handleSelectSection('home')}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeSection === 'home' || activeSection.startsWith('azkar-')
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">الأذكار</span>
          </button>

          <button
            onClick={() => handleSelectSection('quran-khatmah')}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeSection === 'quran-khatmah'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">الختمة</span>
          </button>

          <button
            onClick={() => handleSelectSection('hadith-books')}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeSection === 'hadith-books'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Library className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">الحديث</span>
          </button>

          <button
            onClick={() => handleSelectSection('hijri-calendar')}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeSection === 'hijri-calendar'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">التقويم</span>
          </button>

          <button
            onClick={() => handleSelectSection('tasbeeh')}
            className={`flex flex-col items-center justify-center transition-colors ${
              activeSection === 'tasbeeh'
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">السبحة</span>
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400 bg-white/50 dark:bg-stone-950/50 mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-amiri text-sm font-semibold text-stone-700 dark:text-stone-300">
            «أَلاَ بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» [الرعد: 28]
          </p>
          <div className="flex items-center justify-center gap-2 text-stone-400 dark:text-stone-500">
            <span>تطبيق أذكاري</span>
            <span aria-hidden="true">·</span>
            <span>الأذكار والقرآن الكريم والأحاديث الصحيحة والتقويم الهجري</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showTashkeel={showTashkeel}
        setShowTashkeel={setShowTashkeel}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        hapticEnabled={hapticEnabled}
        setHapticEnabled={setHapticEnabled}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        autoFullscreen={autoFullscreen}
        setAutoFullscreen={setAutoFullscreen}
        onResetAllCounts={handleResetAllCounts}
      />

      {/* Share Modal */}
      <ShareModal
        item={sharingItem}
        onClose={() => setSharingItem(null)}
      />

      {/* Add Custom Dhikr Modal */}
      <AddDhikrModal
        isOpen={isAddDhikrOpen}
        onClose={() => setIsAddDhikrOpen(false)}
        categoryId={activeAzkarCategoryId === 'favorites' ? 'general' : activeAzkarCategoryId}
        categoryName={activeCategoryMeta.title}
        onAdd={addCustomDhikr}
      />

      {/* Interactive Onboarding Guided Tour Modal (appears on first launch or when user clicks Help) */}
      <OnboardingTourModal
        isOpen={isOnboardingOpen && !showFullscreenWelcome}
        onClose={handleCloseOnboarding}
        onNavigateToSection={handleSelectSection}
      />

      {/* Welcome 1-Tap Fullscreen Entry Prompt with Time-Based Greeting */}
      {showFullscreenWelcome && !isFullscreen && (
        <div
          onClick={() => {
            enterFullscreen();
            setShowFullscreenWelcome(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in cursor-pointer"
        >
          <div
            onClick={e => {
              e.stopPropagation();
              enterFullscreen();
              setShowFullscreenWelcome(false);
            }}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-stone-800 p-6 text-center shadow-2xl space-y-4"
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md"
              style={{
                background: 'linear-gradient(135deg, var(--app-grad-from, #047857), var(--app-grad-to, #0f766e))',
              }}
            >
              <Maximize2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block text-xs font-bold text-amber-600 dark:text-amber-400">
                {isMorningGreetingTime ? 'صبّحك الله بالخير والنور' : 'مسّاك الله بالخير والسكينة'}
              </span>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-amiri">
                مرحباً بك في تطبيق أذكاري
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                اضغط للدخول بوضع ملء الشاشة وإخفاء الشريط العلوي للمتصفح لتجربة قراءة مريحة وكاملة
              </p>
            </div>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                enterFullscreen();
                setShowFullscreenWelcome(false);
              }}
              className="w-full py-3.5 px-5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98"
              style={{
                background: 'linear-gradient(135deg, var(--app-grad-from, #047857), var(--app-grad-to, #0f766e))',
              }}
            >
              <Maximize2 className="w-4 h-4" />
              <span>الدخول بوضع ملء الشاشة</span>
            </button>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setShowFullscreenWelcome(false);
              }}
              className="text-[11px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition block mx-auto"
            >
              المتابعة بالوضع العادي
            </button>
          </div>
        </div>
      )}

      {/* Offline Toast Indicator */}
      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-5 left-5 z-50 flex items-center gap-2 rounded-xl bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span>أنت الآن في وضع عدم الاتصال (يعمل التطبيق بدون إنترنت)</span>
        </div>
      )}
    </div>
  );
}
