import User from '../models/usuario.js'
import { generarJWT } from '../middleware/jwt.js'
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
            res.status(200).json({ token })
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
    }
};


export default httpUsers;