/**
 * Full name validation. Ported from `cmp-sm-fe` (the production referral
 * app) — battle-tested against the actual junk that lands on the signup form.
 *
 * Returns a structured verdict instead of throwing so callers can decide how
 * to surface each outcome:
 *   - `valid: false`     -> block submission (length, illegal chars, links,
 *                           digits, profanity, number-word spam, repeated-char
 *                           junk like "aaaa", gibberish, and phrases/ad copy
 *                           that aren't names — "Chó lừa đảo gọi t").
 *   - `suspicious: true` -> accept but flag for review (an unusually long
 *                           single token). Never blocks on its own.
 *
 * `reason` is a stable machine code (see `FullNameReason`), not a display
 * string, so the UI layer owns localisation — this app maps it to a sentinel
 * in the auth schema and translates in `@/lib/forms/field-errors`.
 *
 * The original's runtime config surface (injectable banned lists and
 * thresholds) was trimmed here — this app uses the defaults; restore from
 * the cmp-sm-fe source if tuning is ever needed.
 *
 * Design constraint: most Vietnamese number-words double as given names
 * (Bảy=7, Sáu=6, Mười=10, Năm=5, Ba=3, Tư=4). A legitimate name carries at
 * most one, so only a run of 5+ consecutive number-words is treated as spam.
 * This is what keeps "Nguyễn Văn Bảy" / "Trần Thị Sáu" valid.
 */

export type FullNameReason =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'contains_link'
  | 'contains_digits'
  | 'invalid_chars'
  | 'profanity'
  | 'number_word_spam'
  | 'repeated_chars'
  | 'gibberish'
  | 'not_a_name';

export interface FullNameValidationResult {
  valid: boolean;
  suspicious: boolean;
  reason?: FullNameReason;
}

const MIN_LENGTH = 2;
// Mirrors the Auth.json `name_too_long` copy — update both together.
const MAX_LENGTH = 30;
/** Run of space-separated number-words that reads as spam ("ba ba sau nam chin"). */
const MAX_CONSECUTIVE_NUMBER_WORDS = 5;
// A real name syllable is one syllable; a single token decoding into 3+
// glued number-words is a spelled-out number with the spaces stripped.
const MAX_GLUED_NUMBER_WORDS = 3;

/** Profanity / banned whole words, pre-normalized (lowercase, no diacritics). */
const BANNED_WORDS = new Set<string>([
  // Vietnamese (diacritics already stripped)
  'dit',
  'djt',
  'lon',
  'buoi',
  'cac',
  'dcm',
  'dkm',
  'dmm',
  'vcl',
  'clm',
  'pho',
  'cave',
  'di',
  // English
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
]);

/**
 * Common words that are NEVER Vietnamese names — pronouns, verbs, scam/ad
 * copy. They flag the input as a phrase ("Chó lừa đảo gọi t"), not a name.
 *
 * IMPORTANT: matched on the diacritic-PRESERVING lowercase form, so "đảo"
 * (island) is caught without touching the real name "Đào" — they differ only
 * by tone. Only include single words with no name collision here; ambiguous
 * ones (e.g. "liên", also the name Liên) go in NON_NAME_PHRASES instead.
 * Entries are pre-normalized: NFC, lowercase.
 */
const NON_NAME_WORDS = new Set<string>([
  'chó',
  'mèo',
  'lừa',
  'gọi',
  'vay',
  'nợ',
  'sđt',
  'sdt',
  'tao',
  'mày',
  'nhé',
  'nha',
  'inbox',
  'ib',
  'ship',
  'shop',
  'sale',
  'admin',
  'test',
  'web',
  'app',
  'bot',
  'tool',
  'hack',
  'cty',
  'cskh',
  'vip',
  'pro',
]);

// Multi-word scam/ad phrases. Matched as substrings of the lowercase name so
// that name-colliding words (Liên, Kết) are only blocked in this context.
const NON_NAME_PHRASES: readonly string[] = [
  'lừa đảo',
  'liên hệ',
  'kết bạn',
  'khuyến mãi',
  'giảm giá',
  'miễn phí',
  'vay tiền',
  'gọi điện',
  'quảng cáo',
  'tài xỉu',
  'xóc đĩa',
  'nạp tiền',
  'rút tiền',
  'cờ bạc',
  'kiếm tiền',
];

/**
 * Vietnamese number-words 0–10 plus common no-diacritic spellings and
 * abbreviations, all in normalized (diacritics-stripped) form. Scale words
 * (trăm/nghìn/triệu…) are intentionally excluded — they don't appear in the
 * "five digits in a row" spam pattern this guards against.
 */
