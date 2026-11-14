
// Scroll Progress Bar
window.addEventListener('scroll', () => {
  const progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) return;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrollProgress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  progressBar.style.width = scrollProgress + '%';
});

// Carousel Functionality
let currentSlide = 0;
let autoPlayInterval;

const carouselInner = document.querySelector('.carousel-inner');
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.indicator');

// Function to show a specific slide
function showSlide(index) {
  if (!carouselInner || slides.length === 0) return;

  if (index >= slides.length) {
    currentSlide = 0;
  } else if (index < 0) {
    currentSlide = slides.length - 1;
  } else {
    currentSlide = index;
  }

  const offset = -currentSlide * 100;
  carouselInner.style.transform = `translateX(${offset}%)`;

  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlide);
  });

  // Update active dot
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// Function to go to the next slide
function nextSlide() {
  showSlide(currentSlide + 1);
}

// Function to go to the previous slide
function prevSlide() {
  showSlide(currentSlide - 1);
}

// Function to go to a specific slide
function goToSlide(index) {
  showSlide(index);
}

// Start auto-play
function startAutoPlay() {
  stopAutoPlay();
  autoPlayInterval = setInterval(nextSlide, 5500);
}

// Stop auto-play
function stopAutoPlay() {
  if (autoPlayInterval) clearInterval(autoPlayInterval);
}

// Initialize carousel
function initializeCarousel() {
  if (!carouselInner || slides.length === 0) return;

  // Add event listeners to dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      startAutoPlay();
    });
  });

  // Start auto-play
  startAutoPlay();

  // Pause auto-play on pointer hover
  carouselInner.addEventListener('mouseenter', stopAutoPlay);
  carouselInner.addEventListener('mouseleave', startAutoPlay);

  // Touch swipe support for phones and tablets
  let touchStartX = 0;
  let touchStartY = 0;

  carouselInner.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    stopAutoPlay();
  }, { passive: true });

  carouselInner.addEventListener('touchend', (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    startAutoPlay();
  }, { passive: true });
}

// Initialize the carousel when the page loads
initializeCarousel();


// ============================================
// GERMANY PRODUCT SOURCING HERO INTERACTIONS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const requestForm = document.getElementById('germanyRequestForm');
  const submitBtn = document.getElementById('submitRequestBtn');
  const inspirationChips = document.querySelectorAll('.inspiration-chip');
  const successModal = document.getElementById('requestSuccessModal');
  const modalCode = document.getElementById('modalRequestCode');
  const modalWhatsApp = document.getElementById('modalWhatsAppLink');
  const closeModalBtn = document.getElementById('closeRequestModalBtn');
  const cardElement = document.querySelector('.request-glass-card');

  // Helper notification toast (using existing #notification if present)
  function notify(msg, isError = false) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    if (notification && notificationMessage) {
      notification.style.background = isError ? '#e74c3c' : '#2ecc71';
      notificationMessage.textContent = msg;
      notification.classList.add('show');
      setTimeout(() => notification.classList.remove('show'), 3500);
    }
  }

  // 1. Quick Inspiration Chips Click
  if (inspirationChips.length > 0) {
    inspirationChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.getAttribute('data-name');
        const cat = chip.getAttribute('data-category');
        const specs = chip.getAttribute('data-specs');

        const nameInput = document.getElementById('reqProductName');
        const catSelect = document.getElementById('reqCategory');
        const specsArea = document.getElementById('reqSpecifications');

        if (name && nameInput) nameInput.value = name;
        if (cat && catSelect) catSelect.value = cat;
        if (specs && specsArea) specsArea.value = specs;

        // Visual flash highlight on fields
        [nameInput, catSelect, specsArea].forEach(el => {
          if (el) {
            el.style.borderColor = '#ff5722';
            el.style.boxShadow = '0 0 0 3px rgba(255, 87, 34, 0.4)';
            setTimeout(() => {
              el.style.borderColor = '';
              el.style.boxShadow = '';
            }, 600);
          }
        });

        // Smooth scroll to form if needed
        const heroSection = document.getElementById('germany-request');
        if (heroSection) {
          heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // 2. AJAX Form Submission
  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btnText = submitBtn.querySelector('.btn-text');
      const btnSpinner = submitBtn.querySelector('.btn-spinner');

      // Show spinner
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline-flex';

      const formData = new FormData(requestForm);
      const payload = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/request-product', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit request');
        }

        // Show Success Modal
        if (modalCode) modalCode.textContent = '#' + data.requestCode;

        const modalTrackLink = document.getElementById('modalTrackLink');
        if (modalTrackLink) {
          modalTrackLink.href = '/track-request/' + data.requestCode;
        }
        
        // Build direct WhatsApp link with message
        if (modalWhatsApp) {
          const text = encodeURIComponent(`Hello! I just submitted a product request from Germany with code #${data.requestCode} for: ${payload.productName}. Could you please check availability and price?`);
          modalWhatsApp.href = `https://wa.me/201006709258?text=${text}`;
        }

        if (successModal) {
          successModal.style.display = 'flex';
        }

        requestForm.reset();
        notify(data.message || 'Request submitted successfully!');

      } catch (err) {
        console.error('Request submission error:', err);
        notify(err.message || 'An error occurred while submitting your request.', true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
      }
    });
  }

  // 3. Modal Close
  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.style.display = 'none';
    });
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) successModal.style.display = 'none';
    });
  }

  // 4. Subtle 3D Card Hover Tilt on Desktop
  if (cardElement && window.innerWidth > 992) {
    const heroSection = document.getElementById('germany-request');
    if (heroSection) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = cardElement.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - cardX) / (window.innerWidth / 2);
        const deltaY = (e.clientY - cardY) / (window.innerHeight / 2);
        
        const rotateX = -deltaY * 3.5;
        const rotateY = deltaX * 3.5;
        
        cardElement.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });

      heroSection.addEventListener('mouseleave', () => {
        cardElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    }
  }
});