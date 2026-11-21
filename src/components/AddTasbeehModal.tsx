import React, { useState } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';

interface AddTasbeehModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; target: number; virtue?: string }) => void;
}

export const AddTasbeehModal: React.FC<AddTasbeehModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState<number>(33);
  const [virtue, setVirtue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة صيغة التسبيح أو الذكر أولاً.');
      return;
    }

    onAdd({
      name: name.trim(),
      target: Math.max(1, target || 33),
      virtue: virtue.trim() || 'تسبيح مخصص أضافه المستخدم',
    });

    setName('');
    setTarget(33);
    setVirtue('');
    setError('');
    onClose();
  };

  const targetPresets = [33, 100, 300, 1000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-cairo">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                إضافة تسبيح جديد للسبحة
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                صيغة تسبيح خاصة تظهر في خيارات السبحة الإلكترونية
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 font-semibold">
              {error}
            </div>
          )}

          {/* Preset Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              صيغة التسبيح أو الذكر <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ"
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 font-amiri text-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
            />
          </div>

          {/* Default Target */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              هدف الدورة الواحدة
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={target}
                onChange={e => setTarget(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-center text-sm"
              />
              <div className="flex items-center gap-1.5 flex-1">
                {targetPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTarget(preset)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors tabular-nums ${
                      target === preset
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

          {/* Virtue (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              فضل الذكر أو ملاحظة (اختياري)
            </label>
            <input
              type="text"
              value={virtue}
              onChange={e => setVirtue(e.target.value)}
              placeholder="مثال: دعوة ذي النون التي ما دعا بها مسلم في كرب إلا فرج الله عنه"
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
              <span>إضافة للتسبيح</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
