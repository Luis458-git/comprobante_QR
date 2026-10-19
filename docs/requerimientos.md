# Documento de Requerimientos y Trazabilidad del Proyecto

> **🤖 Instrucciones de Control para el Agente:** 
> A medida que se generen, revisen o validen los archivos y componentes de este proyecto con el usuario, actualiza este documento cambiando el estado de las casillas de `[ ]` (Pendiente) a `[x]` (Completado / Verificado).

**Proyecto:** Panel de Riesgo de Proveedores con Comprobante QR (Escenario 4)  
**Curso / Laboratorio:** Laboratorio #1 - Soluciones de Negocio: POO + n8n  
**Modalidad:** Individual  
**Tecnologías:** JavaScript Puro (POO), JSON Server, n8n, API Hacienda, API QR Server (`api.qrserver.com`).

---

## 1. Arquitectura de Archivos del Proyecto

```text
📂 proyecto_laboratorio1/
├── 📂 db/
│   └── 📄 db.json                     (Base de datos simulada para JSON Server)
├── 📂 src/
│   ├── 📂 models/                     (Jerarquía de clases POO)
│   │   ├── 📄 EntidadComercial.js     (Clase Abuelo)
│   │   ├── 📄 Proveedor.js            (Clase Padre)
│   │   ├── 📄 ProveedorServicios.js   (Clase Nieto)
│   │   └── 📄 Pago.js                 (Clase de Proceso / Composición)
│   └── 📄 main.js                     (Script de prueba independiente en consola)
├── 📂 n8n/
│   └── 📄 workflow_aprobacion.json    (Exportación del workflow funcional de n8n)
├── 📂 docs/
│   ├── 📄 requerimientos.md           (Este documento de trazabilidad)
│   └── 📄 logica_de_negocio.pdf       (Documento final explicativo de 2-4 páginas)
└── 📄 README.md                       (Instrucciones de instalación y ejecución)
```

---

## 2. Registro y Estado de Archivos

### 📂 Carpeta `db/`
* [x] **`db.json`**: Actúa como la base de datos local consumida y actualizada mediante JSON Server.
  * *Contenido:* Colección `"pagos"` con registros en estado `"Pendiente"` (incluye casos de prueba para proveedores al día, morosos y registros con datos incompletos para pruebas de error).

### 📂 Carpeta `src/models/` (Jerarquía POO y Composición)
* [x] **`EntidadComercial.js` (Clase Abuelo)**:
  * *Atributos:* `nombre`, `cedula`.
  * *Métodos:* `obtenerIdentificacion()` — formatea y valida la identidad básica de cualquier persona o empresa registrada.
* [x] **`Proveedor.js` (Clase Padre — hereda de `EntidadComercial`)**:
  * *Atributos heredados + propios:* `estadoHacienda`, `nivelRiesgo`.
  * *Métodos:* `evaluarRiesgo()` — implementa la regla de negocio principal que determina si el proveedor representa un riesgo financiero según su estado tributario (`"Moroso"` vs `"Al dia"`).
* [x] **`ProveedorServicios.js` (Clase Nieto — hereda de `Proveedor`)**:
  * *Atributos heredados + propios:* `tipoServicio`, `porcentajeRetencion`.
  * *Métodos:*
    * `calcularMontoNeto(montoBruto)` — aplica deducciones o retenciones según el tipo de servicio profesional.
    * `generarPayloadQR(monto)` — construye la cadena de texto estandarizada que se enviará a la API generadora de códigos QR.
* [x] **`Pago.js` (Clase de Proceso / Composición)**:
  * *Atributos:* `idPago`, `monto`, `proveedor` (instancia de `ProveedorServicios`), `estado`, `datosParaQR`, `motivoRetencion`.
  * *Métodos:* `procesarPago()` — orquesta la validación de datos incompletos, invoca la evaluación de riesgo del proveedor y define el estado final del pago (`"Aprobado"`, `"Retenido"` o `"Error de validacion"`).

### 📂 Carpeta `src/`
* [x] **`main.js`**: Script de ejecución independiente en Node.js.
  * *Contenido:* Importa las clases de `src/models/`, instancia objetos con datos reales de prueba (proveedor al día, proveedor moroso, proveedor sin cédula) y muestra por consola el resultado de sus métodos sin necesidad de que n8n esté corriendo.

### 📂 Carpeta `n8n/`
* [x] **`workflow_aprobacion.json`**: Archivo JSON exportado de n8n.
  * *Contenido:* Flujo automatizado completo que integra los nodos Trigger, HTTP Requests (JSON Server, Hacienda, QR Server), Nodo Code (con las clases integradas) y Nodo IF.

