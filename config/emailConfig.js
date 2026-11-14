const nodemailer = require('nodemailer');

const hasValidConfig = process.env.EMAIL_USER && 
                       process.env.EMAIL_APP_PASSWORD && 
                       !process.env.EMAIL_USER.includes('your_email');

let transporter;

if (hasValidConfig) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD 
    }
  });

  transporter.verify(function(error, success) {
    if (error) {
      console.log('Email configuration error:', error.message);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
} else {
  console.log('Email service: Using dummy mock (configure valid EMAIL_USER & EMAIL_APP_PASSWORD in .env to enable real emails)');
  transporter = {
    sendMail: async (options) => {
      console.log('Mock email sent to:', options.to, 'with subject:', options.subject);
      return { messageId: 'mock-email-id' };
    }
  };
}

module.exports = transporter; 