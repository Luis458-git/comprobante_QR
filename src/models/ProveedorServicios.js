const Proveedor = require('./Proveedor');

/**
 * Clase Hija: ProveedorServicios
 * Reto 1: Herencia de Proveedor y aplicación de Polimorfismo.
 * Especializada en proveedores de la categoría "Servicios" (ej. TI, consultoría, soporte).
 * Sobrescribe procesarPagoEspecifico() deduciendo un 2% de retención fiscal al monto base.
 */
class ProveedorServicios extends Proveedor {
  /**
   * @param {string} nombre - Nombre del proveedor
   * @param {string} cedula - Cédula tributaria
   * @param {string|null} estadoHacienda - Estado tributario ante Hacienda
   * @param {string|null} nivelRiesgo - Nivel de riesgo
   * @param {string} detalle_categoria - Detalle o especialidad (ej. "TI", "Consultoría")
   * @param {number} porcentajeRetencion - Porcentaje de retención (por defecto 2% según Reto 1)
   * @param {string} correo - Correo electrónico de contacto o notificación (Reto 3)
   * @param {string} email - Alias de compatibilidad
   */
  constructor(
    nombre,
    cedula,
    estadoHacienda = null,
    nivelRiesgo = null,
    detalle_categoria = 'TI',
    porcentajeRetencion = 2,
    correo = '',
    email = ''
  ) {
    super(nombre, cedula, estadoHacienda, nivelRiesgo, correo, email);
    this.categoria = 'Servicios';
    this.detalle_categoria = detalle_categoria || 'Servicios Profesionales';
    this.tipoServicio = this.detalle_categoria; // Compatibilidad
    this.porcentajeRetencion = typeof porcentajeRetencion === 'number' ? porcentajeRetencion : 2;
  }

  /**
   * Reto 1 - Polimorfismo: procesarPagoEspecifico
   * Sobrescribe el método de la clase padre Proveedor.
   * Resta un 2% de retención de impuestos al monto base.
   * @param {number} montoBase - Monto bruto antes de deducciones
   * @returns {{ montoBase: number, categoria: string, detalle_categoria: string, porcentajeRetencion: number, retencion: number, flete: number, montoFinal: number, conceptoAjuste: string }}
   */
  procesarPagoEspecifico(montoBase) {
    const bruto = Number(montoBase) || 0;
    const factor = this.porcentajeRetencion > 1 ? this.porcentajeRetencion / 100 : this.porcentajeRetencion;
    const retencion = Number((bruto * factor).toFixed(2));
    const montoFinal = Number((bruto - retencion).toFixed(2));

    return {
      montoBase: bruto,
      categoria: this.categoria,
      detalle_categoria: this.detalle_categoria,
      porcentajeRetencion: this.porcentajeRetencion,
      retencion,
      flete: 0,
      montoFinal,
      montoNeto: montoFinal,
      conceptoAjuste: `Retención fiscal (${this.porcentajeRetencion}%)`
    };
  }

  /**
   * Alias de compatibilidad con código previo
   * @param {number} montoBruto
   */
  calcularMontoNeto(montoBruto) {
    const res = this.procesarPagoEspecifico(montoBruto);
    return {
      montoBruto: res.montoBase,
      porcentajeRetencion: res.porcentajeRetencion,
      montoRetencion: res.retencion,
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

module.exports = ProveedorServicios;
