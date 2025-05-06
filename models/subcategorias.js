import mongoose from 'mongoose';

const subcategoriaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    enum: [
    
      'portatil_gaming', 'portatil_ultrabook',
     
      'pc_gaming', 'pc_allinone',
      
      'celular_gamaalta', 'celular_economico',
      
      'smartwatch_deportivo', 'smartwatch_lujo',
     
      'pantalla_gaming', 'pantalla_profesional',
     
      'audifono_inalambrico', 'audifono_cancelacionruido',
     
      'tablet_premium', 'tablet_economica',
     
      'mouse_gaming', 'mouse_inalambrico',
     
      'teclado_mecanico', 'teclado_inalambrico',
     
      'componente_gaming', 'componente_oficina'
    ]
  },
  name: {
    type: String,
    required: true
  },
  categoriaPadre: {
    type: String,
    required: true,
    enum: [
      'portatiles', 'pcEscritorio', 'celulares', 
      'smartwatch', 'pantallas', 'audifonos',
      'tablets', 'mouse', 'teclado', 'componentes'
    ]
  },
  state: {
    type: String,
    enum: ['1', '0'],
    default: '1'
  }
}, { timestamps: true, versionKey: false });

export default mongoose.model('Subcategoria', subcategoriaSchema);