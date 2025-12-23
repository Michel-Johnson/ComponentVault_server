import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage, useTranslation } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "zh")}>
        <SelectTrigger className="w-[140px]" aria-label={t("languageLabel")}>
          <SelectValue placeholder={t("languageLabel")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t("languageEnglish")}</SelectItem>
          <SelectItem value="zh">{t("languageChinese")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

