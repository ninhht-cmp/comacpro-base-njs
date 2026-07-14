import { describe, expect, it } from 'vitest';
import { normalizeFullName, validateFullName } from './full-name';

const reasonOf = (input: string) => {
  const result = validateFullName(input);
  return result.valid ? 'valid' : result.reason;
};

describe('validateFullName', () => {
  it('accepts real Vietnamese names, including tricky-but-legit ones', () => {
    for (const name of [
      'Nguyễn Văn A',
      // Ethnic-minority names carry apostrophes — must not be rejected.
      "H'Hen Niê",
      "K'sor Phước",
      // Number-words double as given names (Bảy=7, Sáu=6) — one is fine.
      'Nguyễn Văn Bảy',
      'Trần Thị Sáu',
    ]) {
      expect(reasonOf(name), name).toBe('valid');
    }
  });

  it('rejects each junk category with its specific reason', () => {
    expect(reasonOf('%&HGVUJHCVDS QĐ')).toBe('invalid_chars');
    expect(reasonOf('Văn A 9')).toBe('contains_digits');
    expect(reasonOf('nguyen@gmail.com')).toBe('contains_link');
    expect(reasonOf('fb.com/hacker')).toBe('contains_link');
    expect(reasonOf('Nguyễn Vcl')).toBe('profanity');
    expect(reasonOf('Chó lừa đảo gọi t')).toBe('not_a_name');
    // A phone number spelled out in words, spaced or glued.
    expect(reasonOf('Không Ba Ba Sáu Năm Chín')).toBe('number_word_spam');
    expect(reasonOf('Kobabasau')).toBe('number_word_spam');
    expect(reasonOf('Aaaaaa')).toBe('repeated_chars');
    expect(reasonOf('Hjkl Bcdf')).toBe('gibberish');
    expect(reasonOf('A')).toBe('too_short');
    expect(reasonOf('Nguyễn Văn '.repeat(4))).toBe('too_long');
    expect(reasonOf('   ')).toBe('empty');
  });

  it('flags (but does not block) an unusually long single token', () => {
    // 28 chars, pronounceable, no repeated-char run, no number-words.
    const result = validateFullName(`Ni${'ni'.repeat(13)}`);
    expect(result.valid).toBe(true);
    expect(result.suspicious).toBe(true);
  });
});

describe('normalizeFullName', () => {
  it('folds smart punctuation and collapses whitespace to a canonical form', () => {
    expect(normalizeFullName('  H’Hen   Niê ')).toBe("H'Hen Niê");
  });

  it('normalizes decomposed Vietnamese accents to NFC', () => {
    // "ễ" typed as e + combining circumflex + tilde, via escapes so no
    // tool can silently precompose the literal.
    expect(normalizeFullName('Nguye\u0302\u0303n V\u0103n A')).toBe(
      'Nguy\u1EC5n V\u0103n A',
    );
  });

  it('strips invisible characters spammers use to evade filters', () => {
    expect(normalizeFullName('Ngu\u200By\u1EC5n')).toBe('Nguy\u1EC5n');
  });
});
