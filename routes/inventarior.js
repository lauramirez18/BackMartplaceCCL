import express from "express";
import { check } from "express-validator";


import {
  createTransaccion,
  getTransacciones,
  getTransaccionPorId,
  toggleInventarioState
} from "../controllers/inventariosc.js";

const router = express.Router();

// Crear nueva transacción con validaciones si las necesitas
router.post(
  "/",
  [
    check("campo1", "campo1 es obligatorio").not().isEmpty(),
    
  ],
  createTransaccion
);

router.get("/", getTransacciones);
router.get("/:id", getTransaccionPorId);
router.put("/:id", toggleInventarioState);

export default router;
