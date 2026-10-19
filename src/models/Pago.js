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
    this.emailHtml = null;
    this.motivoRetencion = null;
  }

  /**
   * Genera la plantilla HTML premium y profesional del comprobante de pago para correo.
   * Interpola directamente los valores reales para evitar etiquetas sin evaluar.
   * @returns {string} Plantilla HTML completamente renderizada
   */
  generarEmailHtml() {
    if (this.estado !== 'Aprobado') {
      return '';
    }

    const montoBrutoFmt = Number(this.monto).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const retencionFmt = Number(this.retencion).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const montoNetoFmt = Number(this.montoNeto).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Pago Aprobado</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
    
    <!-- ENCABEZADO ELEGANTE -->
    <tr>
      <td style="padding: 32px 28px 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
        <div style="display: inline-block; padding: 6px 14px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 20px; margin-bottom: 12px;">
          <span style="color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">✔ PAGO APROBADO &amp; VERIFICADO</span>
        </div>
        <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Comprobante Oficial de Pago</h1>
        <p style="margin: 0; font-size: 13px; color: #94a3b8;">Sistema de Liquidación y Panel de Riesgo con Código QR</p>
      </td>
    </tr>

    <!-- CONTENIDO DEL COMPROBANTE -->
    <tr>
      <td style="padding: 28px 28px 20px;">

        <p style="margin: 0 0 12px; font-size: 15px; color: #334155;">
          Estimado(a) <strong style="color: #0f172a;">${this.proveedor.nombre}</strong>,
        </p>
        <p style="margin: 0 0 20px; font-size: 13px; color: #64748b; line-height: 1.5;">
          Le confirmamos que su orden de pago ha sido aprobada y liquidada de conformidad con las disposiciones tributarias vigentes ante el Ministerio de Hacienda (Estado: <strong style="color: #059669;">Al día</strong>).
        </p>

        <!-- TARJETA CLAVE DE PAGO EN GRANDE -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; border-radius: 8px; padding: 18px 16px; text-align: center; margin: 20px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            🔑 CLAVE DE PAGO ÚNICA DE AUDITORÍA
          </div>
          <div style="font-size: 24px; font-weight: 900; font-family: 'Courier New', monospace; color: #0f172a; letter-spacing: 2px;">
            ${this.clavePago}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Referencia inmutable de auditoría</div>
        </div>

        <!-- TABLA DE DETALLES Y RETENCIONES -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin: 20px 0; overflow: hidden;">
          <tr>
            <td colspan="2" style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <strong style="font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.8px;">Detalles de la Transacción</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">ID del Pago:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${this.idPago}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Identificación / Cédula:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${this.proveedor.cedula}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Servicio Prestado:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${this.proveedor.tipoServicio}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Fecha de Aplicación:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${this.fecha}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Monto Bruto:</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #334155; text-align: right; border-bottom: 1px solid #f1f5f9;">CRC ${montoBrutoFmt}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-size: 13px; color: #e11d48; border-bottom: 1px solid #e2e8f0;">Retención Fiscal (${this.proveedor.porcentajeRetencion}%):</td>
            <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #e11d48; text-align: right; border-bottom: 1px solid #e2e8f0;">- CRC ${retencionFmt}</td>
          </tr>
          <tr style="background: #f0fdf4;">
            <td style="padding: 14px 16px; font-size: 14px; font-weight: 700; color: #166534;">Monto Líquido a Pagar:</td>
            <td style="padding: 14px 16px; font-size: 18px; font-weight: 900; color: #166534; text-align: right;">CRC ${montoNetoFmt}</td>
          </tr>
        </table>

        <!-- SECCIÓN CÓDIGO QR VISUAL -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
            Código QR de Verificación Inmutable
          </div>
          <p style="margin: 0 0 14px; font-size: 12px; color: #64748b;">
            Escanee con su teléfono o haga clic abajo para descargar su comprobante
          </p>

          <div style="display: inline-block; padding: 10px; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <img src="${this.qrUrl}" alt="Código QR del Pago" width="200" height="200" style="display: block; margin: 0 auto; border: none;" />
          </div>

          <div style="margin-top: 18px;">
            <a href="${this.qrUrl}" target="_blank" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 13px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);">
              📥 Descargar / Guardar Comprobante QR
            </a>
          </div>

          <div style="margin-top: 14px; font-size: 11px; color: #64748b; font-family: monospace; background: #ffffff; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; word-break: break-all; text-align: left;">
            <strong style="color: #475569;">Payload auditado:</strong> ${this.datosParaQR}
          </div>
        </div>

        <p style="margin: 20px 0 0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.4;">
          🔒 Este comprobante digital es generado automáticamente por el Panel de Riesgo con validación ante el Ministerio de Hacienda y no requiere firma física.
        </p>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        © 2026 Panel de Riesgo de Proveedores - Laboratorio 1 (POO + n8n)
      </td>
    </tr>

  </table>

</body>
</html>`;
  }

  /**
   * Orquesta todo el flujo del pago aplicando reglas de negocio y excepciones.
   * RN-01: Validación tributaria obligatoria
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
      this.emailHtml = null;
      return this;
    }

    if (isNaN(this.monto) || this.monto <= 0) {
      this.estado = 'Error de validacion';
      this.motivoRetencion = `Datos incompletos de origen: El monto (${this.monto}) debe ser estrictamente mayor a 0.`;
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      this.emailHtml = null;
      return this;
    }

    // ERR-02: Caída del servicio externo o Cédula no encontrada en Hacienda
    if (this.proveedor.estadoHacienda === 'Desconocido') {
      this.estado = 'Retenido';
      this.motivoRetencion = 'Error de conexión con Hacienda - Revisión manual';
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      this.emailHtml = null;
      return this;
    }

    // RN-01: Validación tributaria obligatoria
    if (!this.proveedor.estadoHacienda || this.proveedor.estadoHacienda.trim() === '') {
      this.estado = 'Retenido';
      this.motivoRetencion = 'Validación tributaria obligatoria: El proveedor no cuenta con verificación de Hacienda.';
      this.clavePago = null;
      this.datosParaQR = null;
      this.qrUrl = null;
      this.emailHtml = null;
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
      this.emailHtml = null;
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

    // Renderiza la plantilla HTML directamente con los datos computados
    this.emailHtml = this.generarEmailHtml();

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
      emailHtml: this.emailHtml,
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
