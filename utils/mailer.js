import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verificar la conexión al iniciar
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Error en la configuración del correo:', error);
  } else {
    console.log('✅ Servidor de correo listo para enviar mensajes');
  }
});

export const sendInvoiceEmail = async (to, subject, content, attachmentPath = null) => {
  try {
    console.log('Intentando enviar correo a:', to);
    console.log('Asunto:', subject);

    const mailOptions = {
      from: `"CCL Soporte" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: content,
      attachments: attachmentPath ? [
        {
          filename: 'factura.pdf',
          path: attachmentPath
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.response);
    return info;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
};
