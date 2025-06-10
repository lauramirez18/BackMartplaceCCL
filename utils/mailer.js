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
  console.log('📧 Email simulado (desactivado temporalmente):', { to, subject });
  return { message: 'Envío de correo desactivado temporalmente' };
};
