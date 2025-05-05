import express from 'express'
import {
    crearReseña,
    obtenerReseñasProducto,
    eliminarReseña,
   
} from '../controllers/resenas.js'


const router = express.Router()

// Rutas para reseñas:
router.post('/',  crearReseña) 
router.get('/producto/:productoId', obtenerReseñasProducto) 
router.delete('/:id',  eliminarReseña) 


export default router