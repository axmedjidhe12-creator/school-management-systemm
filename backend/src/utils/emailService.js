const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

// Check SendGrid configuration
const hasSendGrid = Boolean(
  process.env.SENDGRID_API_KEY &&
  !process.env.SENDGRID_API_KEY.includes('your_sendgrid') &&
  process.env.SENDGRID_API_KEY.startsWith('SG.')
);

if (hasSendGrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Check SMTP configuration (e.g. Gmail, Outlook, cPanel)
const hasSmtp = Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_PASS.includes('your_')
);

let smtpTransporter = null;
if (hasSmtp) {
  const isGmail = (process.env.SMTP_HOST || '').includes('gmail') || (process.env.SMTP_USER || '').includes('@gmail.com');
  const transportConfig = isGmail
    ? {
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    : {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

  smtpTransporter = nodemailer.createTransport(transportConfig);
}

/**
 * Dispatches an email notification and audits to MySQL email_logs.
 */
const sendEmail = async ({ school_id, to, subject, html, text, eventType }) => {
  const senderEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'notifications@schoolms.edu';
  const fromEmail = `"School Management System" <${senderEmail}>`;
  let deliveryStatus = 'failed';
  let deliveryMessage = '';

  const mailOptions = {
    from: fromEmail,
    to,
    subject,
    text: text || html.replace(/<[^>]*>?/gm, ''),
    html
  };

  try {
    if (hasSendGrid) {
      // 1. Dispatch via SendGrid
      await sgMail.send(mailOptions);
      deliveryStatus = 'sent';
      deliveryMessage = 'Dispatched via SendGrid API';
      console.log(`[EMAIL DISPATCHED - SENDGRID] To: ${to} | Subject: "${subject}"`);
    } else if (hasSmtp && smtpTransporter) {
      // 2. Dispatch via SMTP (e.g. Gmail)
      await smtpTransporter.sendMail(mailOptions);
      deliveryStatus = 'sent';
      deliveryMessage = 'Dispatched via SMTP';
      console.log(`[EMAIL DISPATCHED - SMTP] To: ${to} | Subject: "${subject}"`);
    } else {
      // 3. Not configured with real credentials
      deliveryStatus = 'unconfigured';
      deliveryMessage = 'Email service not configured. Add SENDGRID_API_KEY or SMTP_USER/SMTP_PASS in backend/.env';
      console.log(`[EMAIL NOT CONFIGURED] To: ${to} | Subject: "${subject}" | Reason: Missing live API key or SMTP credentials.`);
    }
  } catch (err) {
    deliveryStatus = 'failed';
    deliveryMessage = err.message;
    console.error(`[EMAIL ERROR] To: ${to} - Error:`, err.response?.body || err.message);
  }

  // Record audit log in MySQL
  try {
    await pool.query(
      `INSERT INTO email_logs (school_id, recipient_email, subject, event_type, status, sent_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [school_id, to, subject, eventType, deliveryStatus === 'sent' ? 'sent' : 'failed']
    );
  } catch (dbErr) {
    console.error('Failed to write to email_logs table:', dbErr.message);
  }

  return {
    success: deliveryStatus === 'sent',
    status: deliveryStatus,
    message: deliveryMessage
  };
};

// 1. Template: Exam Results Published
const sendExamResultEmail = async ({ school_id, to, studentName, subjectName, points, term, remarks }) => {
  const subject = `Academic Performance Update: ${subjectName} (${term})`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #1a56db; margin-top: 0;">Academic Grade Published</h2>
      <p>Dear <strong>${studentName}</strong>,</p>
      <p>Your academic performance report for <strong>${term}</strong> has been updated:</p>
      <div style="background: #f8fafc; border-left: 4px solid #1a56db; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${subjectName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Score / Points:</strong> <span style="font-size: 18px; font-weight: bold; color: #059669;">${points} / 100</span></p>
        <p style="margin: 0;"><strong>Teacher Remarks:</strong> <em>"${remarks || 'Satisfactory work.'}"</em></p>
      </div>
      <p>Log in to your student portal to review your cumulative record.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #777;">This is an automated notification from your School Management System.</p>
    </div>
  `;
  return sendEmail({ school_id, to, subject, html, eventType: 'exam_published' });
};

// 2. Template: Daily Absence Alert
const sendAbsenceAlertEmail = async ({ school_id, to, studentName, date }) => {
  const subject = `Urgent: Daily Attendance Notification (${date})`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #fed7aa; border-radius: 8px; padding: 24px;">
      <h2 style="color: #dc2626; margin-top: 0;">Student Marked Absent</h2>
      <p>Dear Parent / Guardian of <strong>${studentName}</strong>,</p>
      <p>This automated notification confirms that <strong>${studentName}</strong> was recorded as <strong>ABSENT</strong> during roll call on <strong>${date}</strong>.</p>
      <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #9a3412;">If this absence is unexcused or recorded in error, please immediately contact the school administration office.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #777;">School Administration Office • Automated Attendance System</p>
    </div>
  `;
  return sendEmail({ school_id, to, subject, html, eventType: 'daily_absence' });
};

// 3. Template: Tuition Fee Inspection & Receipt
const sendFeeReceiptEmail = async ({ school_id, to, studentName, amountPaid, amountDue, balance, status }) => {
  const isPaid = status === 'paid';
  const subject = isPaid
    ? `Tuition Payment Receipt - Fully Settled`
    : `Tuition Fee Notification - Balance Remaining: $${balance.toFixed(2)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #1a56db; margin-top: 0;">Tuition Fee Statement</h2>
      <p>Dear Parent / Student (<strong>${studentName}</strong>),</p>
      <p>Below is the updated statement for your school fees account:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;">Total Amount Due:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${Number(amountDue).toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;">Total Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #059669;">$${Number(amountPaid).toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 2px solid #1a56db;">
          <td style="padding: 8px 0; font-weight: bold;">Remaining Balance:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${isPaid ? '#059669' : '#dc2626'}; font-size: 16px;">
            $${balance.toFixed(2)}
          </td>
        </tr>
      </table>
      <p><strong>Payment Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${isPaid ? '#059669' : '#ea580c'};">${status}</span></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #777;">School Bursar & Finance Department</p>
    </div>
  `;
  return sendEmail({ school_id, to, subject, html, eventType: isPaid ? 'payment_receipt' : 'fee_notice' });
};

// 4. Template: School Tenant & Principal Provisioned
const sendSchoolProvisionedEmail = async ({ school_id, to, principalName, schoolName, email, password, loginUrl }) => {
  const subject = `Welcome to School Cloud Platform: Your School (${schoolName}) is Ready!`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; padding: 28px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0 0 6px 0; font-size: 24px;">School Cloud Platform</h1>
        <p style="color: #64748b; margin: 0; font-size: 14px;">Enterprise Multi-Tenant School Management</p>
      </div>
      <p>Mudane / Marwo <strong>${principalName}</strong>,</p>
      <p>Waxaa si guul leh loo diiwaangeliyay dugsigiinna cusub ee <strong>${schoolName}</strong> nidaamka guud ee School Cloud Platform. Koontadaada Maamulaha Dugsiga (Principal / Super Admin) waa diyaar.</p>
      
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Macluumaadka Gelitaanka (Login Credentials):</h3>
        <p style="margin: 8px 0;"><strong>Dugsiga (School):</strong> ${schoolName}</p>
        <p style="margin: 8px 0;"><strong>Email-ka Maamulaha:</strong> <span style="color: #2563eb; font-weight: bold;">${email}</span></p>
        <p style="margin: 8px 0;"><strong>Furaha Ku-meel-gaarka ah (Password):</strong> <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 15px;">${password}</span></p>
        <p style="margin: 8px 0;"><strong>Kaalintaada (Role):</strong> School Principal (Super Admin)</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl || 'http://localhost:3000/login'}" style="background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
          Geli Nidaamka Hadda (Sign In to Portal)
        </a>
      </div>

      <p style="font-size: 14px; color: #475569;">Markaad gasho, waxaad awoodi doontaa inaad ku darto fasallada, macallimiinta, ardayda, iyo inaad bilowdo qaadashada xaadirinta iyo maamulka lacag-bixinta dugsigaaga.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Nidaamka Maamulka Dugsiyada ee Cloud-ka • Waxaa kormeeraya Master Administration</p>
    </div>
  `;
  return sendEmail({ school_id, to, subject, html, eventType: 'SCHOOL_PROVISIONED' });
};

module.exports = {
  sendEmail,
  sendExamResultEmail,
  sendAbsenceAlertEmail,
  sendFeeReceiptEmail,
  sendSchoolProvisionedEmail
};
