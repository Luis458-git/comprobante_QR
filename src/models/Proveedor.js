const EntidadComercial = require('./EntidadComercial');

/**
 * Clase Padre: Proveedor
 * Hereda de EntidadComercial e incorpora el estado ante Hacienda y la evaluación de riesgo financiero.
 */
class Proveedor extends EntidadComercial {
  /**
   * @param {string} nombre - Nombre del proveedor
   * @param {string} cedula - Cédula tributaria del proveedor
   * @param {string|null} estadoHacienda - Estado tributario ("Al dia", "Moroso", "Desconocido")
   * @param {string|null} nivelRiesgo - Nivel de riesgo asignado ("Bajo", "Alto", etc.)
   * @param {string} correo - Correo electrónico del proveedor (Reto 3)
   * @param {string} email - Alias de compatibilidad
   */
  constructor(nombre, cedula, estadoHacienda = null, nivelRiesgo = null, correo = '', email = '') {
    super(nombre, cedula, correo, email);
    this.estadoHacienda = estadoHacienda;
    this.nivelRiesgo = nivelRiesgo;
  }

  /**
   * Reto 1 - Método Base Polimórfico: procesarPagoEspecifico
   * Define la firma para el cálculo polimórfico del monto final según el tipo de proveedor.
   * Las subclases (ProveedorServicios y ProveedorBienes) deben sobrescribir este método.
   * @param {number} montoBase - Monto bruto original
   * @returns {{ montoBase: number, montoFinal: number, conceptoAjuste: string }}
   */
  procesarPagoEspecifico(montoBase) {
    throw new Error('El método procesarPagoEspecifico(montoBase) debe ser implementado por la subclase especializada.');
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
   * Genera la cadena de texto estandarizada (inmutable) para codificar en el código QR.
   * @param {number} montoFinal - Monto final liquidado tras polimorfismo
   * @param {string} clavePago - Clave única de referencia
   * @param {string} fecha - Fecha de la transacción
   * @param {string} detalle - Descripción o detalle de la categoría
   * @returns {string} Payload inmutable para el QR
   */
  generarPayloadQR(montoFinal, clavePago, fecha = new Date().toISOString().split('T')[0], detalle = '') {
    const ref = clavePago || this.generarClavePago('000', fecha);
    const desc = detalle || 'Transacción Comercial';
    return `CLAVE: ${ref} | PROVEEDOR: ${this.nombre} | CEDULA: ${this.cedula} | MONTO_NETO: CRC ${Number(montoFinal).toFixed(2)} | FECHA: ${fecha} | CONCEPTO: ${desc}`;
  }

  /**
   * Evalúa el riesgo financiero del proveedor según su estado ante Hacienda.
   * Aplica RN-01 (Validación obligatoria), RN-02 (Bloqueo por morosidad) y ERR-02 (Servicio caído / Desconocido).
   * @returns {{ esRiesgoso: boolean, nivelRiesgo: string, motivo: string }}
   */
  evaluarRiesgo() {
    // ERR-02: Caída de servicio externo o cédula no encontrada en Hacienda
    if (this.estadoHacienda === 'Desconocido') {
      this.nivelRiesgo = 'Alto';
      return {
        esRiesgoso: true,
        nivelRiesgo: this.nivelRiesgo,
        motivo: 'Error de conexión con Hacienda - Revisión manual'
      };
    }

    // RN-01: Validación tributaria obligatoria
    if (!this.estadoHacienda || this.estadoHacienda.trim() === '') {
      this.nivelRiesgo = 'Alto';
      return {
        esRiesgoso: true,
        nivelRiesgo: this.nivelRiesgo,
        motivo: 'Validación tributaria obligatoria pendiente ante Hacienda'
      };
    }

    // RN-02: Bloqueo automático por morosidad
    const estadoNormalizado = this.estadoHacienda.trim().toLowerCase();
    if (estadoNormalizado === 'moroso') {
      this.nivelRiesgo = 'Alto';
      return {
        esRiesgoso: true,
        nivelRiesgo: this.nivelRiesgo,
        motivo: 'Proveedor figura como Moroso ante el Ministerio de Hacienda'
      };
    }

    if (estadoNormalizado === 'al dia' || estadoNormalizado === 'al día') {
      this.nivelRiesgo = 'Bajo';
      return {
        esRiesgoso: false,
        nivelRiesgo: this.nivelRiesgo,
        motivo: 'Proveedor al día con obligaciones tributarias'
      };
    }

    // Cualquier otro estado desconocido o no reconocido
    this.nivelRiesgo = 'Alto';
    return {
      esRiesgoso: true,
      nivelRiesgo: this.nivelRiesgo,
      motivo: `Estado tributario no concluyente (${this.estadoHacienda}) - Requiere revisión manual`
    };
  }
}

module.exports = Proveedor;
