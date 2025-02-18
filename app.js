import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";



dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.static("public"));



mongoose.connect(process.env.MONGODB_CCL)
    .then(() => console.log('Base de datos conectada'))
    .catch((error) => console.log('Error en la conexión a la base de datos:', error));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('servidor corriendo en el puerto ${PORT}');
});
