# Documento Explicativo de Lógica de Negocio y Arquitectura
## Proyecto: Panel de Riesgo de Proveedores con Comprobante QR (Escenario 4)
**Laboratorio #1 - Soluciones de Negocio: POO + n8n**  
**Fecha:** Octubre 2026  
**Autor:** Estudiante / Desarrollador Backend

---

## 1. Resumen Ejecutivo
El presente proyecto implementa un sistema automatizado de control de riesgo financiero y tributario para el procesamiento de pagos a proveedores de servicios profesionales. La solución combina los principios de la **Programación Orientada a Objetos (POO)** en JavaScript puro (ES6 / CommonJS) con la capacidad de orquestación visual e integración empresarial de **n8n** y bases de datos locales con **JSON Server**.

El objetivo primordial es garantizar que ningún desembolso sea emitido a proveedores que mantengan una condición de morosidad o irregularidad ante la autoridad fiscal (Ministerio de Hacienda), calculando en tiempo real las retenciones de ley y emitiendo un comprobante digital inmutable mediante un código QR únicamente cuando la transacción sea legítimamente aprobada.

---

## 2. Arquitectura de Dominio (POO)

### 2.1 Jerarquía de Herencia en 3 Niveles
La solución adopta una estricta jerarquía de herencia vertical para maximizar la reutilización y el principio de responsabilidad única:

1. **Clase Abuelo: `EntidadComercial` (`src/models/EntidadComercial.js`)**
   - **Responsabilidad:** Modela la identidad legal básica de cualquier participante comercial (persona física o jurídica).
   - **Atributos:** `nombre`, `cedula`.
   - **Métodos:**
     - `obtenerIdentificacion()`: Retorna la representación formateada y legible de la entidad o notifica la ausencia de identificación legal.
     - `esIdentificacionValida()`: Valida sintácticamente la presencia de la cédula.

2. **Clase Padre: `Proveedor` (`src/models/Proveedor.js`)**
   - **Responsabilidad:** Especializa a la entidad comercial agregando el contexto tributario y la evaluación de riesgo ante el Ministerio de Hacienda.
   - **Herencia:** `class Proveedor extends EntidadComercial`.
   - **Atributos heredados y propios:** `nombre`, `cedula`, `estadoHacienda`, `nivelRiesgo`.
   - **Métodos:**
     - `evaluarRiesgo()`: Evalúa si el estado tributario representa un riesgo financiero:
       - Si `estadoHacienda === "Al dia"` $\rightarrow$ Riesgo `"Bajo"`, apto para procesar.
       - Si `estadoHacienda === "Moroso"` $\rightarrow$ Riesgo `"Alto"`, bloqueo automático (**RN-02**).
       - Si `estadoHacienda === "Desconocido"` o nulo $\rightarrow$ Riesgo `"Alto"` preventivo (**ERR-02** y **RN-01**).

3. **Clase Nieto: `ProveedorServicios` (`src/models/ProveedorServicios.js`)**
   - **Responsabilidad:** Especializa al proveedor en el sector de servicios profesionales, gestionando tasas de retención fiscal y la construcción de la carga útil del código QR.
   - **Herencia:** `class ProveedorServicios extends Proveedor`.
   - **Atributos heredados y propios:** `tipoServicio`, `porcentajeRetencion` (ej. 13% o 2%).
   - **Métodos:**
     - `calcularMontoNeto(montoBruto)`: Aplica la deducción del porcentaje de retención sobre el monto bruto, retornando el desglose de monto retenido y monto líquido a girar (**RN-03**).
     - `generarPayloadQR(montoNeto, fecha)`: Construye la cadena estructurada inmutable con los datos clave de la transacción: Proveedor, Cédula, Monto Neto, Fecha y Servicio (**RN-04**).

### 2.2 Clase de Proceso y Composición: `Pago` (`src/models/Pago.js`)
- **Responsabilidad:** Orquestador central del ciclo de vida del pago. Implementa una relación de **composición** al contener una instancia de `ProveedorServicios`.
- **Atributos:** `idPago`, `monto`, `proveedor` (instancia de `ProveedorServicios`), `fecha`, `estado`, `montoNeto`, `retencion`, `datosParaQR`, `qrUrl`, `motivoRetencion`.
- **Métodos:**
  - `procesarPago()`: Evalúa secuencialmente la validez de datos (**ERR-01**), el estado del servicio externo (**ERR-02**), la consulta obligatoria (**RN-01**) y el riesgo tributario (**RN-02**). En caso de aprobación, liquida la retención (**RN-03**) y construye el comprobante QR (**RN-04**). En caso de retención o error, bloquea irrevocablemente cualquier URL o payload QR (**RN-05**).
  - `toObjeto()`: Normaliza y serializa la entidad procesada para su persistencia en JSON Server o consumo en n8n.

