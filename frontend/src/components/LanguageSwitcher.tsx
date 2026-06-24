import { useMemo } from "react";
import { Languages } from "lucide-react";
import { useI18n } from "@/i18n/LanguageContext";
import { LANGUAGE_LABELS } from "@/i18n/translations";
import { AppLanguage } from "@/utils/language";

const LANGUAGE_OPTIONS: AppLanguage[] = ["en", "rw", "fr"];

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useI18n();

  const options = useMemo(
    () => LANGUAGE_OPTIONS.map((code) => ({ code, label: LANGUAGE_LABELS[code] })),
    []
  );

  return (
    <label className="btn-secondary flex items-center gap-2 border-forest-200/80 px-2.5 py-2 text-xs font-semibold text-forest-900 hover:border-forest-300 hover:bg-forest-50/70">
      <Languages className="h-4 w-4 text-forest-600" />
      <span className="hidden lg:inline">{t("common.language")}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="max-w-[9rem] truncate bg-transparent text-xs font-semibold text-forest-900 outline-none"
        aria-label={t("common.language")}
      >
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};
