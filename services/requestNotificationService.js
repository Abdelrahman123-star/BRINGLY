const transporter = require('../config/emailConfig');

const getBaseUrl = () => {
    return process.env.BASE_URL || 'https://localhost:3443';
};

/**
 * Format Egyptian phone number to international WhatsApp format (+20...)
 */
const formatWhatsAppPhone = (rawPhone) => {
    if (!rawPhone) return '';
    let clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
        clean = '2' + clean;
    } else if (!clean.startsWith('20') && clean.startsWith('1')) {
        clean = '20' + clean;
    }
    return clean;
};

/**
 * Build pre-filled WhatsApp message for quote notification
 */
const formatWhatsAppQuoteMessage = (request) => {
    const baseUrl = getBaseUrl();
    const trackUrl = `${baseUrl}/track-request/${request.requestCode}`;
    const priceText = request.quotedPrice ? `${request.quotedPrice.toLocaleString()} EGP` : 'Pending quote';
    const notesText = request.adminNotes ? `\n📝 *Notes:* ${request.adminNotes}` : '';

    return `🇩🇪 *MyStore Germany Sourcing Update*\n\n` +
           `Hello *${request.customerName}*!\n` +
           `Good news! Our team in Germany has inspected and priced your requested item:\n\n` +
           `📦 *Product:* ${request.productName}\n` +
           `🏷️ *Reference Code:* #${request.requestCode}\n` +
           `💰 *Quoted Total Price:* *${priceText}*\n` +
           `*(Includes German store purchase, flight shipping to Cairo & customs)*${notesText}\n\n` +
           `🔍 *Track Live Status & Order Details:*\n` +
           `${trackUrl}\n\n` +
           `Would you like us to proceed with purchasing this item for you from Germany? Reply to this message to confirm!`;
};

/**
 * Send automated confirmation receipt email when customer submits request
 */
