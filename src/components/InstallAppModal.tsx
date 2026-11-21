import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ArrowRight,
  Monitor,
  AppWindow
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'standalone' | 'apk'>('quick');

  if (!isOpen) return null;

  // Use the production shared URL or fallback to current origin
  const appUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('ais-dev') 
        ? window.location.origin.replace('ais-dev', 'ais-pre') 
        : window.location.origin) 
    : 'https://ais-pre-5blmmezfaua4ogv27jjhkt-207697029821.europe-west1.run.app';

  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(appUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const handleOpenStandaloneWindow = () => {
    if (typeof window === 'undefined') return;
    const w = Math.min(1150, window.screen.availWidth - 40);
    const h = Math.min(880, window.screen.availHeight - 60);
    const left = (window.screen.availWidth - w) / 2;
    const top = (window.screen.availHeight - h) / 2;
    window.open(
      window.location.href,
      'AzkarStandaloneWindow',
      `width=${w},height=${h},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no,personalbar=no,resizable=yes,scrollbars=yes`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fade-in font-cairo">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                تشغيل وتثبيت التطبيق بشكل مستقل
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                استخدم التطبيق كبرنامج مستقل على الكمبيوتر، كتطبيق هاتف، أو كملف APK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="إغلاق"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-1.5 gap-1.5 mx-5 sm:mx-6 mt-4 rounded-xl">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>تثبيت كبرنامج / تطبيق</span>
          </button>

          <button
            onClick={() => setActiveTab('standalone')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'standalone'
                ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <AppWindow className="w-4 h-4" />
            <span>نافذة مستقلة فورية</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-stone-800 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>ملف APK أندرويد</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Highlight card */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                      تطبيق PWA مثبت يعمل بشكل مستقل تماماً
                    </h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                      عند التثبيت يظهر التطبيق كبرنامج مستقل على شريط المهام (Taskbar) وسطح المكتب على الكمبيوتر، أو كأيقونة تطبيق كاملة على الهاتف، ويعمل حتى عند انقطاع الإنترنت بنسبة 100%!
                    </p>
                  </div>
                </div>

                {/* Direct Install Button if supported by browser */}
                {isInstallable && (
                  <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/60">
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <Download className="w-5 h-5" />
                      <span>تثبيت التطبيق الآن على هذا الجهاز</span>
                    </button>
                  </div>
                )}

                {isInstalled && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>التطبيق مثبت بالفعل ويعمل كبرنامج مستقل على جهازك!</span>
                  </div>
                )}
              </div>

              {/* Steps for Computers (Windows / Mac) */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2.5 bg-stone-50/50 dark:bg-stone-900/40">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>طريقة التثبيت كبرنامج كمبيوتر مستقل (Windows / Mac عبر Chrome أو Edge):</span>
                </h4>
                <ol className="text-xs space-y-1.5 text-stone-600 dark:text-stone-300 pr-4 list-decimal">
                  <li>في متصفحك (Chrome أو Edge)، ستجد أيقونة تثبيت صغيرة <strong>(⊕ أو شاشة مع سهم)</strong> في أقصى يمين شريط العنوان بالأعلى.</li>
                  <li>اضغط عليها ثم اختر <strong>«تثبيت أذكاري» (Install)</strong>.</li>
                  <li>سيتحول التطبيق فوراً إلى برنامج ويندوز أو ماك مستقل، يفتح بنافذة خاصة وله أيقونة في شريط المهام وقائمة Start!</li>
                </ol>
              </div>

              {/* Steps for Android Phones */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-2.5 bg-stone-50/50 dark:bg-stone-900/40">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>طريقة التثبيت على هواتف أندرويد (Chrome أو سامسونج):</span>
                </h4>
                <ol className="text-xs space-y-1.5 text-stone-600 dark:text-stone-300 pr-4 list-decimal">
                  <li>افتح الرابط في متصفح Chrome أو سامسونج على هاتفك.</li>
                  <li>اضغط على القائمة (<strong>الثلاث نقاط ⋮</strong>) ثم اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                </ol>
              </div>

              {/* Copy Link to open on phone */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-600 dark:text-stone-400 truncate dir-ltr text-left">
                  {appUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الرابط للهاتف</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'standalone' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                  <AppWindow className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>فتح التطبيق كنافذة برنامج مستقلة فوراً</span>
                </div>
                <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                  إذا كنت ترغب في تشغيل التطبيق في نافذة مستقلة خالية تماماً من أشرطة المتصفح، والتبويبات، وأزرار التنقل كما لو كان تطبيق سطح مكتب حقيقي، يمكنك الضغط على الزر بالأسفل.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleOpenStandaloneWindow}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
                >
                  <AppWindow className="w-5 h-5" />
                  <span>فتح تطبيق أذكاري في نافذة مستقلة الآن</span>
                </button>
              </div>

              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-xs text-stone-600 dark:text-stone-300 space-y-2 bg-stone-50/50 dark:bg-stone-900/40">
                <h4 className="font-bold text-stone-900 dark:text-stone-100">
                  مميزات التشغيل المستقل:
                </h4>
                <ul className="space-y-1.5 list-disc pr-4">
                  <li>التركيز الكامل على الأذكار دون تشتيت التبويبات الأخرى.</li>
                  <li>حجم نافذة مخصص ومثالي للقراءة والتسبيح اليومي.</li>
                  <li>أداء أسرع وعمل مستمر بدون اتصال بالإنترنت.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <Download className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>توليد وتنزيل ملف APK مستقل لأجهزة أندرويد</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  لأن التطبيق مبرمج وفق أعلى معايير PWA الحديثة، يمكنك تحويله إلى حزمة <strong>APK أصلية</strong> جاهزة للتثبيت المباشر على الأندرويد في ثوانٍ عبر أداة <strong>PWABuilder</strong> الرسمية.
                </p>
              </div>

              {/* Instructions */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-3 bg-stone-50/50 dark:bg-stone-900/40">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                  طريقة تنزيل ملف الـ APK في 3 خطوات بسيطة:
                </h4>
                <ol className="text-xs space-y-2.5 text-stone-600 dark:text-stone-300 pr-4 list-decimal leading-relaxed">
                  <li>
                    اضغط على الزر بالأسفل للانتقال إلى أداة <strong>PWABuilder</strong> (الرابط مُجهز مسبقاً بالتطبيق).
                  </li>
                  <li>
                    ستقوم الأداة بفحص ملف الـ Manifest والأيقونات وتظهر نتيجة التوافق (درجة كاملة 100%).
                  </li>
                  <li>
                    اضغط على <strong>«Package For Android»</strong> ثم اختر <strong>«Generate APK»</strong> ليتم تحميل ملف التطبيق بصيغة <code>.apk</code> فوراً لجهازك!
                  </li>
                </ol>
              </div>

              {/* Direct Link to PWABuilder with prefilled URL */}
              <div className="pt-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition text-center"
                >
                  <Download className="w-5 h-5" />
                  <span>فتح أداة تنزيل حزمة APK (PWABuilder)</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 text-stone-400 dark:text-stone-500 text-xs text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>حزمة معتمدة آمنة تماماً ومتوافقة مع جميع أجهزة أندرويد الحديثة</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950/60 border-t border-stone-100 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
