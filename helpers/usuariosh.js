import Usuario from '../models/usuario.js';

const helperUsers = {

    validarEmail: async (email) => {
        const existe = await Usuario.findOne({ email });
        if (existe) {
            throw new Error('email ya registrado')
        }
    },
    validarEmailPut: async (email, id) => {
        const existe = await Usuario.findOne({ email: email, })
        if (existe && existe._id !== id) {
            throw new Error('email ya registrado')
        }
    },
    validarId: async (id) => {
        const existe = await Usuario.findById(id)
        if (!existe) {
            throw new Error('usuario no encontrado')
        }
    },
}

export default helperUsers;
