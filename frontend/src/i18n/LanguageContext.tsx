import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TRANSLATIONS, TranslationKey } from "@/i18n/translations";
import {
  APP_LANGUAGE_CHANGED_EVENT,
  AppLanguage,
  clearGoogleTranslateArtifacts,
  getSavedLanguage,
  setSavedLanguage
} from "@/utils/language";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => getSavedLanguage());

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    setSavedLanguage(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    if (language === "en") {
      clearGoogleTranslateArtifacts();
    }
  }, [language]);

  useEffect(() => {
    const onLanguageChanged = (event: Event) => {
      const custom = event as CustomEvent<AppLanguage>;
      if (custom.detail) {
        setLanguageState(custom.detail);
      }
    };
    window.addEventListener(APP_LANGUAGE_CHANGED_EVENT, onLanguageChanged);
    return () => window.removeEventListener(APP_LANGUAGE_CHANGED_EVENT, onLanguageChanged);
  }, []);

  const t = useCallback((key: TranslationKey) => TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return ctx;
};
