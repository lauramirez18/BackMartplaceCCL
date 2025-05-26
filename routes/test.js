import express from 'express';
import { sendInvoiceEmail } from '../utils/mailer.js';


const router = express.Router();

router.get('/test-email', async (req, res) => {
  try {
    await sendInvoiceEmail(
      'tucorreo@gmail.com',  
      'Correo de prueba',
      'Este es un correo de prueba desde tu servidor Node.js',
      null // No adjuntamos archivos por ahora
    );
    res.status(200).json({ message: '✅ Email enviado correctamente' });
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    res.status(500).json({ message: '❌ Error enviando email', error: error.message });
  }
});

export default router;
