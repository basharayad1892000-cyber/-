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
  Star 
} from 'lucide-react';
import { CATEGORIES, DhikrCategory } from '../data/azkarData';

interface CategoryNavProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  favoritesCount: number;
  completedCountsByCategory: Record<string, number>;
  totalCountsByCategory: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategoryId,
  onSelectCategory,
  favoritesCount,
  completedCountsByCategory,
  totalCountsByCategory,
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'morning':
        return <Sun className="w-4 h-4" />;
      case 'evening':
        return <Sunset className="w-4 h-4" />;
      case 'sleep':
        return <Moon className="w-4 h-4" />;
      case 'prayer':
        return <Sparkles className="w-4 h-4" />;
      case 'general':
        return <Compass className="w-4 h-4" />;
      case 'quranic':
        return <BookOpen className="w-4 h-4" />;
      case 'prophetic':
        return <HeartHandshake className="w-4 h-4" />;
      case 'ruqyah':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full">
      {/* Scrollable Category Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat: DhikrCategory) => {
          const isSelected = selectedCategoryId === cat.id;
          const completed = completedCountsByCategory[cat.id] || 0;
          const total = totalCountsByCategory[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-800 dark:bg-emerald-700 dark:border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <span className={isSelected ? 'text-amber-300' : 'text-stone-400 dark:text-stone-500'}>
                {getCategoryIcon(cat.id)}
              </span>
              <span>{cat.title}</span>

              {/* Unboxed progress count */}
              <span className={`text-xs tabular-nums ${isSelected ? 'text-emerald-200' : 'text-stone-400 dark:text-stone-500'}`}>
                {completed > 0 ? `${completed}/${total}` : total}
              </span>
            </button>
          );
        })}

        {/* Favorites shortcut tab */}
        {favoritesCount > 0 && (
          <button
            onClick={() => onSelectCategory('favorites')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border shrink-0 ${
              selectedCategoryId === 'favorites'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300'
            }`}
          >
            <Star className={`w-4 h-4 ${selectedCategoryId === 'favorites' ? 'fill-current' : 'text-amber-500'}`} />
            <span>المفضلة</span>
            <span className="text-xs tabular-nums opacity-80">({favoritesCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};
