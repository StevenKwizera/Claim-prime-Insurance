export type AppLanguage = "en" | "rw" | "fr";

export const APP_LANGUAGE_STORAGE_KEY = "prime.portal.language";
export const APP_LANGUAGE_CHANGED_EVENT = "prime-language-change";

export const isAppLanguage = (value: string | null): value is AppLanguage =>
  value === "en" || value === "rw" || value === "fr";

export const getSavedLanguage = (): AppLanguage => {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
  return isAppLanguage(saved) ? saved : "en";
};

export const setSavedLanguage = (language: AppLanguage) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(new CustomEvent<AppLanguage>(APP_LANGUAGE_CHANGED_EVENT, { detail: language }));
};

/** Undo Google Translate DOM changes that break React reconciliation. */
export const clearGoogleTranslateArtifacts = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  document.body.style.top = "0";
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;expires=${expires};path=/`;
};
