// utils/especificaciones.js

import Joi from "joi";

export const especificacionesCategorias = {
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
    marca: Joi.string().required(),
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