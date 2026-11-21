import React, { useState } from 'react';
import { X, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { DhikrItem } from '../data/azkarData';

interface ShareModalProps {
  item: DhikrItem | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ item, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const shareText = `« ${item.tashkeelText} »\n\n✨ الفضل: ${item.fadl || 'ذكر مبارك'}\n📖 المصدر: ${item.source}\n\n- تطبيق أذكاري`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.categoryName,
          text: shareText,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 sm:p-7">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {item.categoryName}
          </span>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">
            مشاركة بطاقة الذكر
          </h3>
        </div>

        {/* Beautiful Preview Card */}
        <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-950 text-amber-50 shadow-inner border border-amber-500/20 text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/80 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <p className="font-amiri text-lg sm:text-xl leading-[2.1] text-white">
            {item.tashkeelText}
          </p>

          <div className="pt-3 border-t border-amber-500/20 text-xs text-stone-300 space-y-1">
            {item.fadl && <p className="text-amber-200/90">{item.fadl}</p>}
            <p className="opacity-70 text-[11px] tabular-nums">{item.source}</p>
          </div>

          <div className="text-[10px] text-emerald-300/60 pt-1">
            أذكاري · حصن المسلم والورد اليومي
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-sm transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم النسخ للحافظة</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ النص</span>
              </>
            )}
          </button>

          <button
            onClick={handleNativeShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة مباشرة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
