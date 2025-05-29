
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
import { Languages, CaseSensitive, Globe, TextCursorInput, ChevronDown, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';

export default function SidebarLanguageSwitcher() {
  const { i18n, t, ready } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const [currentLanguageDisplay, setCurrentLanguageDisplay] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (ready && isMounted) {
      const lang = i18n.language.split('-')[0];
      if (lang === 'en') setCurrentLanguageDisplay(t('english', 'English'));
      else if (lang === 'fr') setCurrentLanguageDisplay(t('french', 'Français'));
      else if (lang === 'rw') setCurrentLanguageDisplay(t('kinyarwanda', 'Kinyarwanda'));
      else setCurrentLanguageDisplay(t('english', 'English')); // Fallback
    }
  }, [ready, i18n.language, t, isMounted]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!isMounted || !ready) {
    return (
      <Button
        variant="ghost"
        className="justify-start w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        disabled
      >
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        {t('loadingLanguage', 'Loading Language...')}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="ghost" 
            className="justify-between w-full mt-4 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
            aria-label={t('selectLanguage', 'Select Language')}
        >
            <span className="flex items-center">
                <Languages className="mr-3 h-5 w-5" />
                {t('language', 'Language')}
            </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-56">
        <DropdownMenuItem onClick={() => changeLanguage("en")} className={cn("flex justify-between", i18n.language.startsWith('en') && "bg-accent")}>
          <span className="flex items-center">
            <CaseSensitive className="mr-2 h-4 w-4" />
            <span>{t('english', 'English')}</span>
          </span>
          <span className="text-xs text-muted-foreground">EN</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("fr")} className={cn("flex justify-between", i18n.language.startsWith('fr') && "bg-accent")}>
          <span className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span>{t('french', 'Français')}</span>
          </span>
          <span className="text-xs text-muted-foreground">FR</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("rw")} className={cn("flex justify-between", i18n.language.startsWith('rw') && "bg-accent")}>
          <span className="flex items-center">
            <TextCursorInput className="mr-2 h-4 w-4" />
            <span>{t('kinyarwanda', 'Kinyarwanda')}</span>
          </span>
          <span className="text-xs text-muted-foreground">RW</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