---

## 3. Matriz Detallada de Reglas de Negocio

| Regla | Nombre | Descripción Técnica |
| :---: | :--- | :--- |
| **RN-01** | **Validación tributaria obligatoria** | Todo pago en estado `"Pendiente"` requiere obligatoriamente una consulta exitosa ante Hacienda. Si el pago carece de estado verificado, se marca preventivamente en estado `"Retenido"`. |
| **RN-02** | **Bloqueo automático por morosidad** | Si el proveedor registra condición `"Moroso"`, el método `evaluarRiesgo()` califica el riesgo como `"Alto"` y el pago pasa automáticamente a `"Retenido"` con motivo explicativo. |
| **RN-03** | **Cálculo de retención por servicio** | Se aplica la retención porcentual sobre el importe bruto: $\text{Monto Neto} = \text{Monto Bruto} - (\text{Monto Bruto} \times \text{Porcentaje Retención})$. |
| **RN-04** | **Generación obligatoria de comprobante QR** | Todo pago en estado `"Aprobado"` genera una cadena formateada que se traduce en una imagen QR mediante `https://api.qrserver.com/v1/create-qr-code/`. |
| **RN-05** | **Restricción de comprobante en pagos retenidos** | Si el pago resulta `"Retenido"` o en `"Error de validacion"`, los campos `datosParaQR` y `qrUrl` se fuerzan a `null` y la API externa no es invocada. |

---

## 4. Matriz de Manejo de Excepciones

| Código | Situación Inesperada | Criterio de Detección | Acción de Mitigación |
| :---: | :--- | :--- | :--- |
| **ERR-01** | **Datos Incompletos de Origen** | Cédula vacía/nula o Monto bruto $\le 0$. | Se asigna estado `"Error de validacion"`, se documenta el motivo y se omite la llamada a Hacienda y QR sin detener el procesamiento del resto del lote. |
| **ERR-02** | **Falla en API Externa o Cédula no Registrada** | Timeout, error 404/500 o respuesta no concluyente de Hacienda. | El nodo HTTP de n8n opera con `Continue On Fail: true`. El nodo Code asigna `estadoHacienda = "Desconocido"` y retiene preventivamente el pago bajo `"Error de conexión con Hacienda - Revisión manual"`. |

---

## 5. Orquestación Automatizada en n8n

El flujo implementado en [workflow_aprobacion.json](file:///c:/Users/Latitude%205490/Desktop/practicas%20de%20progra/practicas%20semana%208/ProyectoQR/n8n/workflow_aprobacion.json) opera de la siguiente manera:

1. **Trigger Manual / Schedule:** Inicia la ejecución del ciclo de validación.
2. **HTTP Request 1 (JSON Server):** Consulta los registros de `http://localhost:3000/pagos?estado=Pendiente`.
3. **HTTP Request 2 (Hacienda / Mock):** Realiza la consulta por cédula con tolerancia a fallos (`Continue On Fail`).
4. **Code Node (POO Unificada):** Instancia los modelos `ProveedorServicios` y `Pago`, ejecutando `procesarPago()` de manera idéntica a la versión de consola.
5. **IF Node (Bifurcación de Decisión):** Separa los registros cuyo `estado` sea `"Aprobado"`.
   - **Rama True (Aprobados):** Invoca la API `api.qrserver.com` para generar el comprobante visual y actualiza el pago en JSON Server con estado `"Aprobado"`, monto neto, retención y URL del QR.
   - **Rama False (Retenidos o Error):** Actualiza el pago en JSON Server directamente con su estado final y motivo, respetando la regla **RN-05**.

---

## 6. Conclusiones y Cumplimiento
- **Desacoplamiento y Portabilidad:** El modelo POO funciona de forma 100% autónoma en Node.js mediante `node src/main.js` y se exporta de manera idéntica al nodo `Code` de n8n.
- **Trazabilidad Integral:** Cada decisión de negocio está respaldada por una regla de auditoría clara y verificable en los datos almacenados en `db.json`.
