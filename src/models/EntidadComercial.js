/**
 * Clase Abuelo: EntidadComercial
 * Representa la entidad base comercial (persona física o jurídica).
 */
class EntidadComercial {
  /**
   * @param {string} nombre - Nombre o razón social
   * @param {string} cedula - Número de identificación o cédula jurídica/física
   * @param {string} email - Correo electrónico de contacto o notificación
   */
  constructor(nombre, cedula, email = '') {
    this.nombre = nombre || '';
    this.cedula = cedula || '';
    this.email = email || '';
  }

  /**
   * Formatea y valida la identidad básica de cualquier persona o empresa registrada.
   * @returns {string} Identificación formateada
   */
  obtenerIdentificacion() {
    if (!this.cedula || !this.cedula.trim()) {
      return `${this.nombre || 'Entidad sin nombre'} [SIN CÉDULA REGISTRADA]`;
    }
    const correoInfo = this.email ? ` <${this.email}>` : '';
    return `${this.nombre} (ID: ${this.cedula.trim()})${correoInfo}`;
  }

  /**
   * Valida si la entidad cuenta con una cédula válida no vacía
   * @returns {boolean}
   */
  esIdentificacionValida() {
    return Boolean(this.cedula && this.cedula.toString().trim().length > 0);
  }
}

module.exports = EntidadComercial;
