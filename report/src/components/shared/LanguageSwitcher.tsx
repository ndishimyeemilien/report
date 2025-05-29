
"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, CaseSensitive, TextCursorInput, Globe, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function LanguageSwitcher() {
  const { i18n, t, ready } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setIsMounted(true);
    setCurrentLanguage(i18n.language.split('-')[0]); // Use base language e.g. 'en' from 'en-US'
    console.log("LanguageSwitcher: Mounted. Initial language:", i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (ready) {
      console.log("LanguageSwitcher: i18next is ready. Current language:", i18n.language);
      setCurrentLanguage(i18n.language.split('-')[0]);
    } else {
      console.log("LanguageSwitcher: i18next not ready yet.");
    }
  }, [ready, i18n.language]);


  const changeLanguage = (lng: string) => {
    console.log("LanguageSwitcher: Attempting to change language to:", lng);
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng); 
  };

  if (!isMounted || !ready) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" disabled className="opacity-50 animate-pulse">
            <Languages className="h-5 w-5" />
            <span className="sr-only">{t('selectLanguage', 'Select Language')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentLanguage} onValueChange={changeLanguage} >
        <SelectTrigger 
          className="w-auto bg-transparent border-none shadow-none hover:bg-accent/50 focus:ring-0 px-2 py-1 h-9"
          aria-label={t('selectLanguageLabel', 'Select display language')}
        >
          <Languages className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
        </SelectTrigger>
        <SelectContent align="end">
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
