const Proveedor = require('./Proveedor');

/**
 * Clase Hija: ProveedorBienes
 * Reto 1: Herencia de Proveedor y aplicación de Polimorfismo.
 * Especializada en proveedores de la categoría "Bienes" (ej. suministros, mobiliario, hardware).
 * Sobrescribe procesarPagoEspecifico() sumando un monto fijo de flete (ej. CRC 5000) al monto base.
 */
class ProveedorBienes extends Proveedor {
  /**
   * @param {string} nombre - Nombre del proveedor
   * @param {string} cedula - Cédula tributaria
   * @param {string|null} estadoHacienda - Estado tributario ante Hacienda
   * @param {string|null} nivelRiesgo - Nivel de riesgo
   * @param {string} detalle_categoria - Detalle o especialidad (ej. "Suministros de oficina", "Hardware")
   * @param {number} flete - Monto fijo de flete o transporte (por defecto CRC 5000 según Reto 1)
   * @param {string} correo - Correo electrónico de contacto o notificación (Reto 3)
   * @param {string} email - Alias de compatibilidad
   */
  constructor(
    nombre,
    cedula,
    estadoHacienda = null,
    nivelRiesgo = null,
    detalle_categoria = 'Suministros de oficina',
    flete = 5000,
    correo = '',
    email = ''
  ) {
    super(nombre, cedula, estadoHacienda, nivelRiesgo, correo, email);
    this.categoria = 'Bienes';
    this.detalle_categoria = detalle_categoria || 'Suministros de oficina';
    this.flete = typeof flete === 'number' ? flete : 5000;
  }

  /**
   * Reto 1 - Polimorfismo: procesarPagoEspecifico
   * Sobrescribe el método de la clase padre Proveedor.
   * Suma un monto fijo de flete (ej. 5000) al monto base.
   * @param {number} montoBase - Monto bruto original
   * @returns {{ montoBase: number, categoria: string, detalle_categoria: string, porcentajeRetencion: number, retencion: number, flete: number, montoFinal: number, conceptoAjuste: string }}
   */
  procesarPagoEspecifico(montoBase) {
    const bruto = Number(montoBase) || 0;
    const fleteMonto = Number(this.flete) || 5000;
    const montoFinal = Number((bruto + fleteMonto).toFixed(2));

    return {
      montoBase: bruto,
      categoria: this.categoria,
      detalle_categoria: this.detalle_categoria,
      porcentajeRetencion: 0,
      retencion: 0,
      flete: fleteMonto,
      montoFinal,
      montoNeto: montoFinal,
      conceptoAjuste: `Flete y transporte (+CRC ${fleteMonto.toLocaleString('es-CR')})`
    };
  }

  /**
   * Alias de cálculo para mantener consistencia con interfaces de pago
   * @param {number} montoBruto
   */
  calcularMontoNeto(montoBruto) {
    const res = this.procesarPagoEspecifico(montoBruto);
    return {
      montoBruto: res.montoBase,
      porcentajeRetencion: 0,
      montoRetencion: 0,
      flete: res.flete,
      montoNeto: res.montoFinal
    };
  }

  /**
   * Genera simultáneamente la clave de pago y el payload del código QR.
   * @param {string} idPago - Identificador del pago
   * @param {number} montoNeto - Monto final liquidado
   * @param {string} fecha - Fecha del pago
   * @returns {{ clavePago: string, datosParaQR: string }}
   */
  generarComprobante(idPago, montoNeto, fecha = new Date().toISOString().split('T')[0]) {
    const clavePago = this.generarClavePago(idPago, fecha);
    const datosParaQR = this.generarPayloadQR(montoNeto, clavePago, fecha, this.detalle_categoria);
    return {
      clavePago,
      datosParaQR
    };
  }
}

module.exports = ProveedorBienes;
