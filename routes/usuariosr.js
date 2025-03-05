import { Router } from 'express';
import httpUsers from '../controllers/usuarioc.js';
import middleware from '../middleware/validar-datos.js';
import { check } from 'express-validator';
import { validarJWT } from '../middleware/validar-jwt.js';
import helperUsers from '../helpers/usuariosh.js';

const router = Router();

router.post('/registro', [
    check('name', 'nombre es requerido').not().isEmpty().trim(),
    check('email', 'email es requerido').not().isEmpty().trim(),
    check('email', 'el debe ser unico').custom(helperUsers.validarEmail),
    check('password', 'contraseña es requerida').not().isEmpty().trim(),
    check('password', 'la contraseña debe tener al menos 8 caracteres').isLength({ min: 8 }),
    check('password', 'la contraseña debe contener letras').is(/^[a-zA-Z]+$/),
    check('password', 'la contraseña debe contener números').is(/^[0-9]+$/),
    check('password', 'la contraseña debe contener caracteres especiales').is(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/),
    middleware
], httpUsers.postRegistrarUsuario);

router.post('/login', [
    check('email', 'email es requerido').not().isEmpty().trim(),
    check('password', 'contraseña es requerida').not().isEmpty().trim(),
    middleware
], httpUsers.postLogin)

router.get('/users', [
    validarJWT,
    middleware
], httpUsers.getlistUser)

router.put('/users/:id', [
    validarJWT,
    check("id", "Id no valido").isMongoId(),
    check("id", "no existe en la base de datos").custom(helperUsers.validarId),
    check("email", "el email debe ser unico").optional().custom(async (email, { req }) => await helperUsers.validarEmailPut(email, req.params.id)),
    check("email", "el email es obligatorio").trim().optional().notEmpty(),
    check("name", "el nombre es obligatorio").optional().notEmpty().trim(),
    middleware
], httpUsers.putModifyUser)

export default router
