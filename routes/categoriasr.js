import { Router } from 'express';
import { check } from 'express-validator';
import { validarJWT } from '../middleware/validar-jwt.js';
import { validarCampos } from '../middleware/validar-datos.js';
import {
    createCategoria,
    getCategorias,
    getCategoriaById,
    updateCategoria,
    toggleCategoriaState

} from '../controllers/categoriasc.js';

const router = Router();

// POST: Crear una categoría
router.post(
    '/',
    [
        validarJWT,
        check('nombre', 'El nombre es obligatorio').notEmpty(),
        check('descripcion', 'La descripción es obligatoria').notEmpty(),
        validarCampos
    ],
    createCategoria
);

// GET: Listar todas las categorías
router.get(
    '/',
    [
        validarJWT,
        validarCampos,
    ],
    getCategorias
);

// GET: Obtener una categoría por ID
router.get(
    '/:id',
    [
        validarJWT,
       
        validarCampos
    ],
    getCategoriaById
);

// PUT: Actualizar una categoría
router.put(
    "/:id",
    [
      validarJWT, 
      check("id", "ID no válido").isMongoId(),
      check("nombre", "El nombre es obligatorio").optional().notEmpty(),
      check("descripcion", "La descripción es obligatoria").optional().notEmpty(),
      validarCampos, 
    ],
    updateCategoria
  );

router.put(
    '/estado/:id',
    [
        validarJWT,
        check('id', 'ID no válido').isMongoId(),
        validarCampos,
    ],
    toggleCategoriaState
);

  

export default router;