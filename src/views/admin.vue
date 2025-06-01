// Generar ofertas automáticas
async function generarOfertasAutomaticas() {
  generandoOfertas.value = true
  try {
    const response = await axios.post('http://localhost:3000/api/productos/generar', {
      stockMinimo: 1,
      porcentajeDescuento: 15,
      duracionOfertaDias: 7
    })

    if (response.data.detalles?.productosNoCalifican?.length > 0) {
      mostrarNotificacion('warning', 'Algunos productos no pudieron ser incluidos en la oferta.')
    }

    mostrarNotificacion('positive', response.data.mensaje)
    await cargarProductosEnOferta()
    await cargarProductosDisponibles()
  } catch (error) {
    console.error("Error al generar ofertas automáticas:", error)
    if (error.response?.data?.error) {
      mostrarNotificacion('negative', error.response.data.error)
    } else {
      mostrarNotificacion('negative', 'Error al generar ofertas automáticas.')
    }
  } finally {
    generandoOfertas.value = false
    dialogoOfertasAutomaticas.value = false
  }
} 