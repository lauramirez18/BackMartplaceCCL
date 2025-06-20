import express from 'express'
import {
    crearReseña,
    obtenerReseñasProducto,
    eliminarReseña,
    obtenerResumenValoraciones
} from '../controllers/resenas.js'

import { validarJWT } from '../middleware/validar-jwt.js'

const router = express.Router()

// Rutas para reseñas:
router.post('/', validarJWT, crearReseña) 
router.get('/producto/:productoId', obtenerReseñasProducto)
router.get('/producto/:productoId/valoraciones', obtenerResumenValoraciones)
router.delete('/:id', validarJWT, eliminarReseña) 

export default router