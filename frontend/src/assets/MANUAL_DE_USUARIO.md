# 🏨 Manual de Usuario - HotelWork

**Versión:** 1.0  
**Fecha:** 18 de septiembre de 2026

---

## 📑 Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Primeros pasos / Instalación y configuración](#2-primeros-pasos--instalación-y-configuración)
3. [Interfaz de usuario](#3-interfaz-de-usuario)
4. [Guía de uso por funcionalidades](#4-guía-de-uso-por-funcionalidades)
   - [Huéspedes](#para-huéspedes)
   - [Staff (Personal de recepción)](#para-staff-personal-de-recepción)
   - [Administradores](#para-administradores)
5. [Flujos de trabajo comunes (paso a paso)](#5-flujos-de-trabajo-comunes-paso-a-paso)
6. [Preguntas frecuentes (FAQ)](#6-preguntas-frecuentes-faq)
7. [Solución de problemas (Troubleshooting)](#7-solución-de-problemas-troubleshooting)
8. [Glosario de términos](#8-glosario-de-términos)
9. [Contacto y soporte](#9-contacto-y-soporte)

---

## 1. Introducción

### ¿Qué es este producto?
**HotelWork** es un Sistema Integral de Gestión y Reserva Hotelera. Es una plataforma web diseñada para simplificar y optimizar todas las operaciones de un hotel, desde la reserva de habitaciones por parte de los clientes hasta la gestión administrativa y operativa del día a día por parte del personal.

### ¿Para quién está dirigido?
El sistema está diseñado para tres tipos de usuarios (roles):
- **Huéspedes:** Clientes que buscan reservar habitaciones y gestionar sus estancias.
- **Staff (Recepcionistas):** Personal encargado de atender a los huéspedes, gestionar entradas/salidas y procesar pagos.
- **Administradores:** Gerentes o dueños que necesitan visión global, control de inventario (habitaciones) y acceso a reportes financieros.

### Requisitos del sistema
- **Navegador Web:** Google Chrome (recomendado), Mozilla Firefox, Safari o Microsoft Edge (versiones recientes).
- **Conexión:** Se requiere conexión a Internet o a la red local del hotel.
- No es necesario instalar ningún software adicional en su computadora, todo funciona a través del navegador.

---

## 2. Primeros pasos / Instalación y configuración

### Acceso al Sistema
Para acceder a HotelWork, abra su navegador web e ingrese la dirección proporcionada por su departamento de TI (por ejemplo, `http://localhost:5173` para entornos locales).

*\[Imagen: Captura de la pantalla de inicio o Login del sistema]*

### Cuentas de Acceso Rápido (Prueba)
Si está evaluando el sistema, puede utilizar las siguientes cuentas preconfiguradas para explorar los diferentes perfiles:

| Rol | Correo Electrónico | Contraseña |
|---|---|---|
| **Administrador** | `admin@hotelwork.com` | `Admin1234!` |
| **Staff (Recepción)** | `staff@hotelwork.com` | `Staff1234!` |
| **Huésped** | `guest@hotelwork.com` | `Guest1234!` |

### Registro e Inicio de Sesión
1. **Inicio de sesión:** En la pantalla principal, ingrese su correo electrónico y contraseña, luego haga clic en **"Iniciar Sesión"**.
2. **Registro (Solo Huéspedes):** Si es un cliente nuevo, haga clic en **"Crear cuenta"**, complete el formulario con sus datos básicos y elija una contraseña segura.

---

## 3. Interfaz de usuario

La interfaz de HotelWork es limpia y se adapta a su rol.

*\[Imagen: Vista general del panel principal señalando la barra superior y el menú]*

### Elementos principales:
- **Barra de Navegación Superior:** Muestra su nombre de usuario, rol actual, y un botón para **Cerrar Sesión**. También puede incluir iconos de notificaciones.
- **Menú Principal:** Ubicado en la parte superior o lateral izquierdo (dependiendo de la pantalla). Las opciones cambian según sus permisos:
  - *Huéspedes verán:* Buscar Habitaciones, Mis Reservas.
  - *Staff verá:* Recepción (Check-in/out), Pagos, Ver Reservas.
  - *Admin verá:* Dashboard, Gestión de Habitaciones, Gestión de Usuarios.

---

## 4. Guía de uso por funcionalidades

### Para Huéspedes

#### Búsqueda de habitaciones
1. Diríjase a la sección **Buscar Habitaciones**.
2. Ingrese las fechas deseadas (Check-in y Check-out).
3. (Opcional) Filtre por tipo de habitación, rango de precio o capacidad.
4. El sistema mostrará solo las habitaciones disponibles para esas fechas exactas.

#### Gestión de reservas y el Historial
- **Crear reserva:** Desde los resultados de búsqueda, seleccione una habitación y haga clic en **"Reservar"**. Confirme los detalles.
- **Mis Reservas (Historial):** En esta sección puede ver todas sus reservas pasadas y futuras. 
- **Cancelar reserva:** Desde "Mis Reservas", seleccione una reserva activa y haga clic en **"Cancelar"**. (Sujeto a políticas del hotel).

### Para Staff (Personal de recepción)

#### Check-in y Check-out
- **Check-in (Entrada):** Cuando el huésped llegue, busque su reserva en el panel de **Recepción**. Haga clic en **"Realizar Check-in"**. El estado de la habitación cambiará automáticamente a *Ocupada*.
- **Check-out (Salida):** Al finalizar la estancia, busque la habitación o reserva, verifique que los pagos estén completos y haga clic en **"Realizar Check-out"**. La habitación pasará automáticamente a estar *Disponible*.

#### Registro de Pagos
1. Vaya a la sección de **Pagos** o acceda desde los detalles de la reserva.
2. El sistema calcula automáticamente el total (noches × precio + IVA del 19%).
3. Registre el pago ingresando el monto. Puede registrar pagos parciales o totales.
4. Seleccione el método: Tarjeta, Efectivo o Transferencia.

### Para Administradores

#### Dashboard y Reportes
1. Al iniciar sesión, verá el **Dashboard** principal.
2. Aquí podrá visualizar en tiempo real:
   - Tasa de ocupación actual.
   - Ingresos totales generados.
   - Gráficos de ingresos desglosados por método de pago.
*\[Imagen: Captura del Dashboard del Administrador con gráficos]*

#### Gestión de Habitaciones (Inventario)
1. Vaya a **Gestión de Habitaciones**.
2. **Crear:** Añada nuevas habitaciones (número, tipo, precio base, capacidad).
3. **Modificar estado:** Puede consultar o alternar el estado de una habitación entre *Disponible* u *Ocupada* (el sistema actualiza el estado automáticamente con el Check-in y Check-out).
4. **Eliminar:** Puede dar de baja una habitación (no se borra el historial gracias al borrado lógico/soft-delete).

---

## 5. Flujos de trabajo comunes (paso a paso)

### Flujo 1: Cómo realizar una reserva (Huésped)
1. Inicie sesión con su cuenta.
2. Vaya a **"Buscar Habitaciones"**.
3. Seleccione fecha de llegada y salida.
4. Elija la habitación que más le guste de la lista y haga clic en **"Reservar"**.
5. Revise el resumen del costo (incluyendo impuestos) y confirme. 
6. Recibirá una notificación de confirmación en el sistema.

### Flujo 2: Recepción y Check-in (Staff)
1. El huésped llega al hotel.
2. Inicie sesión como Staff.
3. Vaya a la pestaña **"Ver Reservas"** o **"Recepción"**.
4. Busque la reserva por el nombre del huésped o número de confirmación.
5. Verifique la identidad del huésped.
6. Haga clic en **"Check-in"**.
7. Entregue las llaves; la habitación ahora marca como *Ocupada*.

### Flujo 3: Check-out y cobro (Staff)
1. El huésped entrega las llaves.
2. Busque la reserva en el panel.
3. Vaya a la pestaña de **Pagos** de esa reserva.
4. Verifique el "Balance Pendiente".
5. Si hay saldo, haga clic en **"Registrar Pago"**, seleccione el método (ej. Tarjeta) y apruebe.
6. Una vez el balance esté en 0, haga clic en **"Check-out"**. 
7. La habitación queda disponible automáticamente para nuevos huéspedes.

---

## 6. Preguntas frecuentes (FAQ)

**¿Puede un huésped cancelar una reserva en cualquier momento?**  
Sí, desde su panel de "Mis Reservas", los huéspedes pueden cancelar siempre que no se haya realizado el Check-in. 

**¿Cómo se calcula el IVA?**  
El sistema agrega automáticamente un 19% (configurable por el administrador) sobre el precio base de las noches reservadas.

**¿Qué pasa si un usuario olvida su contraseña?**  
Actualmente, el administrador del sistema puede restablecer contraseñas desde el panel de "Gestión de Usuarios".

---

## 7. Solución de problemas (Troubleshooting)

| Problema | Causa Posible | Solución |
|---|---|---|
| **No puedo iniciar sesión ("Credenciales inválidas")** | Contraseña incorrecta o correo mal escrito. | Verifique que no haya espacios adicionales al final de su correo e intente de nuevo. |
| **No aparecen habitaciones en la búsqueda** | No hay disponibilidad para esas fechas. | Intente ampliar el rango de fechas o cambie el tipo de habitación. |
| **Error al hacer Check-out** | El huésped aún tiene un saldo pendiente por pagar. | Vaya a la sección de pagos de la reserva y liquide el balance pendiente antes de proceder. |
| **La habitación sigue "Ocupada" después de que el huésped se fue** | El staff olvidó presionar el botón de Check-out. | El Staff o Admin debe ingresar a la reserva y finalizar el proceso de Check-out manualmente. |

---

## 8. Glosario de términos

- **Check-in:** Proceso de registro a la llegada del huésped al hotel.
- **Check-out:** Proceso de salida, pago final y entrega de habitación.
- **Dashboard:** Panel de control principal (usualmente para administradores) que muestra un resumen gráfico de datos.
- **Rol:** Nivel de permisos que tiene un usuario en el sistema (Admin, Staff, Huésped).
- **Soft-delete:** Borrado lógico. Cuando se "elimina" una habitación, se oculta para futuras reservas pero se mantiene en la base de datos para no arruinar los reportes históricos.

---

## 9. Contacto y soporte

Si encuentra algún error del sistema que no puede resolver con este manual, por favor contacte al departamento de soporte técnico:
- **Email:** soporte@hotelwork.com
- **Teléfono Interno:** Extensión 101 (Departamento de Sistemas)
- **Horario de atención:** 24/7 para emergencias críticas del servidor.
