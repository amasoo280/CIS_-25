/**
 * Email Service
 * 
 * Pluggable email service that can be extended to send real emails.
 * For now, logs to console and can be extended to use nodemailer, SendGrid, etc.
 */

function sendEligibilityNotification(studentEmail, studentName, positionTitle, companyName) {
  const message = {
    to: studentEmail,
    subject: 'Co-op Eligibility Notification',
    body: `Dear ${studentName},

Congratulations! You have been selected for the position "${positionTitle}" at ${companyName} and are ELIGIBLE for co-op credit.

Please log in to the Co-op Portal to indicate whether you would like to receive co-op credit for this internship.

Best regards,
Co-op Portal System`
  };

  // Log to console (in production, this would send an actual email)
  console.log('='.repeat(60));
  console.log('EMAIL NOTIFICATION');
  console.log('='.repeat(60));
  console.log(`To: ${message.to}`);
  console.log(`Subject: ${message.subject}`);
  console.log(`\n${message.body}`);
  console.log('='.repeat(60));

  // TODO: In production, integrate with email service:
  // - nodemailer for SMTP
  // - SendGrid API
  // - AWS SES
  // - etc.

  return Promise.resolve({ success: true, messageId: `log-${Date.now()}` });
}

module.exports = { sendEligibilityNotification };

