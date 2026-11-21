import React, { useState } from 'react';
import { X, Plus, Sparkles, BookOpen, Hash, Bookmark } from 'lucide-react';

interface AddDhikrModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  onAdd: (data: {
    category: string;
    categoryName: string;
    text: string;
    tashkeelText?: string;
    plainText?: string;
    count: number;
    fadl?: string;
    source?: string;
  }) => void;
}

export const AddDhikrModal: React.FC<AddDhikrModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  onAdd,
}) => {
  const [text, setText] = useState('');
  const [count, setCount] = useState<number>(3);
  const [fadl, setFadl] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('يرجى كتابة نص الذكر أو الدعاء أولاً.');
      return;
    }

    onAdd({
      category: categoryId === 'favorites' ? 'general' : categoryId,
      categoryName: categoryId === 'favorites' ? 'أذكار عامة' : categoryName,
      text: text.trim(),
      tashkeelText: text.trim(),
      plainText: text.trim(),
      count: Math.max(1, count || 1),
      fadl: fadl.trim() || 'ذكر أو دعاء خاص أضافه المستخدم',
      source: source.trim() || 'إضافة خاصة',
    });

    // Reset and close
    setText('');
    setCount(3);
    setFadl('');
    setSource('');
    setError('');
    onClose();
  };

  const countPresets = [1, 3, 7, 10, 33, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-cairo">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                إضافة ذكر خاص جديد
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                يُحفظ في قسم: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{categoryName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 font-semibold">
              {error}
            </div>
          )}

          {/* Dhikr text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              نَص الذكر أو الدعاء <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              placeholder="اكتب نص الذكر أو الدعاء هنا (مثال: رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ)..."
              className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-amiri text-lg leading-relaxed text-right resize-none"
            />
          </div>

          {/* Count target */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              عدد مرات التكرار المطلوبة
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={count}
                onChange={e => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-center text-sm"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
                {countPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCount(preset)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors tabular-nums ${
                      count === preset
                        ? 'bg-emerald-800 text-white dark:bg-emerald-600'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Virtue / Fadl (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              الفضل أو المناسبة أو السبب (اختياري)
            </label>
            <input
              type="text"
              value={fadl}
              onChange={e => setFadl(e.target.value)}
              placeholder="مثال: دعاء مستجاب بعد الأذان، أو ورد يومي أوصاني به شيخي"
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Source (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              المصدر أو الراوي (اختياري)
            </label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="مثال: سورة البقرة: 201، أو صحيح مسلم"
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ وإضافة الذكر</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
