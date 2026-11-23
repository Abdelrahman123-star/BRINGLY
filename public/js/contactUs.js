// ========================================================
// BRINGLY ATELIER — CONTACT US JAVASCRIPT
// Handles Atelier Concierge Form Submission & WhatsApp Handoff
// ========================================================

document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contactForm');
  const formCard = document.getElementById('formCard');
  const successCard = document.getElementById('contactSuccessCard');
  const successClientName = document.getElementById('successClientName');
  const forwardWaBtn = document.getElementById('forwardWaBtn');
  const resetFormBtn = document.getElementById('resetFormBtn');

  if (contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

    contactForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      // Remove existing error banner if any
      const existingAlert = formCard.querySelector('.contact-alert-banner');
      if (existingAlert) {
        existingAlert.remove();
      }

      const name = document.getElementById('contactName')?.value.trim() || '';
      const phone = document.getElementById('contactPhone')?.value.trim() || '';
      const email = document.getElementById('contactEmail')?.value.trim() || '';
      const topic = document.getElementById('contactTopic')?.value.trim() || 'General Inquiry';
      const message = document.getElementById('contactMessage')?.value.trim() || '';

      if (!name || !email || !message) {
        displayFormError('Please fill in all required fields (Name, Email, Message).');
        return;
      }

      // Button loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.75';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Sending to Concierge...</span>';
      }

      try {
        const response = await fetch('/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            topic,
            message
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Populate success card
          if (successClientName) {
            successClientName.textContent = name;
          }

          // Generate pre-filled WhatsApp handoff link for instant follow-up
          if (forwardWaBtn) {
            const textPayload = `Hello BRINGLY Atelier! My name is ${name} (Phone: ${phone || 'N/A'}, Email: ${email}).\nRegarding: ${topic}\n\nMessage: ${message}`;
            forwardWaBtn.href = `https://wa.me/201006709258?text=${encodeURIComponent(textPayload)}`;
          }

          // Display success feedback
          contactForm.style.display = 'none';
          if (formCard) {
            const header = formCard.querySelector('.form-card-header');
            if (header) header.style.display = 'none';
          }
          if (successCard) {
            successCard.style.display = 'block';
            successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          displayFormError(data.message || 'Unable to submit your inquiry at this moment. Please try again.');
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        displayFormError('A network error occurred. Please check your connection or contact our desk directly on WhatsApp.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          submitBtn.style.cursor = '';
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });

    function displayFormError(msg) {
      const banner = document.createElement('div');
      banner.className = 'contact-alert-banner';
      banner.style.cssText = 'background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 14px; display: flex; align-items: center; gap: 10px;';
      banner.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #e11d48; font-size: 16px;"></i> <span>${msg}</span>`;
      
      const header = formCard.querySelector('.form-card-header');
      if (header) {
        header.insertAdjacentElement('afterend', banner);
      } else {
        contactForm.insertAdjacentElement('beforebegin', banner);
      }
    }
  }

  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function () {
      if (contactForm && successCard) {
        contactForm.reset();
        contactForm.style.display = 'flex';
        if (formCard) {
          const header = formCard.querySelector('.form-card-header');
          if (header) header.style.display = 'block';
          const alert = formCard.querySelector('.contact-alert-banner');
          if (alert) alert.remove();
        }
        successCard.style.display = 'none';
      }
    });
  }
});
