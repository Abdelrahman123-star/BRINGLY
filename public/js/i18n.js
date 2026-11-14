// Universal i18n & RTL System for BRINGLY
(function () {
  // Normalize saved language ('en' or 'ar')
  let savedLang = localStorage.getItem('i18nextLng') || 'en';
  if (savedLang.startsWith('ar')) {
    savedLang = 'ar';
  } else {
    savedLang = 'en';
  }
  localStorage.setItem('i18nextLng', savedLang);

  // Apply initial RTL/LTR attribute immediately to avoid flash of untranslated direction
  if (document.documentElement) {
    document.documentElement.lang = savedLang;
    document.documentElement.dir = (savedLang === 'ar') ? 'rtl' : 'ltr';
  }

  // Update DOM elements with translated text
  window.updateContent = function () {
    if (typeof i18next === 'undefined' || !i18next.isInitialized) {
      return;
    }

    const currentLang = (i18next.language && i18next.language.startsWith('ar')) ? 'ar' : 'en';
    const isAr = currentLang === 'ar';

    // Set document language and direction
    document.documentElement.lang = currentLang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    if (document.body) {
      document.body.dir = isAr ? 'rtl' : 'ltr';
      if (isAr) {
        document.body.classList.add('lang-ar');
      } else {
        document.body.classList.remove('lang-ar');
      }
    }

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      const key = element.getAttribute('data-i18n');
      if (!key) return;
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        element.textContent = translated;
      }
    });

    // Inner HTML (for rich formatted text)
    document.querySelectorAll('[data-i18n-html]').forEach(function (element) {
      const key = element.getAttribute('data-i18n-html');
      if (!key) return;
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        element.innerHTML = translated;
      }
    });

    // Placeholders for input / textarea
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (element) {
      const key = element.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        element.setAttribute('placeholder', translated);
      }
    });

    // Tooltip titles
    document.querySelectorAll('[data-i18n-title]').forEach(function (element) {
      const key = element.getAttribute('data-i18n-title');
      if (!key) return;
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        element.setAttribute('title', translated);
      }
    });

    // ARIA labels
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (element) {
      const key = element.getAttribute('data-i18n-aria-label');
      if (!key) return;
      const translated = i18next.t(key);
      if (translated && translated !== key) {
        element.setAttribute('aria-label', translated);
      }
    });

    // Update active class on language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  // Global changeLanguage function
  window.changeLanguage = function (lng) {
    const targetLang = (lng && lng.startsWith('ar')) ? 'ar' : 'en';
    localStorage.setItem('i18nextLng', targetLang);

    if (document.documentElement) {
      document.documentElement.lang = targetLang;
      document.documentElement.dir = (targetLang === 'ar') ? 'rtl' : 'ltr';
    }
    if (document.body) {
      document.body.dir = (targetLang === 'ar') ? 'rtl' : 'ltr';
    }

    if (typeof i18next !== 'undefined' && typeof i18next.changeLanguage === 'function') {
      i18next.changeLanguage(targetLang, function (err) {
        if (err) {
          console.error('Error changing language:', err);
        }
        window.updateContent();
        const event = new CustomEvent('languageChanged', { detail: { language: targetLang } });
        window.dispatchEvent(event);
      });
    } else {
      window.location.reload();
    }
  };

  // Initialize i18next if available
  function initI18n() {
    if (typeof i18next === 'undefined') {
      return;
    }

    if (i18next.isInitialized) {
      window.updateContent();
      return;
    }

    const initOptions = {
      lng: savedLang,
      fallbackLng: 'en',
      supportedLngs: ['en', 'ar'],
      load: 'languageOnly',
      debug: false,
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
      },
      interpolation: {
        escapeValue: false,
      }
    };

    if (typeof i18nextHttpBackend !== 'undefined') {
      i18next.use(i18nextHttpBackend);
    }
    if (typeof i18nextBrowserLanguageDetector !== 'undefined') {
      i18next.use(i18nextBrowserLanguageDetector);
    }

    i18next.init(initOptions, function (err) {
      if (err) {
        console.error('i18next init error:', err);
      }
      window.updateContent();
    });

    i18next.on('languageChanged', function () {
      window.updateContent();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();
