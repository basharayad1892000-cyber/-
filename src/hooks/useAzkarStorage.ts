import { useState, useEffect, useCallback } from 'react';
import { playBeadSound, playCompletionChime, triggerHaptic } from '../utils/soundHelper';
import { DhikrItem, TasbeehPreset } from '../data/azkarData';

const STORAGE_KEYS = {
  COUNTS: 'azkar_item_counts_v1',
  FAVORITES: 'azkar_favorites_v1',
  THEME: 'azkar_theme_mode',
  FONT_SIZE: 'azkar_font_size',
  SHOW_TASHKEEL: 'azkar_show_tashkeel',
  SOUND_ENABLED: 'azkar_sound_enabled',
  HAPTIC_ENABLED: 'azkar_haptic_enabled',
  DAILY_STATS: 'azkar_daily_stats_v1',
  TASBEEH_COUNT: 'azkar_tasbeeh_count_v1',
  TASBEEH_ROUNDS: 'azkar_tasbeeh_rounds_v1',
  CUSTOM_AZKAR: 'azkar_custom_items_v1',
  CUSTOM_TASBEEH: 'azkar_custom_tasbeeh_v1',
};

export type FontSizeOption = 'normal' | 'large' | 'xlarge';

export interface DailyStats {
  todayCount: number;
  totalHistorical: number;
  streakDays: number;
  lastDate: string;
}

