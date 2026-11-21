import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  BookMarked,
  GitBranch,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
} from 'lucide-react';
import { AppSectionId } from './HomeLauncher';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (section: AppSectionId) => void;
}

interface TourStep {
  stepNumber: number;
  badge: string;
  title: string;
  description: string;
  tips: string[];
  targetSection: AppSectionId;
  targetButtonLabel: string;
  icon: React.ReactNode;
  accentClass: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    badge: 'الخطوة 1 من 5 · الأذكار اليومية',
    title: 'قراءة الأذكار بالتسلسل الذكي وتصفير العداد تلقائياً',
    description:
      'يعرض التطبيق كل ذكر في بطاقة مستقلة واضحة مع عداد كبير؛ وبمجرد إتمام العدد المطلوب ينتقل بك تلقائياً إلى الذكر التالي.',
    tips: [
      'اضغط على بطاقة الذكر أو زر العداد الكبير لاحتساب كل قراءة.',
      'يتصفر عداد قسم الأذكار تلقائياً بمجرد إتمام القسم أو الخروج للصفحة الرئيسية ليكون جاهزاً للمرة القادمة.',
      'يمكنك إضافة أذكارك وأدعيتك الخاصة في نهاية أي قسم.',
    ],
    targetSection: 'azkar-morning',
    targetButtonLabel: 'تجربة أذكار الصباح الآن',
    icon: <Sparkles className="w-7 h-7 text-amber-500" />,
    accentClass: 'from-amber-500 to-emerald-600',
  },
  {
    stepNumber: 2,
    badge: 'الخطوة 2 من 5 · تدبر الذكر والصوت',
    title: 'واحة تدبر الذكر والاستماع الصوتي بالتشكيل',
    description:
      'لكل ذكر في التطبيق أيقونة «تدبر الذكر» في أسفل يسار البطاقة تفتح لك شرحاً قلبياً ومعرفياً شاملاً.',
    tips: [
      'اضغط على زر «تدبر الذكر» في أسفل يسار أي ذكر لعرض المعنى الإجمالي، لطائف الكلمات، والأثر الإيماني.',
      'استخدم أيقونة السماعة أعلى البطاقة للاستماع لنطق الذكر، وأيقونة النجمة لحفظه في المفضلة.',
    ],
    targetSection: 'azkar-evening',
    targetButtonLabel: 'استعراض أذكار المساء والتدبر',
    icon: <Lightbulb className="w-7 h-7 text-emerald-500" />,
    accentClass: 'from-emerald-600 to-teal-600',
  },
  {
    stepNumber: 3,
    badge: 'الخطوة 3 من 5 · السبحة الإلكترونية',
    title: 'السبحة الذكية بزر التسبيح المركزي وحفظ العداد',
    description:
      'صُمم قسم السبحة بزر تسبيح كبير في منتصف الشاشة مع تأثير بصري أنيق عند كل نقرة واهتزاز خفيف.',
    tips: [
      'يبقى عداد السبحة الحرة محفوظاً حتى عند الخروج للصفحة الرئيسية فلا يضيع وردك اليومي.',
      'اختر صيغة التسبيح أو أضف تسبيحك الخاص مع تحديد الهدف (33 أو 100 أو مفتوح).',
    ],
    targetSection: 'tasbeeh',
    targetButtonLabel: 'فتح السبحة الإلكترونية',
    icon: <CheckCircle2 className="w-7 h-7 text-rose-500" />,
    accentClass: 'from-rose-500 to-amber-500',
  },
  {
    stepNumber: 4,
    badge: 'الخطوة 4 من 5 · المصحف وورد ليلة الجمعة',
    title: 'المصحف الكامل بدون إنترنت، البحث الفوري، وورد ليلة الجمعة',
    description:
      'جميع سور القرآن الـ 114 محفوظة داخل التطبيق بالرسم العثماني مع محرك بحث ذكي عن أي آية أو كلمة.',
    tips: [
      'ابحث عن أي كلمة من آية وستنتقل مباشرة إلى موضعها داخل السورة مع تمييزها باللون الأخضر.',
      'تفقّد تبويب «ورد ليلة الجمعة» بجانب جدول الختمة لقراءة سور الكهف، يس، الواقعة، الدخان، والملك.',
    ],
    targetSection: 'quran-khatmah',
    targetButtonLabel: 'فتح المصحف وورد ليلة الجمعة',
    icon: <BookMarked className="w-7 h-7 text-teal-500" />,
    accentClass: 'from-teal-600 to-emerald-700',
  },
  {
    stepNumber: 5,
    badge: 'الخطوة 5 من 5 · موسوعة الحديث الشجرية',
    title: 'موسوعة الحديث الشاملة (12 كتاباً) بالتصفح الشجري الأصلي',
    description:
      'تحتوي الموسوعة على أكثر من 41,000 حديث نبوي محفوظة محلياً ومرتبة بشكل شجري: المصنّف ← الكتب الأصلية ← الأبواب الأصلية.',
    tips: [
      'اضغط على أي كتاب أصلي (مثل كتاب بدء الوحي أو كتاب الإيمان) لتنسدل أبوابه وأحاديثه بالترتيب الأصلي.',
      'استخدم شريط البحث للبحث بالكلمة أو الانتقال الفوري برقم الحديث في كتاب واحد أو في الكتب الـ 12 كلها.',
    ],
    targetSection: 'hadith-books',
    targetButtonLabel: 'تصفح شجرة كتب الحديث',
    icon: <GitBranch className="w-7 h-7 text-amber-600" />,
    accentClass: 'from-amber-600 to-orange-600',
  },
];

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSection,
}) => {
  const [stepIdx, setStepIdx] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[stepIdx] || TOUR_STEPS[0];
  const isLastStep = stepIdx === TOUR_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border-2 border-emerald-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-2xl space-y-6 text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Row: Step Indicator & Skip Button */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>دليل استخدام التطبيق · {currentStep.badge}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold transition"
          >
            <span>تخطي الجولة</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.stepNumber}
              type="button"
              onClick={() => setStepIdx(idx)}
              aria-label={`الخطوة ${s.stepNumber}`}
              className={`h-2.5 rounded-full transition-all ${
                idx === stepIdx
                  ? 'w-9 bg-emerald-600 dark:bg-emerald-400'
                  : 'w-2.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Main Step Hero Card */}
        <div className="rounded-3xl bg-stone-50/90 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700/70 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 flex items-center justify-center shadow-xs shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-amiri">
                {currentStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed mt-1">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Bullet Tips */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 p-4 space-y-2">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
              تلميحات سريعة:
            </span>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
              {currentStep.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Action to Try This Feature */}
          {onNavigateToSection && (
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onNavigateToSection(currentStep.targetSection);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition"
              >
                {currentStep.targetButtonLabel} ←
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx(prev => Math.max(0, prev - 1))}
            className="px-4 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الخطوة السابقة</span>
          </button>

          {isLastStep ? (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ابدأ استخدام التطبيق الآن</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIdx(prev => Math.min(TOUR_STEPS.length - 1, prev + 1))}
              className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <span>الخطوة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
