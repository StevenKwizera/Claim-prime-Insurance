import { useEffect } from "react";
import { APP_LANGUAGE_CHANGED_EVENT, AppLanguage, getSavedLanguage, isAppLanguage } from "@/utils/language";

const TRANSLATE_CONTAINER_ID = "google_translate_element_hidden";
const GOOGLE_SCRIPT_ID = "google-translate-script";

type GoogleWindow = Window & {
  google?: {
    translate?: {
      TranslateElement?: new (
        options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
        elementId: string
      ) => unknown;
    };
  };
  googleTranslateElementInit?: () => void;
  __primeTranslateReady?: boolean;
};

const clearGoogleTranslateCookies = () => {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;expires=${expires};path=/`;
  const hostname = window.location.hostname;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    document.cookie = `googtrans=;expires=${expires};path=/;domain=.${hostname}`;
    document.cookie = `googtrans=;expires=${expires};path=/;domain=${hostname}`;
  }
};

const setGoogleTranslateCookie = (language: AppLanguage) => {
  if (language === "en") {
    clearGoogleTranslateCookies();
    return;
  }
  const cookie = `googtrans=/en/${language};path=/;SameSite=Lax`;
  document.cookie = cookie;
  const hostname = window.location.hostname;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    document.cookie = `${cookie};domain=.${hostname}`;
  }
};

const resetGoogleDom = () => {
  document.documentElement.lang = "en";
  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  document.body.style.top = "0";
};

const applyGoogleLanguage = (language: AppLanguage) => {
  setGoogleTranslateCookie(language);
  if (language === "en") {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select) {
      select.value = "en";
      select.dispatchEvent(new Event("change"));
    }
    resetGoogleDom();
    return true;
  }

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return false;
  if (select.value === language) return true;
  select.value = language;
  select.dispatchEvent(new Event("change"));
  document.documentElement.lang = language;
  return true;
};

const initializeGoogleTranslate = () => {
  const w = window as GoogleWindow;
  if (w.__primeTranslateReady) return;

  const setup = () => {
    if (w.__primeTranslateReady || !w.google?.translate?.TranslateElement) return;
    new w.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,rw,fr",
        autoDisplay: false
      },
      TRANSLATE_CONTAINER_ID
    );
    w.__primeTranslateReady = true;
  };

  w.googleTranslateElementInit = setup;

  if (w.google?.translate?.TranslateElement) {
    setup();
    return;
  }

  if (!document.getElementById(GOOGLE_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }
};

export const GlobalLanguageTranslator = () => {
  useEffect(() => {
    initializeGoogleTranslate();

    const applySelectedLanguage = (language: AppLanguage) => {
      document.documentElement.lang = language === "en" ? "en" : language;
      let retries = 0;
      const maxRetries = 24;
      const timer = window.setInterval(() => {
        retries += 1;
        const applied = applyGoogleLanguage(language);
        if (applied || retries >= maxRetries) {
          window.clearInterval(timer);
        }
      }, 250);
    };

    applySelectedLanguage(getSavedLanguage());

    const onLanguageChanged = (event: Event) => {
      const custom = event as CustomEvent<AppLanguage>;
      const next = custom.detail;
      if (isAppLanguage(next)) {
        applySelectedLanguage(next);
      }
    };

    const onStorageChanged = (event: StorageEvent) => {
      if (event.key) {
        applySelectedLanguage(getSavedLanguage());
      }
    };

    window.addEventListener(APP_LANGUAGE_CHANGED_EVENT, onLanguageChanged);
    window.addEventListener("storage", onStorageChanged);
    return () => {
      window.removeEventListener(APP_LANGUAGE_CHANGED_EVENT, onLanguageChanged);
      window.removeEventListener("storage", onStorageChanged);
    };
  }, []);

  return <div id={TRANSLATE_CONTAINER_ID} aria-hidden className="hidden" />;
};
