import { Router } from 'express';
import {
  createMarca,
  getMarcas,
  getMarcaById,
  updateMarca,
  toggleMarcaState
} from '../controllers/marcasc.js';


const router = Router();

router.post('/', createMarca);
router.get('/', getMarcas);
router.get('/:id', getMarcaById);
router.put('/:id', updateMarca);
router.put('/estado/:id', toggleMarcaState);

export default router;