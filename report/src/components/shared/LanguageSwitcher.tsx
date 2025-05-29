
"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, CaseSensitive, TextCursorInput, Globe, Loader2 } from "lucide-react"; // Assuming Globe and TextCursorInput are desired
import { Label } from "@/components/ui/label";

export default function LanguageSwitcher() {
  const { i18n, t, ready } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setIsMounted(true);
    setCurrentLanguage(i18n.language); 
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    console.log("LanguageSwitcher: Attempting to change language to:", lng);
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng); 
  };

  if (!isMounted || !ready) {
    return (
      <div className="flex items-center space-x-2">
        <Label htmlFor="language-select-loading" className="text-sm font-medium text-muted-foreground">{t('loadingLanguages', 'Loading languages...')}</Label>
        <Select disabled>
          <SelectTrigger className="w-full md:w-[200px]" id="language-select-loading">
            <SelectValue placeholder={<Loader2 className="h-5 w-5 animate-spin" />} />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="language-select" className="text-sm font-medium">{t('selectDisplayLanguage', 'Select Display Language')}</Label>
      <Select value={currentLanguage} onValueChange={changeLanguage} >
        <SelectTrigger className="w-full md:w-[200px]" id="language-select">
          <SelectValue placeholder={t('selectLanguage', 'Select Language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            <div className="flex items-center">
              <CaseSensitive className="mr-2 h-4 w-4" />
              <span>{t('english', 'English')}</span>
            </div>
          </SelectItem>
          <SelectItem value="fr">
            <div className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              <span>{t('french', 'French')}</span>
            </div>
          </SelectItem>
          <SelectItem value="rw">
            <div className="flex items-center">
              <TextCursorInput className="mr-2 h-4 w-4" />
              <span>{t('kinyarwanda', 'Kinyarwanda')}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