export function useAzkarStorage() {
  // Theme state: defaults to dark or system preference, or light
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Dhikr counts map: dhikrId -> current recited count (starts at 0)
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COUNTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Favorites list
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User's custom added azkar
  const [customAzkar, setCustomAzkar] = useState<DhikrItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_AZKAR);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User's custom added tasbeeh presets
  const [customTasbeehPresets, setCustomTasbeehPresets] = useState<TasbeehPreset[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TASBEEH);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Display and Audio Preferences
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    if (typeof window === 'undefined') return 'large';
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as FontSizeOption;
    return saved || 'large';
  });

  const [showTashkeel, setShowTashkeelState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_TASHKEEL);
    return saved !== null ? saved === 'true' : true;
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.HAPTIC_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  // Daily stats & streak
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultStats: DailyStats = {
      todayCount: 0,
      totalHistorical: 0,
      streakDays: 1,
      lastDate: today,
    };
    if (typeof window === 'undefined') return defaultStats;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
      if (!saved) return defaultStats;
      const parsed = JSON.parse(saved);
      if (parsed.lastDate !== today) {
        // Check if yesterday to maintain streak
        const last = new Date(parsed.lastDate);
        const curr = new Date(today);
        const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
        const newStreak = diffDays === 1 ? parsed.streakDays + 1 : (diffDays === 0 ? parsed.streakDays : 1);
        return {
          todayCount: 0,
          totalHistorical: parsed.totalHistorical || 0,
          streakDays: newStreak,
          lastDate: today,
        };
      }
      return parsed;
    } catch {
      return defaultStats;
    }
  });

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Persist counts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COUNTS, JSON.stringify(counts));
    } catch {
      // Ignore
    }
  }, [counts]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch {
      // Ignore
    }
  }, [favorites]);

  // Persist daily stats
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(dailyStats));
    } catch {
      // Ignore
    }
  }, [dailyStats]);

  // Persist custom azkar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_AZKAR, JSON.stringify(customAzkar));
    } catch {
      // Ignore
    }
  }, [customAzkar]);

  // Persist custom tasbeeh presets
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TASBEEH, JSON.stringify(customTasbeehPresets));
    } catch {
      // Ignore
    }
  }, [customTasbeehPresets]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setFontSize = useCallback((size: FontSizeOption) => {
    setFontSizeState(size);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
  }, []);

  const setShowTashkeel = useCallback((val: boolean) => {
    setShowTashkeelState(val);
    localStorage.setItem(STORAGE_KEYS.SHOW_TASHKEEL, String(val));
  }, []);

  const setSoundEnabled = useCallback((val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(val));
  }, []);

  const setHapticEnabled = useCallback((val: boolean) => {
    setHapticEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.HAPTIC_ENABLED, String(val));
  }, []);

  // Increment counter for a specific dhikr
  const incrementCount = useCallback((id: string, target = 1) => {
    const current = counts[id] || 0;
    const next = current + 1;

    setCounts(prev => ({
      ...prev,
      [id]: next,
    }));

    // Daily stats update
    setDailyStats(prev => ({
      ...prev,
      todayCount: prev.todayCount + 1,
      totalHistorical: prev.totalHistorical + 1,
    }));

    // Feedback
    triggerHaptic(hapticEnabled);
    if (next === target) {
      playCompletionChime(soundEnabled);
    } else {
      playBeadSound(soundEnabled);
    }
  }, [counts, hapticEnabled, soundEnabled]);

  // Decrement if misclicked
  const decrementCount = useCallback((id: string) => {
    setCounts(prev => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return {
        ...prev,
        [id]: current - 1,
      };
    });
  }, []);

  // Reset a single dhikr counter
  const resetCount = useCallback((id: string) => {
    setCounts(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  // Complete a dhikr (set to target)
  const completeDhikr = useCallback((id: string, target: number) => {
    const current = counts[id] || 0;
    const added = Math.max(0, target - current);
    setCounts(prev => ({
      ...prev,
      [id]: target,
    }));
    if (added > 0) {
      setDailyStats(prev => ({
        ...prev,
        todayCount: prev.todayCount + added,
        totalHistorical: prev.totalHistorical + added,
      }));
    }
    playCompletionChime(soundEnabled);
    triggerHaptic(hapticEnabled);
  }, [counts, soundEnabled, hapticEnabled]);

  // Reset all counts for a category
  const resetCategoryCounts = useCallback((itemIds: string[]) => {
    setCounts(prev => {
      const next = { ...prev };
      itemIds.forEach(id => {
        delete next[id];
      });
      return next;
    });
  }, []);

  // Mark all completed for a category
  const completeAllCategoryCounts = useCallback((items: { id: string; count: number }[]) => {
    setCounts(prev => {
      const next = { ...prev };
      items.forEach(it => {
        next[it.id] = it.count;
      });
      return next;
    });
    playCompletionChime(soundEnabled);
  }, [soundEnabled]);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(fId => fId !== id);
      }
      return [...prev, id];
    });
  }, []);

  // Add a new custom dhikr
  const addCustomDhikr = useCallback(
    (params: {
      category: string;
      categoryName: string;
      text: string;
      tashkeelText?: string;
      plainText?: string;
      count: number;
      fadl?: string;
      source?: string;
    }) => {
      const id = `custom-dhikr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const cleanText = params.text.trim();
      const newItem: DhikrItem = {
        id,
        category: params.category,
        categoryName: params.categoryName,
        text: cleanText,
        tashkeelText: (params.tashkeelText || cleanText).trim(),
        plainText: (params.plainText || cleanText).trim(),
        count: Math.max(1, params.count || 1),
        fadl: params.fadl?.trim() || 'ذكر ودعاء أضافه المستخدم',
        source: params.source?.trim() || 'إضافة خاصة',
        isCustom: true,
        createdAt: Date.now(),
      };

      setCustomAzkar(prev => [...prev, newItem]);
      return newItem;
    },
    []
  );

  // Delete custom dhikr
  const deleteCustomDhikr = useCallback((id: string) => {
    setCustomAzkar(prev => prev.filter(item => item.id !== id));
    setCounts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFavorites(prev => prev.filter(fId => fId !== id));
  }, []);

  // Add custom tasbeeh preset
  const addCustomTasbeehPreset = useCallback(
    (params: { name: string; target: number; virtue?: string }) => {
      const id = `custom-tasbeeh-${Date.now()}`;
      const newPreset: TasbeehPreset = {
        id,
        name: params.name.trim(),
        target: Math.max(1, params.target || 33),
        virtue: params.virtue?.trim() || 'تسبيح مخصص أضافه المستخدم',
        isCustom: true,
      };

      setCustomTasbeehPresets(prev => [...prev, newPreset]);
      return newPreset;
    },
    []
  );

  // Delete custom tasbeeh preset
  const deleteCustomTasbeehPreset = useCallback((id: string) => {
    setCustomTasbeehPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    theme,
    toggleTheme,
    counts,
    incrementCount,
    decrementCount,
    resetCount,
    completeDhikr,
    resetCategoryCounts,
    completeAllCategoryCounts,
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
  };
}
