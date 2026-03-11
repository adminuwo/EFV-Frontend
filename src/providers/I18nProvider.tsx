'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Country to language code mapper
export const countryLanguageMap: Record<string, string> = {
  IN: 'hi', // India -> Hindi
  US: 'en', // USA -> English
  GB: 'en', // UK -> English
  FR: 'fr', // France -> French
  DE: 'de', // Germany -> German
  ES: 'es', // Spain -> Spanish
  AE: 'ar', // UAE -> Arabic
  CN: 'zh-CN', // China -> Chinese
  JP: 'ja', // Japan -> Japanese
  IT: 'it', // Italy -> Italian
  PT: 'pt', // Portugal -> Portuguese
  RU: 'ru', // Russia -> Russian
  KR: 'ko', // South Korea -> Korean
};

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ko', name: 'Korean' },
];

interface I18nContextType {
  currentLanguage: string;
  changeLanguage: (langCode: string) => void;
  showCountryPopup: boolean;
  setShowCountryPopup: (show: boolean) => void;
  handleCountrySelect: (countryCode: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('efv_lang') || 'en';
    }
    return 'en';
  });

  // Initialize from localStorage directly if in browser to show popup instantly
  const [showCountryPopup, setShowCountryPopup] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('efv_country_selected');
    }
    return false;
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    
    // Check for cookie sync on English
    if (currentLanguage !== 'en') {
      document.cookie = `googtrans=/en/${currentLanguage}; path=/`;
    }

    // Add Google Translate Script
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      );
      
      // Attempt to set default combo immediately after initialization
      setTimeout(() => {
        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectElement && currentLanguage && currentLanguage !== 'en') {
          selectElement.value = currentLanguage;
          selectElement.dispatchEvent(new Event('change'));
        }
      }, 1000);
    };

    const addScript = document.createElement('script');
    addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    addScript.async = true;
    document.body.appendChild(addScript);

    return () => {
      document.body.removeChild(addScript);
      window.googleTranslateElementInit = undefined;
    };
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('efv_lang', langCode);
    
    // We clear or set the googtrans cookie to respect user choice
    if (langCode === 'en') {
        document.cookie = `googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `googtrans=/en/en; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
    } else {
        document.cookie = `googtrans=/en/${langCode}; path=/`;
    }
    
    // Force DOM translation directly from the combo box if available
    const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (selectElement) {
        selectElement.value = langCode;
        selectElement.dispatchEvent(new Event('change'));
    } else {
        window.location.reload();
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    const lang = countryLanguageMap[countryCode] || 'en';
    localStorage.setItem('efv_country_selected', 'true');
    setShowCountryPopup(false);
    changeLanguage(lang);
  };

  return (
    <I18nContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        showCountryPopup,
        setShowCountryPopup,
        handleCountrySelect,
      }}
    >
      {/* Hidden Translate Element */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Ensure TypeScript knows about window.google
declare global {
  interface Window {
    googleTranslateElementInit: (() => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}