const NUMBER_WORDS = new Set<string>([
  'khong',
  'ko',
  'kg',
  'hong',
  'mot',
  'hai',
  'ba',
  'bon',
  'tu',
  'nam',
  'lam',
  'sau',
  'bay',
  'tam',
  'chin',
  'muoi',
]);

// Detects links, emails and social handles. Runs before the generic
// illegal-char check so "a@b.com" / "fb.com/x" get the precise reason.
const LINK_RE =
  /(https?:\/\/|www\.|\S+@\S+|\.(?:com|net|org|vn|io|info|xyz|me|co|app)\b|facebook|instagram|tiktok|zalo|telegram|t\.me|twitter|youtube|@\w)/i;
const ALLOWED_RE = /^[\p{L}\p{M} '.-]+$/u;
const DIGIT_RE = /\p{Nd}/u;

/** Lowercase + strip Vietnamese diacritics and đ → d for accent-insensitive checks. */
const normalizeForCompare = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();

// Visually-equivalent punctuation that keyboards (esp. iOS/macOS smart-quote
// auto-correct) emit instead of plain ASCII. Folding these is what keeps
// "H'Hen Niê" valid when typed with curly quotes.
// Curly quotes, modifier letters, prime, fullwidth apostrophe.
const APOSTROPHE_VARIANTS = /[\u2018\u2019\u02BC\u02B9\u2032\uFF07]/g;
// Hyphen/dash family (U+2010–U+2015) and minus sign (U+2212).
const DASH_VARIANTS = /[\u2010-\u2015\u2212]/g;
// Zero-width space/joiners, word-joiner, BOM — written as escapes on purpose:
// the characters are invisible, a literal class would be uneditable.
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Normalize raw input to a canonical form: NFC, fold smart quotes/dashes to
 * ASCII, drop invisible chars, trim, collapse internal whitespace to one
 * space. Exported because callers persist this canonical form (the signup
 * schema transforms with it before validating).
 */
export const normalizeFullName = (input: string): string =>
  input
    .normalize('NFC')
    .replace(APOSTROPHE_VARIANTS, "'")
    .replace(DASH_VARIANTS, '-')
    .replace(INVISIBLE_CHARS, '')
    .trim()
    .replace(/\s+/g, ' ');

// A real Vietnamese syllable always contains a vowel. Flag pure consonant
// runs and long consonant clusters ("ngh" is the longest real one at 3).
const looksGibberish = (token: string): boolean => {
  const cmp = normalizeForCompare(token).replace(/[^a-z]/g, '');
  if (cmp.length < 4) return false; // too short to judge
  if (!/[aeiouy]/.test(cmp)) return true; // letters but no vowel
  return /[bcdfghjklmnpqrstvwxz]{5,}/.test(cmp);
};

const hasExcessiveRepeat = (value: string): boolean =>
  /(.)\1{3,}/u.test(normalizeForCompare(value)); // same char 4+ times in a row

/**
 * Segment a normalized token against the number-word set.
 *   internalMax: longest CONTIGUOUS run of number-words tiled anywhere in the
 *                token (can start/end mid-token).
 *   fullPieces:  piece count if the WHOLE token tiles into number-words,
 *                else 0.
 * This is what catches a phone number spelled out with the spaces removed
 * ("kobabasaunamchin" -> ko·ba·ba·sau·nam·chin). Contiguity (a non-number
 * syllable breaks the run) keeps it off real name tokens like "Nguyen".
 */
const tileNumberWords = (
  token: string,
): { internalMax: number; fullPieces: number } => {
  const n = token.length;
  if (n === 0) return { internalMax: 0, fullPieces: 0 };
  const run = new Array<number>(n + 1).fill(0); // longest run ending at i
  const pref = new Array<number>(n + 1).fill(-1); // pieces to fully tile [0, i)
  pref[0] = 0;
  let internalMax = 0;
  for (let i = 1; i <= n; i++) {
    for (const w of NUMBER_WORDS) {
      const len = w.length;
      if (len <= i && token.startsWith(w, i - len)) {
        if (run[i - len]! + 1 > run[i]!) run[i] = run[i - len]! + 1;
        if (pref[i - len]! >= 0 && pref[i - len]! + 1 > pref[i]!) {
          pref[i] = pref[i - len]! + 1;
        }
      }
    }
    if (run[i]! > internalMax) internalMax = run[i]!;
  }
  return { internalMax, fullPieces: pref[n]! > 0 ? pref[n]! : 0 };
};

/**
 * Two independent number-word spam signals:
 *   crossRun: longest run of number-words across space-separated words, with
 *             fully-tiling words chained ("ko ba ba sau nam" -> 5).
 *   maxGlued: most number-words glued inside a SINGLE token ("kobabasa" -> 3).
 * Different thresholds: separate words need a long run (single number-words
 * double as names — "Năm Ba"), but a token glued from 3+ number syllables is
 * never a real name syllable.
 */
const analyzeNumberWords = (
  words: string[],
): { crossRun: number; maxGlued: number } => {
  let crossRun = 0;
  let maxGlued = 0;
  let running = 0; // carried across consecutive fully-tiling words
  for (const word of words) {
    const token = normalizeForCompare(word).replace(/[^a-z]/g, '');
    const { internalMax, fullPieces } = tileNumberWords(token);
    if (internalMax > maxGlued) maxGlued = internalMax;
    if (fullPieces > 0) {
      running += fullPieces;
      if (running > crossRun) crossRun = running;
    } else {
      running = 0;
    }
  }
  return { crossRun, maxGlued };
};

const isProfane = (words: string[]): boolean =>
  words.some((word) => {
    // Collapse 3+ repeats ("loooon" -> "loon") so padding can't evade.
    const cmp = normalizeForCompare(word)
      .replace(/[^a-z]/g, '')
      .replace(/(.)\1{2,}/g, '$1');
    return BANNED_WORDS.has(cmp);
  });

/**
 * True when the input reads as a phrase/ad rather than a name: it contains a
 * known non-name word or a non-name phrase. `lower` keeps diacritics so
 * name-vs-word pairs that differ only by tone (Đào vs đảo) aren't confused.
 * (Stray single letters like "B" are NOT flagged — "Nguyễn Văn B" is valid.)
 */
const looksLikeNonName = (lower: string, lowerWords: string[]): boolean =>
  NON_NAME_PHRASES.some((phrase) => lower.includes(phrase)) ||
  lowerWords.some((word) => NON_NAME_WORDS.has(word));

export const validateFullName = (input: string): FullNameValidationResult => {
  const normalized = normalizeFullName(input ?? '');

  // --- Rejection checks (ordered most-specific first) ---
  if (normalized.length === 0) {
    return { valid: false, suspicious: false, reason: 'empty' };
  }

  // Count by code points, not UTF-16 units, so combining marks / surrogates
  // don't skew the length of an accented name.
  const charCount = [...normalized].length;
  if (charCount < MIN_LENGTH) {
    return { valid: false, suspicious: false, reason: 'too_short' };
  }
  if (charCount > MAX_LENGTH) {
    return { valid: false, suspicious: false, reason: 'too_long' };
  }

  if (LINK_RE.test(normalized)) {
    return { valid: false, suspicious: false, reason: 'contains_link' };
  }

  if (DIGIT_RE.test(normalized)) {
    return { valid: false, suspicious: false, reason: 'contains_digits' };
  }

  if (!ALLOWED_RE.test(normalized)) {
    return { valid: false, suspicious: false, reason: 'invalid_chars' };
  }

  const words = normalized.split(' ');

  if (isProfane(words)) {
    return { valid: false, suspicious: false, reason: 'profanity' };
  }

  // Phrase / ad copy ("Chó lừa đảo gọi t") — not a name. Diacritic-preserving
  // lowercase, so "đảo" isn't confused with the name "Đào".
  if (
    looksLikeNonName(
      normalized.toLowerCase(),
      words.map((w) => w.toLowerCase()),
    )
  ) {
    return { valid: false, suspicious: false, reason: 'not_a_name' };
  }

  const { crossRun, maxGlued } = analyzeNumberWords(words);
  if (
    crossRun >= MAX_CONSECUTIVE_NUMBER_WORDS ||
    maxGlued >= MAX_GLUED_NUMBER_WORDS
  ) {
    return { valid: false, suspicious: false, reason: 'number_word_spam' };
  }

  // "aaaa", "ddddddd" — repeated-char junk, never a real name.
  if (hasExcessiveRepeat(normalized)) {
    return { valid: false, suspicious: false, reason: 'repeated_chars' };
  }

  // Vowel-less / consonant-cluster tokens ("hjkl", "bcdfgh") — gibberish.
  if (words.some(looksGibberish)) {
    return { valid: false, suspicious: false, reason: 'gibberish' };
  }

  // --- Suspicious flags (accept, but mark for review) ---
  // An unusually long single token is odd but not clearly invalid.
  const suspicious = words.some((word) => [...word].length > 25);

  return { valid: true, suspicious };
};