### 📂 Carpeta `docs/` y Raíz
* [x] **`docs/requerimientos.md`**: Documento de trazabilidad y control de requisitos.
* [ ] **`docs/logica_de_negocio.pdf`**: Documento explicativo de 2 a 4 páginas.
* [x] **`README.md`**: Documentación técnica para ejecutar el entorno local.

---

## 3. Matriz de Cumplimiento de Reglas de Negocio (Mínimo 5)

| Estado | Código | Regla de Negocio | Componente / Clase donde se implementa |
| :---: | :--- | :--- | :--- |
| [x] | **RN-01** | **Validación tributaria obligatoria:** Ningún pago en estado `"Pendiente"` puede aprobarse sin consultar primero el estado del proveedor ante la API de Hacienda. | Workflow n8n (Nodo HTTP Request Hacienda) y clase `Proveedor.js`. |
| [x] | **RN-02** | **Bloqueo automático por morosidad:** Si el proveedor figura como `"Moroso"` ante Hacienda, el pago cambia automáticamente a estado `"Retenido"` para revisión manual. | Método `evaluarRiesgo()` en `Proveedor.js` y bifurcación en Nodo `IF` de n8n. |
| [x] | **RN-03** | **Cálculo de retención por servicio:** A los proveedores de servicios profesionales se les calcula el monto neto aplicando el porcentaje de retención correspondiente antes de emitir el comprobante. | Método `calcularMontoNeto()` en `ProveedorServicios.js`. |
| [x] | **RN-04** | **Generación obligatoria de comprobante QR:** Todo pago que resulte `"Aprobado"` debe generar un código QR visual mediante `api.qrserver.com` con los datos inmutables de la transacción (Proveedor, Cédula, Monto Neto, Fecha y Servicio). | Método `generarPayloadQR()` en `ProveedorServicios.js` y Nodo HTTP Request QR en n8n. |
| [x] | **RN-05** | **Restricción de comprobante en pagos retenidos:** Bajo ninguna circunstancia se debe invocar la API de QR ni asociar un comprobante visual a pagos en estado `"Retenido"` o `"Error de validacion"`. | Método `procesarPago()` en `Pago.js` y rama `False` del Nodo `IF` en n8n. |

---

## 4. Matriz de Manejo de Errores (Mínimo 2 situaciones inesperadas)

| Estado | Código | Situación Inesperada / Error | Mecanismo de Resolución en la Solución |
| :---: | :--- | :--- | :--- |
| [x] | **ERR-01** | **Datos incompletos de origen:** El registro del pago en JSON Server no cuenta con la cédula del proveedor (vacía o nula) o el monto es menor o igual a cero ($\le 0$). | El método `procesarPago()` en `Pago.js` (y dentro del nodo *Code* en n8n) valida la integridad de los datos antes de evaluar el riesgo. Si faltan datos, asigna el estado `"Error de validacion"` y detalla el motivo sin detener el flujo de los demás pagos. |
| [x] | **ERR-02** | **Caída del servicio externo o Cédula no encontrada:** La API de Hacienda no responde (timeout / error $500$) o la cédula consultada no existe (error $404$). | El nodo HTTP Request hacia Hacienda se configura con la opción `Continue On Fail: true`. El nodo *Code* detecta la ausencia de una respuesta tributaria válida (`estadoHacienda === "Desconocido"`) y retiene preventivamente el pago bajo el motivo `"Error de conexión con Hacienda - Revisión manual"`. |

---

## 5. Checklist General de Auditoría del Laboratorio

### Diseño y Programación (POO)
* [x] **Arquitectura definida:** Estructura de carpetas y responsabilidades documentadas.
* [x] **Diseño POO en JavaScript puro:** Uso de herencia en 3 niveles (`EntidadComercial` $\rightarrow$ `Proveedor` $\rightarrow$ `ProveedorServicios`) y composición (`Pago`).
* [x] **Prueba independiente (`main.js`):** Ejecutable con `node src/main.js` mostrando resultados en consola sin depender de n8n.
* [x] **Solución unificada (POO + n8n):** La misma lógica de clases diseñada en `src/models/` vive dentro del nodo `Code` del workflow.

### Componentes Mínimos del Workflow en n8n
* [x] **1 Trigger:** Webhook o Schedule Trigger configurado para iniciar el proceso.
* [x] **2+ HTTP Requests:** Lectura/Actualización en JSON Server, consulta a API de Hacienda y generación en API QR Server.
* [x] **1 IF / Filter:** Bifurcación real que separa los pagos aprobados de los retenidos/erróneos.
* [x] **1 Code:** Instanciación de clases y ejecución de reglas de negocio sobre los datos del flujo.
* [x] **1 Resultado final verificable:** Registros actualizados en `db.json` con su estado definitivo y la URL del código QR generado.