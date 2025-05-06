import Subcategoria from '../models/subcategorias.js';

// Subcategorías predefinidas (2 por categoría)
const SUBCATEGORIAS_PREDEFINIDAS = [
  // Portátiles
  { codigo: 'portatil_gaming', name: 'Gaming', categoriaPadre: 'portatiles' },
  { codigo: 'portatil_ultrabook', name: 'Ultrabook', categoriaPadre: 'portatiles' },

  // PC Escritorio
  { codigo: 'pc_gaming', name: 'Gaming', categoriaPadre: 'pcEscritorio' },
  { codigo: 'pc_allinone', name: 'All-in-One', categoriaPadre: 'pcEscritorio' },

  // Celulares
  { codigo: 'celular_gamaalta', name: 'Gama Alta', categoriaPadre: 'celulares' },
  { codigo: 'celular_economico', name: 'Económicos', categoriaPadre: 'celulares' },

  // Smartwatches
  { codigo: 'smartwatch_deportivo', name: 'Deportivo', categoriaPadre: 'smartwatch' },
  { codigo: 'smartwatch_lujo', name: 'Lujo', categoriaPadre: 'smartwatch' },

  // Pantallas
  { codigo: 'pantalla_gaming', name: 'Gaming', categoriaPadre: 'pantallas' },
  { codigo: 'pantalla_profesional', name: 'Profesional', categoriaPadre: 'pantallas' },

  // Audífonos
  { codigo: 'audifono_inalambrico', name: 'Inalámbricos', categoriaPadre: 'audifonos' },
  { codigo: 'audifono_cancelacionruido', name: 'Cancelación de Ruido', categoriaPadre: 'audifonos' },

  // Tablets
  { codigo: 'tablet_premium', name: 'Premium', categoriaPadre: 'tablets' },
  { codigo: 'tablet_economica', name: 'Económicas', categoriaPadre: 'tablets' },

  // Mouse
  { codigo: 'mouse_gaming', name: 'Gaming', categoriaPadre: 'mouse' },
  { codigo: 'mouse_inalambrico', name: 'Inalámbrico', categoriaPadre: 'mouse' },

  // Teclados
  { codigo: 'teclado_mecanico', name: 'Mecánico', categoriaPadre: 'teclado' },
  { codigo: 'teclado_inalambrico', name: 'Inalámbrico', categoriaPadre: 'teclado' },

  // Componentes
  { codigo: 'componente_gaming', name: 'Gaming', categoriaPadre: 'componentes' },
  { codigo: 'componente_oficina', name: 'Oficina', categoriaPadre: 'componentes' }
];

// Inicializar subcategorías (solo ejecutar una vez)
export const inicializarSubcategorias = async (req, res) => {
  try {
    await Subcategoria.deleteMany({});
    const subcategorias = await Subcategoria.insertMany(SUBCATEGORIAS_PREDEFINIDAS);
    res.status(201).json({
      success: true,
      message: 'Subcategorías inicializadas',
      count: subcategorias.length,
      data: subcategorias
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al inicializar subcategorías',
      details: error.message
    });
  }
};

// Obtener todas las subcategorías
export const obtenerSubcategorias = async (req, res) => {
  try {
    const subcategorias = await Subcategoria.find({ state: '1' });
    res.status(200).json({
      success: true,
      count: subcategorias.length,
      data: subcategorias
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener subcategorías',
      details: error.message
    });
  }
};

// Obtener subcategorías por categoría padre
export const obtenerPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    const subcategorias = await Subcategoria.find({ 
      categoriaPadre: categoria,
      state: '1'
    });

    if (subcategorias.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron subcategorías para esta categoría'
      });
    }

    res.status(200).json({
      success: true,
      count: subcategorias.length,
      data: subcategorias
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener subcategorías',
      details: error.message
    });
  }
};

// Cambiar estado (activar/desactivar)
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategoria = await Subcategoria.findById(id);

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        error: 'Subcategoría no encontrada'
      });
    }

    subcategoria.state = subcategoria.state === '1' ? '0' : '1';
    await subcategoria.save();

    res.status(200).json({
      success: true,
      message: `Subcategoría ${subcategoria.state === '1' ? 'activada' : 'desactivada'}`,
      data: subcategoria
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado',
      details: error.message
    });
  }
};

export default {
  inicializarSubcategorias,
  obtenerSubcategorias,
  obtenerPorCategoria,
  cambiarEstado
};