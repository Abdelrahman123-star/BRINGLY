// Language Switcher Helper (coordinates with switchLanguage.ejs and i18n.js)
document.addEventListener('DOMContentLoaded', () => {
    // If switchLanguage.ejs already rendered a .language-switcher in DOM, do not inject another
    let switcher = document.querySelector('.language-switcher');
    
    if (!switcher) {
        // Only inject if no language switcher exists on the page
        switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        switcher.setAttribute('role', 'group');
        switcher.setAttribute('aria-label', 'Language switcher');
        switcher.innerHTML = `
            <button onclick="changeLanguage('en')" class="lang-btn" data-lang="en">
                <span class="lang-text">EN</span>
            </button>
            <div class="divider"></div>
            <button onclick="changeLanguage('ar')" class="lang-btn" data-lang="ar">
                <span class="lang-text">عربي</span>
            </button>
        `;
        document.body.appendChild(switcher);
    }

    // Sync active button
    const currentLang = localStorage.getItem('i18nextLng') || (typeof i18next !== 'undefined' && i18next.language) || 'en';
    const activeKey = currentLang.startsWith('ar') ? 'ar' : 'en';
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === activeKey) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Run initial content update if i18next is ready
    if (typeof window.updateContent === 'function') {
        window.updateContent();
    }
});
