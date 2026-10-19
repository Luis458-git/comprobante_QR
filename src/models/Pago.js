const ProveedorServicios = require('./ProveedorServicios');

/**
 * Clase de Proceso / Composición: Pago
 * Contiene y orquesta el procesamiento del pago a un ProveedorServicios,
 * validando datos de entrada, riesgo tributario, emisión de Clave de Pago y QR.
 */
class Pago {
  /**
   * @param {string} idPago - Identificador único del pago (ej. "PAG-001")
   * @param {number} monto - Monto bruto a pagar
   * @param {ProveedorServicios} proveedor - Instancia de ProveedorServicios (Composición)
   * @param {string} fecha - Fecha del pago (YYYY-MM-DD)
   * @param {string} estado - Estado inicial del pago (por defecto "Pendiente")
   */
  constructor(idPago, monto, proveedor, fecha = new Date().toISOString().split('T')[0], estado = 'Pendiente') {
    this.idPago = idPago;
    this.monto = Number(monto);
    this.proveedor = proveedor;
    this.fecha = fecha;
    this.estado = estado;
    this.montoNeto = null;
    this.retencion = null;
    this.clavePago = null;
    this.datosParaQR = null;
    this.qrUrl = null;
    this.motivoRetencion = null;
  }

  /**
   * Orquesta todo el flujo del pago aplicando reglas de negocio y excepciones.
   * RN-01: Validación tributaria obligatoria ante Hacienda
   * RN-02: Bloqueo automático por morosidad
   * RN-03: Cálculo de retención
   * RN-04: Generación obligatoria de comprobante (clavePago y QR) para pagos aprobados
   * RN-05: Restricción absoluta de comprobante en pagos retenidos o con error
   * ERR-01: Validación de datos incompletos de origen
   * ERR-02: Manejo de caída del servicio de Hacienda
   * @returns {Pago} Retorna la misma instancia procesada con los estados finales
   */
  procesarPago() {
    // ERR-01: Datos incompletos de origen (cédula vacía/nula o monto <= 0)
    if (!this.proveedor || !this.proveedor.cedula || this.proveedor.cedula.toString().trim() === '') {
      this.estado = 'Error de validacion';
      this.motivoRetencion = 'Datos incompletos de origen: Cédula del proveedor faltante o nula.';
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      return this;
    }

    if (isNaN(this.monto) || this.monto <= 0) {
      this.estado = 'Error de validacion';
      this.motivoRetencion = `Datos incompletos de origen: El monto (${this.monto}) debe ser estrictamente mayor a 0.`;
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      return this;
    }

    // ERR-02: Caída del servicio externo o Cédula no encontrada en Hacienda
    if (this.proveedor.estadoHacienda === 'Desconocido') {
      this.estado = 'Retenido';
      this.motivoRetencion = 'Error de conexión con Hacienda - Revisión manual';
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      return this;
    }

    // RN-01: Validación tributaria obligatoria
    if (!this.proveedor.estadoHacienda || this.proveedor.estadoHacienda.trim() === '') {
      this.estado = 'Retenido';
      this.motivoRetencion = 'Validación tributaria obligatoria: El proveedor no cuenta con verificación de Hacienda.';
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      return this;
    }

    // RN-02: Evaluación del riesgo tributario mediante el método del proveedor
    const evaluacionRiesgo = this.proveedor.evaluarRiesgo();

    if (evaluacionRiesgo.esRiesgoso) {
      this.estado = 'Retenido';
      this.motivoRetencion = evaluacionRiesgo.motivo;
      // RN-05: Restricción absoluta de comprobante en pagos retenidos
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      return this;
    }

    // Si no es riesgoso, se procede con la APROBACIÓN
    this.estado = 'Aprobado';
    this.motivoRetencion = null;

    // RN-03: Cálculo de retención por servicio
    const desglose = this.proveedor.calcularMontoNeto(this.monto);
    this.montoNeto = desglose.montoNeto;
    this.retencion = desglose.montoRetencion;

    // RN-04: Generación de comprobante dual (Clave de Pago única + Payload QR)
    const comprobante = this.proveedor.generarComprobante(this.idPago, this.montoNeto, this.fecha);
    this.clavePago = comprobante.clavePago;
    this.datosParaQR = comprobante.datosParaQR;
    this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(this.datosParaQR)}`;

    return this;
  }

  /**
   * Serializa el estado del pago a un objeto compatible con JSON Server y n8n
   * @returns {object}
   */
  toObjeto() {
    return {
      id: this.idPago,
      idPago: this.idPago,
      fecha: this.fecha,
      monto: this.monto,
      estado: this.estado,
      montoNeto: this.montoNeto,
      retencion: this.retencion,
      clavePago: this.clavePago,
      motivoRetencion: this.motivoRetencion,
      datosParaQR: this.datosParaQR,
      qrUrl: this.qrUrl,
      proveedor: {
        nombre: this.proveedor.nombre,
        cedula: this.proveedor.cedula,
        email: this.proveedor.email,
        tipoServicio: this.proveedor.tipoServicio,
        porcentajeRetencion: this.proveedor.porcentajeRetencion,
        estadoHacienda: this.proveedor.estadoHacienda,
        nivelRiesgo: this.proveedor.nivelRiesgo
      }
    };
  }
}

module.exports = Pago;
