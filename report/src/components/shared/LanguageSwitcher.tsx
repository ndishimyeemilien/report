
"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, CaseSensitive, Globe, TextCursorInput, Loader2 } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n, t, ready } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    setIsMounted(true);
    // Ensure currentLanguage is updated when i18n.language changes after initial mount
    if (i18n.language !== currentLanguage) {
      setCurrentLanguage(i18n.language.split('-')[0]);
    }
  }, [i18n.language, currentLanguage]);
  
  useEffect(() => {
    if (ready) {
      setCurrentLanguage(i18n.language.split('-')[0]);
    }
  }, [ready, i18n.language]);


  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng); 
  };

  if (!isMounted || !ready) {
    return (
      <Button variant="ghost" size="icon" disabled className="opacity-70">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="sr-only">{t('selectLanguage', 'Select Language')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('selectLanguage', 'Select Language')}>
          <Languages className="h-5 w-5" />
          <span className="sr-only">{t('selectLanguage', 'Select Language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("en")}>
          <CaseSensitive className="mr-2 h-4 w-4" />
          <span>{t('english', 'English')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("fr")}>
          <Globe className="mr-2 h-4 w-4" />
          <span>{t('french', 'Français')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("rw")}>
          <TextCursorInput className="mr-2 h-4 w-4" />
          <span>{t('kinyarwanda', 'Kinyarwanda')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
