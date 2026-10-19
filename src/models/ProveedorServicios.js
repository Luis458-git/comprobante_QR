const Proveedor = require('./Proveedor');

/**
 * Clase Nieto: ProveedorServicios
 * Hereda de Proveedor y añade especialización en servicios profesionales, retenciones tributarias,
 * generación de Clave de Pago única y construcción del payload para el código QR.
 */
class ProveedorServicios extends Proveedor {
  /**
   * @param {string} nombre - Nombre del proveedor
   * @param {string} cedula - Cédula tributaria
   * @param {string|null} estadoHacienda - Estado tributario ante Hacienda
   * @param {string|null} nivelRiesgo - Nivel de riesgo
   * @param {string} tipoServicio - Tipo de servicio prestado (ej. "Consultoría TI", "Mantenimiento")
   * @param {number} porcentajeRetencion - Porcentaje de retención (ej. 13 para 13% o 2 para 2%)
   * @param {string} email - Correo electrónico del proveedor para envío del comprobante
   */
  constructor(
    nombre,
    cedula,
    estadoHacienda = null,
    nivelRiesgo = null,
    tipoServicio = 'Servicios Profesionales',
    porcentajeRetencion = 13,
    email = ''
  ) {
    super(nombre, cedula, estadoHacienda, nivelRiesgo, email);
    this.tipoServicio = tipoServicio || 'Servicios Profesionales';
    this.porcentajeRetencion = typeof porcentajeRetencion === 'number' ? porcentajeRetencion : 13;
  }

  /**
   * RN-03: Cálculo de retención por servicio.
   * Aplica deducciones o retenciones según el porcentaje asignado al tipo de servicio profesional.
   * @param {number} montoBruto - Monto bruto a pagar
   * @returns {{ montoBruto: number, porcentajeRetencion: number, montoRetencion: number, montoNeto: number }}
   */
  calcularMontoNeto(montoBruto) {
    const bruto = Number(montoBruto) || 0;
    const factor = this.porcentajeRetencion > 1 ? this.porcentajeRetencion / 100 : this.porcentajeRetencion;
    const montoRetencion = Number((bruto * factor).toFixed(2));
    const montoNeto = Number((bruto - montoRetencion).toFixed(2));

    return {
      montoBruto: bruto,
      porcentajeRetencion: this.porcentajeRetencion,
      montoRetencion,
      montoNeto
    };
  }

  /**
   * Genera una Clave de Pago única y legible para trazabilidad y comprobantes.
   * Formato: REF-[AÑO]-PAY-[ID]-[RANDOM] (Ej: REF-2026-PAY-PAG-001-A8F2)
   * @param {string} idPago - Identificador del pago
   * @param {string} fecha - Fecha del pago
   * @returns {string} Clave de pago alfanumérica única
   */
  generarClavePago(idPago = '000', fecha = new Date().toISOString().split('T')[0]) {
    const anio = fecha ? (new Date(fecha).getFullYear() || 2026) : 2026;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REF-${anio}-PAY-${idPago}-${randomHex}`;
  }

  /**
   * RN-04: Generación de cadena de texto estandarizada para el código QR con Clave de Pago.
   * @param {number} montoNeto - Monto neto liquidado
   * @param {string} clavePago - Clave única de referencia
   * @param {string} fecha - Fecha de la transacción
   * @returns {string} Payload inmutable
   */
  generarPayloadQR(montoNeto, clavePago, fecha = new Date().toISOString().split('T')[0]) {
    const ref = clavePago || this.generarClavePago('000', fecha);
    return `CLAVE: ${ref} | PROVEEDOR: ${this.nombre} | CEDULA: ${this.cedula} | MONTO_NETO: CRC ${Number(montoNeto).toFixed(2)} | FECHA: ${fecha} | SERVICIO: ${this.tipoServicio}`;
  }

  /**
   * Genera simultáneamente las dos propiedades requeridas para el comprobante:
   * 1. clavePago: Referencia única legible (para correo y encabezados).
   * 2. datosParaQR: Payload estructurado para api.qrserver.com.
   * @param {string} idPago - Identificador del pago
   * @param {number} montoNeto - Monto neto a pagar
   * @param {string} fecha - Fecha del pago
   * @returns {{ clavePago: string, datosParaQR: string }}
   */
  generarComprobante(idPago, montoNeto, fecha = new Date().toISOString().split('T')[0]) {
    const clavePago = this.generarClavePago(idPago, fecha);
    const datosParaQR = this.generarPayloadQR(montoNeto, clavePago, fecha);

    return {
      clavePago,
      datosParaQR
    };
  }
}

module.exports = ProveedorServicios;
