import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/images.js"
import testRoutes from './routes/test.js';
import categorias from './routes/categoriasr.js'
import inventario  from './routes/inventarior.js'
import ordenes from './routes/ordenesr.js'
import productos from './routes/productosr.js'
import usuarios from './routes/usuariosr.js'

dotenv.config();


const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use ('/api/categorias', categorias)
app.use ('/api/inventario',inventario)
app.use ('/api/ordenes',ordenes)
app.use ('/api/productos',productos)
app.use('/api/ususarios',usuarios)
app.use('/api', testRoutes);
app.use('/api/upload', router);



mongoose.connect(process.env.MONGODB_CCL)
    .then(() => console.log('✅ Base de datos conectada'))
    .catch((error) => console.log('❌ Error en la conexión a la base de datos:', error));


const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
