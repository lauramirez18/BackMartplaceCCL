import User from '../models/usuarios.js'
import { generarJWT } from '../middleware/validar-jwt.js'
import bcrypt from 'bcryptjs';


const httpUsers = {

    postRegistrarUsuario: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;
            const existinguser = await User.findOne({ email });
            if (existinguser) {
                return res.status(400).json({ error: 'usuario ya registrado' })
            }

            const hash = await bcrypt.hash(password, 10);
            const NuevoUsuario = new User({ name, email, password: hash, role });
            await NuevoUsuario.save();

            res.status(201).json({ message: 'usuario registrado con éxito' })

        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: 'error al registrar usuario' })
        }
    },
    postLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: 'usuario no encontrado' })
            }
            const passwordCorrecto = await bcrypt.compare(password, user.password);
            if (!passwordCorrecto) {
                return res.status(400).json({ error: 'contraseña incorrecta' })
            }
            const token = await generarJWT(user);
            res
            res.status(200).json({ token ,user: user.name })
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: 'error al autenticar usuario' })
        }

    },
    getlistUser: async (req, res) => {
        try {
            const user = await User.find();
            res.status(200).json(user)
        } catch (error) {
            console.log(error);
            res.status(400).json({ error: 'Error al obtener los usuarios' });
        }
    },

    putModifyUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, password, role } = req.body;
            let update = { name, email, password, role };
            const userModify = await User.findByIdAndUpdate(id, update, { new: true });
            res.json(userModify)
        } catch (error) {
            res.status(400).json({ error: 'error al Actualizar usuario' })
            console.log(error)
        }
    },

 
    addToFavorites: async (req, res) => {
        try {
            const { userId, productId } = req.params;
            
        
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
           
            if (!user.favoritos) {
                user.favoritos = [];
            }
            
      
            if (user.favoritos.includes(productId)) {
                return res.status(400).json({ message: 'El producto ya está en favoritos' });
            }
            
      
            user.favoritos.push(productId);
            await user.save();
            
            res.status(200).json({ message: 'Producto añadido a favoritos', favoritos: user.favoritos });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al añadir a favoritos' });
        }
    },

   
    removeFromFavorites: async (req, res) => {
        try {
            const { userId, productId } = req.params;
            
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
           
            if (!user.favoritos || !user.favoritos.includes(productId)) {
                return res.status(400).json({ message: 'El producto no está en favoritos' });
            }
            
        
            user.favoritos = user.favoritos.filter(id => id.toString() !== productId);
            await user.save();
            
            res.status(200).json({ message: 'Producto eliminado de favoritos', favoritos: user.favoritos });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al eliminar de favoritos' });
        }
    },

  
    getFavorites: async (req, res) => {
        try {
            const { userId } = req.params;
            
            const user = await User.findById(userId).populate('favoritos');
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            res.status(200).json({ favoritos: user.favoritos || [] });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Error al obtener favoritos' });
        }
    }
};


export default httpUsers;
