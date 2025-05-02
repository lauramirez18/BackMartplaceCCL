import { Router } from "express";
import { check } from "express-validator";




import express from "express";
import {
    createOrden,
    getOrdenes,
    getOrdenById,
    updateOrden,

} from "../controllers/ordenesc.js";

const router = express.Router();

// Ruta para crear una nueva orden
router.post("/", createOrden);

// Ruta para obtener todas las órdenes
router.get("/", getOrdenes);

// Ruta para obtener una orden por ID
router.get("/:id", getOrdenById);

// Ruta para actualizar el estado de una orden
router.put("/:id", updateOrden);



export default router;