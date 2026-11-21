import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resultCount?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  resultCount,
}) => {
  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute right-4 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ابحث في نصوص الأذكار وفضلها ومصدرها (مثلاً: الكرسي، الاستغفار، الكرب، الرزق)..."
          className="w-full pr-11 pl-10 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition-colors shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchQuery && typeof resultCount === 'number' && (
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 pr-2">
          تم العثور على <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{resultCount}</span> ذكر يطابق البحث
        </p>
      )}
    </div>
  );
};
