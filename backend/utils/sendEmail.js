const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Log email config (remove in production)
    console.log('Email configuration:');
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
    console.log(`SMTP_EMAIL: ${process.env.SMTP_EMAIL}`);
    console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL}`);
    console.log(`FROM_NAME: ${process.env.FROM_NAME}`);
    
    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465', // true for port 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Define message options
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    console.log(`Sending email to: ${options.email}`);

    // Send email
    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

module.exports = sendEmail; 