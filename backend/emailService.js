const nodemailer = require('nodemailer');

function createTransporter(smtp = {}) {
  smtp = smtp || {};
  const user = smtp.user || process.env.SMTP_USER;
  const pass = smtp.pass || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtp.host || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(smtp.port || process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user,
      pass
    }
  });
}

function applyTemplate(template, contact, fallbackCompany) {
  return template
    .replaceAll('{{nome}}', contact.name)
    .replaceAll('{{empresa}}', contact.company || fallbackCompany || 'sua empresa')
    .replaceAll('{{email}}', contact.email);
}

function buildEmail({ contact, companyName, subjectTemplate, messageTemplate }) {
  const subject = applyTemplate(subjectTemplate, contact, companyName);
  const text = applyTemplate(messageTemplate, contact, companyName);

  return {
    to: contact.email,
    subject,
    text
  };
}

async function sendCampaign({ contacts, companyName, subjectTemplate, messageTemplate, smtp }) {
  const transporter = createTransporter(smtp);
  const from = smtp?.from || smtp?.user || process.env.SMTP_FROM || process.env.SMTP_USER || 'preview@example.com';
  const results = [];

  for (const contact of contacts) {
    const email = buildEmail({ contact, companyName, subjectTemplate, messageTemplate });

    if (!transporter) {
      results.push({
        email: contact.email,
        name: contact.name,
        success: true,
        previewOnly: true,
        subject: email.subject,
        message: email.text
      });
      continue;
    }

    try {
      await transporter.sendMail({
        from,
        to: email.to,
        subject: email.subject,
        text: email.text
      });

      results.push({
        email: contact.email,
        name: contact.name,
        success: true,
        previewOnly: false,
        subject: email.subject
      });
    } catch (error) {
      results.push({
        email: contact.email,
        name: contact.name,
        success: false,
        previewOnly: false,
        error: error.message
      });
    }
  }

  return {
    previewOnly: !transporter,
    results
  };
}

module.exports = {
  sendCampaign
};
