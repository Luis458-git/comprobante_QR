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
   * @param {string} email - Correo electrónico del proveedor
   */
  constructor(nombre, cedula, estadoHacienda = null, nivelRiesgo = null, email = '') {
    super(nombre, cedula, email);
    this.estadoHacienda = estadoHacienda;
    this.nivelRiesgo = nivelRiesgo;
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
