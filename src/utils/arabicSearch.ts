/**
 * Arabic text normalization and smart Uthmani + Imlai search utilities
 * for Quran Ayahs & Prophetic Hadiths.
 */

/**
 * Normalizes both Uthmani Quran script (الرسم العثماني) and modern standard Arabic (الرسم الإملائي)
 * into a unified searchable Arabic form.
 */
export function normalizeArabicForSearch(text: string): string {
  if (!text) return '';

  return (
    text
      // 1. Remove BOM and replace Quranic pause/sajdah/rub-el-hizb marks with a space
      .replace(/\uFEFF/g, '')
      .replace(/[\u06D6-\u06DC\u06DE\u06E9]/g, ' ')
      // 2. Convert Uthmani tatweel + hamza above/below (ـٔ / ـٕ) into standalone hamza before stripping harakat
      .replace(/\u0640[\u0654\u0655]/g, 'ء')
      // 3. Remove harakat, sukun, shadda, maddah, small high signs, tatweel
      //    (keep \u0670 dagger alif, \u06E5 small waw, \u06E6 small ya, \u0654/\u0655 combining hamzas for step 4-9)
      .replace(/[\u0610-\u061A\u064B-\u0653\u0656-\u065F\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0640]/g, '')
      // 4. Convert combining hamza (\u0654/\u0655) into ء unless already on أ/إ/ؤ/ئ
      .replace(/(?<![أإؤئ])[\u0654\u0655]/g, 'ء')
      .replace(/[\u0654\u0655]/g, '')
      // 5. Remove Uthmani Silat al-Ha at the end of a word (ـهۥ / ـهۦ -> ـه)
      .replace(/ه[\u06E5\u06E6](?=\s|$)/g, 'ه')
      // 6. Convert medial Uthmani small waw (\u06E5 ۥ) -> و and small ya (\u06E6 ۦ) -> ي (e.g. إِبْرَٰهِۦمَ -> ابراهيم, دَاوُۥدَ -> داوود)
      .replace(/\u06E5/g, 'و')
      .replace(/\u06E6/g, 'ي')
      // 7. Convert Uthmani وٰ (waw + dagger alif) in الصلاة / الزكاة / الحياة / الربا / مشكاة / نجاة / غداة
      .replace(/و\u0670ا/g, 'ا')
      .replace(/و\u0670(?=[ةه])/g, 'ا')
      // 8. Convert ىٰ (alif maqsura + dagger alif) -> ي (e.g. علىٰ -> علي, موسىٰ -> موسي)
      .replace(/ى\u0670/g, 'ي')
      // 9. Convert remaining dagger alif (\u0670 ٰ) -> ا (e.g. العٰلمين -> العالمين, الكتٰب -> الكتاب, الصرٰط -> الصراط)
      .replace(/\u0670/g, 'ا')
      // 10. Normalize Alif variants (أ إ آ ٱ -> ا)
      .replace(/[أإآٱ]/g, 'ا')
      // 11. Normalize Alif Maqsura (ى -> ي) and Taa Marbuta (ة -> ه)
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      // 12. Normalize Waw with Hamza (ؤ -> و) and Ya with Hamza (ئ -> ي)
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      // 13. Normalize Uthmani hamza + alif (ءا -> ا) and remove remaining chairless hamza (ء)
      .replace(/ءا/g, 'ا')
      .replace(/ء/g, '')
      // 14. Collapse duplicate alifs (اا -> ا)
      .replace(/ا+/g, 'ا')
      // 15. Normalize Uthmani double-lam words (الليل -> اليل, اللاتي -> الاتي, اللذان -> الذان)
      .replace(/الليل/g, 'اليل')
      .replace(/اللاتي/g, 'الاتي')
      .replace(/اللاي/g, 'الاي')
      // 16. Remove punctuation and collapse whitespace
      .replace(/[\u061F\u060C.,!;:"'«»()[\]{}\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  );
}

/**
 * Computes an Alif-insensitive consonantal skeleton so words with omitted/extra internal alifs
 * (such as الرحمن/الرحمان, هذا/هاذا, ذلك/ذالك, لكن/لاكن, سماوات/سموات, أولئك/اولائك, يا أيها/يأيها, داود/داوود)
 * always match seamlessly.
 */
export function normalizeArabicSkeleton(text: string): string {
  const norm = normalizeArabicForSearch(text);
  if (!norm) return '';

  return norm
    .replace(/(?:^|\s)يا\s+/g, ' ي')
    .split(' ')
    .filter(Boolean)
    .map(w => {
      if (w.length <= 2) return w;
      const prefixLen = w.startsWith('ال')
        ? 2
        : w.startsWith('وال') || w.startsWith('فال') || w.startsWith('بال') || w.startsWith('لال')
        ? 3
        : 1;
      const head = w.slice(0, prefixLen);
      const tail = w
        .slice(prefixLen)
        .replace(/ا/g, '')
        .replace(/لل+/g, 'ل')
        .replace(/وو+/g, 'و')
        .replace(/يي+/g, 'ي');
      return head + tail;
    })
    .join(' ');
}

/**
 * Strips the leading Bismillah from Ayah 1 of Surahs 2..114 (except Surah 1)
 */
export function stripLeadingBismillah(text: string, surahNumber: number, ayahNumber: number): string {
  if (surahNumber === 1 || ayahNumber !== 1) return text;
  const cleaned = text.replace(/^\uFEFF?بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '').trim();
  return cleaned || text;
}

/**
 * Checks whether targetText matches rawQuery using both normalized Imlai/Uthmani text
 * and Alif-insensitive consonantal skeleton matching.
 */
export function matchesArabicQuery(
  targetText: string,
  rawQuery: string,
  precomputedTarget?: { norm?: string; skel?: string; normNext?: string; skelNext?: string }
): boolean {
  const normQuery = normalizeArabicForSearch(rawQuery || '');
  if (!normQuery) return true;

  const safeTarget = targetText || '';
  const normTarget = precomputedTarget?.norm ?? normalizeArabicForSearch(safeTarget);
  if (normTarget.includes(normQuery)) return true;

  const skelQuery = normalizeArabicSkeleton(rawQuery || '');
  const skelTarget = precomputedTarget?.skel ?? normalizeArabicSkeleton(safeTarget);

  const queryWords = normQuery.split(' ').filter(Boolean);
  const querySkelWords = skelQuery.split(' ').filter(Boolean);

  // Single-word query: match either in normTarget or as a skeleton word (to avoid tiny 2-letter false positives)
  if (queryWords.length === 1) {
    const skelWord = querySkelWords[0] || '';
    if (skelWord.length >= 3) {
      const targetSkelWords = skelTarget.split(' ');
      if (targetSkelWords.some(tw => tw.includes(skelWord))) {
        return true;
      }
    }
    return false;
  }

  // Multi-word phrase: check skeleton phrase directly
  if (skelQuery.length >= 4 && skelTarget.includes(skelQuery)) {
    return true;
  }

  // Check across current ayah + next ayah boundary (e.g. "والضحى والليل إذا سجى")
  if (precomputedTarget?.normNext && precomputedTarget.normNext.includes(normQuery)) {
    return true;
  }
  if (
    precomputedTarget?.skelNext &&
    skelQuery.length >= 4 &&
    precomputedTarget.skelNext.includes(skelQuery)
  ) {
    return true;
  }

  // Check if all query words appear in the ayah (either normalized or skeleton form)
  const targetSkelWords = skelTarget.split(' ');
  return queryWords.every((qw, idx) => {
    if (normTarget.includes(qw)) return true;
    const sw = querySkelWords[idx];
    if (sw && sw.length >= 3) {
      return targetSkelWords.some(tw => tw.includes(sw));
    }
    return false;
  });
}
