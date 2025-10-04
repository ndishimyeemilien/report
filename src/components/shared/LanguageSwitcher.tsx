
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
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const getTranslatedText = (key: string, defaultText: string) => {
    if (!ready) return defaultText; // Return default if i18n not ready
    const translated = t(key);
    return translated === key ? defaultText : translated;
  };
  
  const currentLanguageName = () => {
    const lang = i18n.language;
    if (lang.startsWith('en')) return getTranslatedText('english', 'English');
    if (lang.startsWith('fr')) return getTranslatedText('french', 'Français');
    if (lang.startsWith('rw')) return getTranslatedText('kinyarwanda', 'Kinyarwanda');
    return getTranslatedText('selectLanguage', 'Language');
  }

  if (!isMounted || !ready) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        disabled 
        className="opacity-70" 
        aria-label={getTranslatedText('loadingLanguage', 'Loading language options...')}
        data-testid="language-switcher-button-loading"
      >
        <Loader2 className="h-5 w-5 animate-spin" data-ai-hint="loading indicator" />
        <span className="sr-only">{getTranslatedText('selectLanguage', 'Select Language')}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label={getTranslatedText('selectLanguage', 'Select Language')} 
          data-testid="language-switcher-button"
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">{currentLanguageName()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => changeLanguage("en")} 
          className={cn("flex justify-between items-center", i18n.language.startsWith('en') && "bg-accent")}
          aria-current={i18n.language.startsWith('en') ? "page" : undefined}
        >
          <span className="flex items-center">
            <CaseSensitive className="mr-2 h-4 w-4" />
            <span>{getTranslatedText('english', 'English')}</span>
          </span>
          <span className="text-xs text-muted-foreground">EN</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage("fr")} 
          className={cn("flex justify-between items-center", i18n.language.startsWith('fr') && "bg-accent")}
          aria-current={i18n.language.startsWith('fr') ? "page" : undefined}
        >
          <span className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            <span>{getTranslatedText('french', 'Français')}</span>
          </span>
          <span className="text-xs text-muted-foreground">FR</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage("rw")} 
          className={cn("flex justify-between items-center", i18n.language.startsWith('rw') && "bg-accent")}
          aria-current={i18n.language.startsWith('rw') ? "page" : undefined}
        >
          <span className="flex items-center">
            <TextCursorInput className="mr-2 h-4 w-4" />
            <span>{getTranslatedText('kinyarwanda', 'Kinyarwanda')}</span>
          </span>
          <span className="text-xs text-muted-foreground">RW</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
