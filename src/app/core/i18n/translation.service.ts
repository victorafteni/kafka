import { Injectable, signal, computed } from '@angular/core';
import { RO_TRANSLATIONS } from './translations/ro';
import { EN_TRANSLATIONS } from './translations/en';

export type SupportedLang = 'ro' | 'en';

export interface LanguageOption {
  code: SupportedLang;
  label: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'commerce_hub_lang';

  readonly languages: LanguageOption[] = [
    { code: 'ro', label: 'Română', flag: `🇷🇴` },
    { code: 'en', label: 'English', flag: `🇬🇧` }
  ];

  readonly currentLang = signal<SupportedLang>(this.getInitialLang());

  readonly currentLanguageOption = computed(() => {
    return this.languages.find(l => l.code === this.currentLang()) || this.languages[0];
  });

  private dictionaries: Record<SupportedLang, any> = {
    ro: RO_TRANSLATIONS,
    en: EN_TRANSLATIONS
  };

  private getInitialLang(): SupportedLang {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) as SupportedLang;
      if (stored === 'ro' || stored === 'en') {
        return stored;
      }
    } catch {
      // localStorage may not be available in SSR or test environments
    }
    return 'ro';
  }

  setLanguage(lang: SupportedLang): void {
    if (lang === this.currentLang()) return;
    this.currentLang.set(lang);
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore storage errors
    }
  }

  translate(key: string, params?: Record<string, string | number>): string {
    // Read signal to establish reactive tracking in components / pipes
    const lang = this.currentLang();
    const dict = this.dictionaries[lang] || this.dictionaries['ro'];

    let value = this.getNestedValue(dict, key);
    if (!value && lang !== 'en') {
      value = this.getNestedValue(this.dictionaries['en'], key);
    }

    if (!value) {
      return key;
    }

    if (params) {
      Object.keys(params).forEach(pKey => {
        value = (value as string).replace(new RegExp(`{${pKey}}`, 'g'), String(params[pKey]));
      });
    }

    return value as string;
  }

  private getNestedValue(obj: any, path: string): string | undefined {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  }
}
