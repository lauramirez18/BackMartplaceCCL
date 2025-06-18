import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/images.js"
import testRoutes from './routes/test.js';
import categorias from './routes/categoriasr.js'
import inventario from './routes/inventarior.js'
import ordenes from './routes/ordenesr.js'
import productos from './routes/productosr.js'
import usuarios from './routes/usuariosr.js'
import reseñas from "./routes/resenas.js";
import subcategorias from "./routes/subcategorias.js";
import authRoutes from "./routes/gogole.js";
import marcasRoutes from './routes/marcasr.js';
import { configurarOfertasAutomaticas } from './controllers/productosc.js';
dotenv.config();




const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://tudominio.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization', 'x-token'], 
  exposedHeaders: ['x-token'], 
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));


app.options('*', cors(corsOptions)); 

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static("public"));

// Rutas
app.use('/api/subcategorias', subcategorias);
app.use('/api/auth', authRoutes); 
app.use('/api/categorias', categorias);
app.use('/api/inventario', inventario);
app.use('/api/ordenes', ordenes);
app.use('/api/productos', productos);
app.use('/api/usuarios', usuarios); 
app.use('/api', testRoutes);
app.use('/api/upload', router);
app.use('/api/resenas', reseñas); 
app.use('/api/marcas', marcasRoutes);
app.use(express.static('public'));


// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_CCL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Base de datos conectada'))
.catch((error) => console.log('❌ Error en la conexión a la base de datos:', error));

const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  configurarOfertasAutomaticas();
});
