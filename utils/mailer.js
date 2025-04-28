import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendInvoiceEmail = async (to, subject, text, attachmentPath = null) => {
  try {
    const mailOptions = {
      from: `"CCL Soporte" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      attachments: attachmentPath ? [
        {
          filename: 'factura.pdf',
          path: attachmentPath
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.response);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};
