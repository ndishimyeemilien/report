
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
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const { i18n, t, ready } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // console.log("[LanguageSwitcher Header] Mounted. i18n.language:", i18n.language, "i18n.isInitialized:", i18n.isInitialized, "i18n.ready:", ready);
  }, [i18n.language, i18n.isInitialized, ready]);
  
  const changeLanguage = (lng: string) => {
    // console.log("[LanguageSwitcher Header] Changing language to:", lng);
    i18n.changeLanguage(lng);
  };

  if (!isMounted || !ready) {
    return (
      <Button variant="ghost" size="icon" disabled className="opacity-70">
        <Loader2 className="h-5 w-5 animate-spin" data-ai-hint="loading indicator" />
        <span className="sr-only">{t('selectLanguage', 'Select Language')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('selectLanguage', 'Select Language')} data-testid="language-switcher-button">
          <Languages className="h-5 w-5" />
          <span className="sr-only">{t('selectLanguage', 'Select Language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => changeLanguage("en")} className={cn("flex justify-between items-center", i18n.language.startsWith('en') && "bg-accent")}>
          <span className="flex items-center">
            <CaseSensitive className="mr-2 h-4 w-4" />
            <span>{t('english', 'English')}</span>
          </span>
          <span className="text-xs text-muted-foreground">EN</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("fr")} className={cn("flex justify-between items-center", i18n.language.startsWith('fr') && "bg-accent")}>
          <span className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span>{t('french', 'Français')}</span>
          </span>
          <span className="text-xs text-muted-foreground">FR</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("rw")} className={cn("flex justify-between items-center", i18n.language.startsWith('rw') && "bg-accent")}>
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
