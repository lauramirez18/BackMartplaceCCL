// Renderizar el botón de PayPal
const renderPayPalButtons = () => {
  if (window.paypal) {
    window.paypal
      .Buttons({
        createOrder: async (data, actions) => {
          try {
            // Validar datos antes de crear la orden
            if (!validateShippingData()) {
              console.error('Datos de envío incompletos');
              throw new Error("Datos de envío incompletos");
            }

            console.log('Creando orden en el backend con datos:', {
              usuarioId: authStore.user._id,
              products: authStore.cartItems,
              total: totalCOP.value
            });

            // Crear la orden en el backend primero
            const response = await fetch('/api/ordenes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                usuarioId: authStore.user._id,
                products: authStore.cartItems.map(item => ({
                  productId: item._id,
                  quantity: item.quantity,
                  price: item.price
                })),
                total: totalCOP.value
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Error del servidor:', errorData);
              throw new Error(errorData.message || 'Error al crear la orden en el servidor');
            }

            const orderData = await response.json();
            console.log('Orden creada en el backend:', orderData);

            if (!orderData._id) {
              throw new Error('ID de orden no recibido del servidor');
            }

            // Guardar el ID de la orden para usarlo después
            window.currentOrderId = orderData._id;
            
            // Crear la orden en PayPal
            const paypalOrder = await actions.order.create({
              purchase_units: [
                {
                  amount: { 
                    value: totalUSD.value,
                    currency_code: 'USD'
                  },
                  reference_id: orderData._id
                },
              ],
            });

            console.log('Orden de PayPal creada:', paypalOrder);
            return paypalOrder;

          } catch (error) {
            console.error('Error en createOrder:', error);
            import("../utils/notifications").then(({ showNotification }) => {
              showNotification(
                "error",
                "Error al crear la orden",
                error.message || "Hubo un problema al crear la orden. Por favor intenta nuevamente."
              );
            });
            throw error;
          }
        },
        onApprove: async (data, actions) => {
          try {
            console.log('Pago aprobado, capturando detalles:', data);
            const details = await actions.order.capture();
            console.log('Detalles del pago capturados:', details);
            
            // Guardar datos del pagador
            payerName.value = `${details.payer.name.given_name} ${details.payer.name.surname}`;
            payerEmail.value = details.payer.email_address;
            amountPaid.value = details.purchase_units[0].amount.value;

            console.log('Confirmando pago en el backend con:', {
              orderId: window.currentOrderId,
              paymentDetails: details
            });

            // Confirmar el pago en el backend
            const response = await fetch('/api/payments/paypal/confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: window.currentOrderId,
                paymentDetails: details
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Error en la respuesta:', errorData);
              throw new Error(errorData.message || 'Error al confirmar el pago');
            }

            const responseData = await response.json();
            console.log('Pago confirmado exitosamente:', responseData);

            // Limpiar el carrito después de una compra exitosa
            authStore.clearCart();
            
            // Mostrar factura
            mostrarFactura();
            
            // Redirigir a la página de confirmación
            router.push('/order-confirmation');

          } catch (error) {
            console.error('Error en onApprove:', error);
            import("../utils/notifications").then(({ showNotification }) => {
              showNotification(
                "error",
                "Error en el pago",
                error.message || "Hubo un problema al procesar tu pago. Por favor intenta nuevamente."
              );
            });
          }
        },
        onError: (err) => {
          console.error('Error en PayPal:', err);
          import("../utils/notifications").then(({ showNotification }) => {
            showNotification(
              "error",
              "Error en el pago",
              "Hubo un problema al procesar tu pago. Por favor intenta nuevamente."
            );
          });
        },
        onCancel: () => {
          console.log('Pago cancelado por el usuario');
          import("../utils/notifications").then(({ showNotification }) => {
            showNotification(
              "info",
              "Pago cancelado",
              "Has cancelado el proceso de pago."
            );
          });
        }
      })
      .render("#paypal-button-container");
  }
}; 