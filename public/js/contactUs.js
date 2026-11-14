// ========================================================
// MYSTORE ATELIER — CONTACT US JAVASCRIPT
// Handles Atelier Concierge Form and WhatsApp Handoff
// ========================================================

document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contactForm');
  const formCard = document.getElementById('formCard');
  const successCard = document.getElementById('contactSuccessCard');
  const successClientName = document.getElementById('successClientName');
  const forwardWaBtn = document.getElementById('forwardWaBtn');
  const resetFormBtn = document.getElementById('resetFormBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const name = document.getElementById('contactName')?.value.trim() || '';
      const phone = document.getElementById('contactPhone')?.value.trim() || '';
      const email = document.getElementById('contactEmail')?.value.trim() || '';
      const topic = document.getElementById('contactTopic')?.value.trim() || 'General Inquiry';
      const message = document.getElementById('contactMessage')?.value.trim() || '';

      if (!name || !email || !message) {
        return;
      }

      // Populate success card
      if (successClientName) {
        successClientName.textContent = name;
      }

      // Generate pre-filled WhatsApp handoff link
      if (forwardWaBtn) {
        const textPayload = `Hello MyStore Atelier! My name is ${name} (Phone: ${phone || 'N/A'}, Email: ${email}).\nRegarding: ${topic}\n\nMessage: ${message}`;
        forwardWaBtn.href = `https://wa.me/201006709258?text=${encodeURIComponent(textPayload)}`;
      }

      // Display success feedback
      if (contactForm && successCard) {
        contactForm.style.display = 'none';
        if (formCard) {
          const header = formCard.querySelector('.form-card-header');
          if (header) header.style.display = 'none';
        }
        successCard.style.display = 'block';
      }
    });
  }

  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function () {
      if (contactForm && successCard) {
        contactForm.reset();
        contactForm.style.display = 'flex';
        if (formCard) {
          const header = formCard.querySelector('.form-card-header');
          if (header) header.style.display = 'block';
        }
        successCard.style.display = 'none';
      }
    });
  }
});
