import Joi from "joi";
import Categoria from "../models/categorias.js";

const especificacionesCategorias = {
  portatiles: Joi.object({
    referencia: Joi.string().required(),
    sistemaOperativo: Joi.string().required(),
    almacenamiento: Joi.string().required(),
    marcaProcesador: Joi.string().required(),
    tipoAlmacenamiento: Joi.string(),
    ram: Joi.string().required(),
    modeloProcesador: Joi.string(),
    marcaGrafica: Joi.string(),
    bateria: Joi.string()
  }),

  pcEscritorio: Joi.object({
    referencia: Joi.string().required(),
    sistemaOperativo: Joi.string().required(),
    almacenamiento: Joi.string().required(),
    ram: Joi.string().required(),
    tipoGabinete: Joi.string().required(),
    fuentePoder: Joi.string(),
    refrigeracion: Joi.string()
  }),

  celulares: Joi.object({
    modelo: Joi.string().required(),
    sistemaOperativo: Joi.string().required().valid('Android', 'iOS', 'harmonyOS'),
    almacenamiento: Joi.string().required(),
    ram: Joi.string().required(),
    camaraPrincipal: Joi.string(),
    bateria: Joi.string()
  }),

  smartwatch: Joi.object({
    modelo: Joi.string().required(),
    compatibilidad: Joi.string().required().valid('iOS', 'Android', 'Ambos'),
    duracionBateria: Joi.string().required(),
    resistenciaAgua: Joi.string().valid('IP68', 'IP67', 'No'),
    pantalla: Joi.string(),
    conectividad: Joi.string().valid('Bluetooth', 'WiFi', 'Ambos')
  }),

  pantallas: Joi.object({
    pulgadas: Joi.string().required().valid('20', '21', '22', '23', '24', '25'),
    resolucion: Joi.string().required().pattern(new RegExp(/^\d+x\d+$/)),
    tasaRefresco: Joi.string().required(),
    tipoPanel: Joi.string().valid('IPS', 'VA', 'OLED', 'TN'),
    conectores: Joi.array().items(Joi.string().valid('HDMI', 'DP', 'USB-C', 'VGA'))
  }),

  audifonos: Joi.object({
    modelo: Joi.string().required(),
    tipo: Joi.string().required().valid('In-ear', 'On-ear', 'Over-ear'),
    conexion: Joi.string().required().valid('Alámbrico', 'Bluetooth', 'Híbrido'),
    cancelacionRuido: Joi.boolean(),
    microfono: Joi.boolean()
  }),

  tablets: Joi.object({
    modelo: Joi.string().required(),
    sistemaOperativo: Joi.string().required().valid('Android', 'iOS', 'Windows'),
    almacenamiento: Joi.string().required(),
    tamañoPantalla: Joi.string().required(),
    conectividad: Joi.string().valid('WiFi', '4G', '5G')
  }),

  mouse: Joi.object({
    modelo: Joi.string().required(),
    tipo: Joi.string().required().valid('Gaming', 'Oficina', 'Ergonómico'),
    conexion: Joi.string().required().valid('USB', 'Bluetooth', 'Wireless'),
    dpi: Joi.number().min(800).max(16000),
    botonesProgramables: Joi.number()
  }),

  teclado: Joi.object({
    modelo: Joi.string().required(),
    tipo: Joi.string().required().valid('Mecánico', 'Membrana', 'Híbrido'),
    conexion: Joi.string().required().valid('USB', 'Bluetooth', 'Wireless'),
    switch: Joi.string().valid('Red', 'Blue', 'Brown', 'Black'),
    retroiluminacion: Joi.boolean()
  }),

  componentes: Joi.object({
    tipo: Joi.string().required().valid('RAM', 'GPU', 'CPU', 'Disco Duro', 'Fuente'),
    modelo: Joi.string().required(),
    especificacionTecnica: Joi.string().required(),
    compatibilidad: Joi.array().items(Joi.string())
  })
};

// Controlador para crear categoría
export const createCategoria = async (req, res) => {
  const { codigo, name, description, img } = req.body;

  const categoriasPermitidas = Object.keys(especificacionesCategorias);
  
  if (!categoriasPermitidas.includes(codigo)) {
    return res.status(400).json({ 
      error: "Código de categoría no válido",
      categoriasPermitidas 
    });
  }

  try {
    const existeCategoria = await Categoria.findOne({ codigo });
    if (existeCategoria) {
      return res.status(400).json({ error: "Esta categoría ya existe" });
    }

    const categoria = new Categoria({ codigo, name, description, img });
    await categoria.save();
    res.status(201).json(categoria);

  } catch (error) {
    res.status(500).json({ 
      error: "Error al crear categoría",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find({ state: '1' }).sort({ name: 1 });
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al listar categorías",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener especificaciones de categoría
export const getEspecificacionesByCategoria = async (req, res) => {
  const { codigo } = req.params;

  if (!especificacionesCategorias[codigo]) {
    return res.status(404).json({ error: "Categoría no encontrada" });
  }

  res.status(200).json({
    campos: Object.keys(especificacionesCategorias[codigo].describe().keys)
  });
};

// Actualizar categoría (solo metadata, no especificaciones)
export const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { name, description, img } = req.body;

  try {
    const categoria = await Categoria.findByIdAndUpdate(
      id,
      { name, description, img },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.status(200).json(categoria);
  } catch (error) {
    res.status(500).json({ 
      error: "Error al actualizar categoría",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cambiar estado de categoría
export const toggleCategoriaState = async (req, res) => {
  const { id } = req.params;

  try {
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    categoria.state = categoria.state === '1' ? '0' : '1';
    await categoria.save();

    res.status(200).json({
      message: `Categoría ${categoria.state === '1' ? 'activada' : 'desactivada'}`,
      categoria
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Error al cambiar estado",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  createCategoria,
  getCategorias,
  getEspecificacionesByCategoria,
  updateCategoria,
  toggleCategoriaState
};  