const sendRequestReceiptEmail = async (request) => {
    try {
        if (!request.customerEmail) return;

        const baseUrl = getBaseUrl();
        const trackUrl = `${baseUrl}/track-request/${request.requestCode}`;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
            .badge { display: inline-block; background: #ff5722; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 14px; border-radius: 9999px; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
            .content { padding: 35px 30px; }
            .greeting { font-size: 16px; margin-bottom: 16px; }
            .card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; }
            .code-row { text-align: center; padding: 15px; background: #fff7ed; border: 1.5px dashed #fed7aa; border-radius: 12px; margin-bottom: 20px; }
            .code-row span { font-size: 12px; color: #ea580c; text-transform: uppercase; font-weight: 600; display: block; }
            .code-row strong { font-size: 24px; color: #ff5722; font-family: monospace; letter-spacing: 0.1em; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .detail-row:last-child { border-bottom: none; }
            .btn { display: block; background: #ff5722; color: #ffffff !important; text-align: center; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 12px; margin: 25px 0 15px; font-size: 15px; }
            .steps { margin: 25px 0; padding-left: 20px; }
            .steps li { margin-bottom: 10px; font-size: 14px; color: #475569; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">🇩🇪 Direct from Germany &rarr; 🇪🇬 Egypt</span>
              <h1>Sourcing Request Received!</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello <strong>${request.customerName}</strong>,</p>
              <p>We have successfully received your product sourcing request. Our team in Germany is now inspecting store availability, pricing, and authentic stock.</p>
              
              <div class="code-row">
                <span>Your Live Tracking Code</span>
                <strong>#${request.requestCode}</strong>
              </div>

              <div class="card">
                <div class="detail-row">
                  <span style="color: #64748b;">Item Requested:</span>
                  <strong>${request.productName}</strong>
                </div>
                <div class="detail-row">
                  <span style="color: #64748b;">Category:</span>
                  <span>${request.category}</span>
                </div>
                ${request.targetBudget ? `
                <div class="detail-row">
                  <span style="color: #64748b;">Estimated Budget:</span>
                  <span>${request.targetBudget.toLocaleString()} EGP</span>
                </div>` : ''}
                <div class="detail-row">
                  <span style="color: #64748b;">Status:</span>
                  <strong style="color: #ea580c;">Pending Germany Review</strong>
                </div>
              </div>

              <a href="${trackUrl}" class="btn">🔍 Track Request Status Live</a>

              <h4 style="margin: 25px 0 10px; color: #0f172a;">What happens next?</h4>
              <ol class="steps">
                <li><strong>Price & Stock Check:</strong> Our brother in Germany verifies official German retailer stock (Amazon.de, Otto, MediaMarkt, etc.).</li>
                <li><strong>Price Quote:</strong> You will receive an email and WhatsApp message with the all-inclusive quote in EGP.</li>
                <li><strong>Confirmation & Flight:</strong> Once you confirm, we purchase the item and dispatch it on the next direct flight to Cairo.</li>
              </ol>
            </div>
            <div class="footer">
              <p>You can check your status anytime at <a href="${trackUrl}" style="color: #ff5722;">${trackUrl}</a></p>
              <p>&copy; ${new Date().getFullYear()} MyStore Germany Sourcing. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'no-reply@mystore.com',
            to: request.customerEmail,
            subject: `Request Received: #${request.requestCode} - ${request.productName}`,
            html
        });
        console.log(`[Notification] Request receipt email sent to ${request.customerEmail} for #${request.requestCode}`);
    } catch (error) {
        console.error('[Notification] Error sending request receipt email:', error.message);
    }
};

/**
 * Send email when admin quotes price
 */
const sendQuoteReadyEmail = async (request) => {
    try {
        if (!request.customerEmail) return;

        const baseUrl = getBaseUrl();
        const trackUrl = `${baseUrl}/track-request/${request.requestCode}`;
        const cleanPhone = formatWhatsAppPhone(request.customerPhone);
        const waMsg = encodeURIComponent(`Hello! I received the quote for my request #${request.requestCode} (${request.productName}) for ${request.quotedPrice} EGP. I'd like to confirm the order!`);
        const waLink = `https://wa.me/?text=${waMsg}`;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
            .header { background: linear-gradient(135deg, #ff5722 0%, #ea580c 100%); padding: 35px 30px; text-align: center; color: #ffffff; }
            .badge { display: inline-block; background: rgba(255,255,255,0.25); color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 5px 14px; border-radius: 9999px; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 800; }
            .content { padding: 35px 30px; }
            .greeting { font-size: 16px; margin-bottom: 16px; }
            .quote-highlight { text-align: center; background: #fff7ed; border: 2px solid #fed7aa; border-radius: 16px; padding: 25px 20px; margin: 25px 0; }
            .quote-highlight .label { font-size: 13px; color: #ea580c; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
            .quote-highlight .price { font-size: 36px; font-weight: 800; color: #ff5722; margin: 8px 0; }
            .quote-highlight .sub { font-size: 13px; color: #64748b; }
            .card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .detail-row:last-child { border-bottom: none; }
            .admin-note-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 0 10px 10px 0; margin: 20px 0; font-size: 14px; color: #1e3a8a; }
            .btn-primary { display: block; background: #ff5722; color: #ffffff !important; text-align: center; font-weight: 700; text-decoration: none; padding: 15px 24px; border-radius: 12px; margin: 20px 0 12px; font-size: 16px; }
            .btn-whatsapp { display: block; background: #25D366; color: #ffffff !important; text-align: center; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 15px; }
            .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">🇩🇪 Price Quote Ready</span>
              <h1>Your Quote is Ready!</h1>
            </div>
            <div class="content">
              <p class="greeting">Hello <strong>${request.customerName}</strong>,</p>
              <p>Great news! Our team in Germany has inspected availability and calculated the complete price for your requested product:</p>
              
              <div class="quote-highlight">
                <div class="label">All-Inclusive Quoted Price</div>
                <div class="price">${request.quotedPrice ? request.quotedPrice.toLocaleString() + ' EGP' : 'Quoted'}</div>
                <div class="sub">Includes original German retail price, receipt, international flight transport to Cairo, and import customs.</div>
              </div>

              <div class="card">
                <div class="detail-row">
                  <span style="color: #64748b;">Request Code:</span>
                  <strong>#${request.requestCode}</strong>
                </div>
                <div class="detail-row">
                  <span style="color: #64748b;">Product:</span>
                  <strong>${request.productName}</strong>
                </div>
                <div class="detail-row">
                  <span style="color: #64748b;">Category:</span>
                  <span>${request.category}</span>
                </div>
              </div>

              ${request.adminNotes ? `
              <div class="admin-note-box">
                <strong>Note from Germany Team:</strong><br>
                ${request.adminNotes}
              </div>` : ''}

              <a href="${trackUrl}" class="btn-primary">🔍 View Full Details & Track Live</a>
              <a href="${waLink}" class="btn-whatsapp">💬 Confirm Order via WhatsApp</a>

              <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">
                Prices and store availability in Germany may fluctuate. We recommend confirming within 48 hours to secure this price.
              </p>
            </div>
            <div class="footer">
              <p>Tracking Code: <strong>#${request.requestCode}</strong> | Track at <a href="${trackUrl}" style="color: #ff5722;">${trackUrl}</a></p>
              <p>&copy; ${new Date().getFullYear()} MyStore Germany Sourcing. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'no-reply@mystore.com',
            to: request.customerEmail,
            subject: `🎉 Price Quote Ready: ${request.quotedPrice ? request.quotedPrice.toLocaleString() + ' EGP' : ''} for #${request.requestCode} (${request.productName})`,
            html
        });
        console.log(`[Notification] Quote email sent to ${request.customerEmail} for #${request.requestCode}`);
    } catch (error) {
        console.error('[Notification] Error sending quote email:', error.message);
    }
};

/**
 * Send email on major status updates (Sourced, Shipped, Delivered)
 */
const sendStatusUpdateEmail = async (request, newStatus) => {
    try {
        if (!request.customerEmail) return;

        const baseUrl = getBaseUrl();
        const trackUrl = `${baseUrl}/track-request/${request.requestCode}`;

        let headline = `Request #${request.requestCode} Updated`;
        let statusMessage = `Your request status has been updated to: <strong>${newStatus}</strong>`;
        let badgeText = newStatus;

        if (newStatus === 'Sourced in Germany') {
            headline = 'Product Purchased in Germany! 🇩🇪';
            statusMessage = `Our team in Germany has successfully purchased and verified your <strong>${request.productName}</strong>. It is now packed and queued for the next flight to Cairo!`;
        } else if (newStatus === 'Shipped to Egypt') {
            headline = 'Package on Flight to Cairo! ✈️';
            statusMessage = `Your package containing <strong>${request.productName}</strong> has been dispatched on a direct flight from Germany to Egypt. We will notify you upon customs clearance!`;
        } else if (newStatus === 'Delivered') {
            headline = 'Package Delivered! 🇪🇬🎉';
            statusMessage = `Your product <strong>${request.productName}</strong> has been delivered. Thank you for choosing MyStore Germany Sourcing!`;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0f172a; padding: 30px; text-align: center; color: #ffffff; }
            .badge { display: inline-block; background: #ff5722; color: #ffffff; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; margin-bottom: 10px; }
            .content { padding: 35px 30px; }
            .btn { display: block; background: #ff5722; color: #ffffff !important; text-align: center; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 12px; margin: 25px 0; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="badge">${badgeText}</span>
              <h1 style="margin: 0; font-size: 24px;">${headline}</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${request.customerName}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.6;">${statusMessage}</p>
              <p><strong>Tracking Code:</strong> #${request.requestCode}</p>
              <a href="${trackUrl}" class="btn">🔍 View Live Progress & Tracking</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MyStore Germany Sourcing</p>
            </div>
          </div>
        </body>
        </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'no-reply@mystore.com',
            to: request.customerEmail,
            subject: `Update on Request #${request.requestCode}: ${headline}`,
            html
        });
        console.log(`[Notification] Status update email sent to ${request.customerEmail} (${newStatus})`);
    } catch (error) {
        console.error('[Notification] Error sending status update email:', error.message);
    }
};

module.exports = {
    formatWhatsAppPhone,
    formatWhatsAppQuoteMessage,
    sendRequestReceiptEmail,
    sendQuoteReadyEmail,
    sendStatusUpdateEmail
};
