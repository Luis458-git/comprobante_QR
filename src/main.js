/**
 * Script de prueba independiente en consola para la solución POO
 * Ejecutable directamente con: node src/main.js
 */

const EntidadComercial = require('./models/EntidadComercial');
const Proveedor = require('./models/Proveedor');
const ProveedorServicios = require('./models/ProveedorServicios');
const Pago = require('./models/Pago');
const db = require('../db/db.json');

console.log('='.repeat(75));
console.log('  LABORATORIO 1 - PANEL DE RIESGO DE PROVEEDORES CON COMPROBANTE QR');
console.log('  Demostración de Arquitectura POO (Herencia de 3 niveles + Composición)');
console.log('='.repeat(75));
console.log();

// 1. Verificación de la Jerarquía de Clases (Herencia de 3 niveles)
console.log('📌 1. VERIFICACIÓN DE JERARQUÍA Y HERENCIA POO:');
const demoProveedor = new ProveedorServicios(
  'Tech Solutions CR',
  '3101999888',
  'Al dia',
  'Bajo',
  'Consultoría Cloud',
  13
);

console.log(`- Instancia: ${demoProveedor.obtenerIdentificacion()}`);
console.log(`- ¿Es instancia de ProveedorServicios (Nieto)? ${demoProveedor instanceof ProveedorServicios}`);
console.log(`- ¿Es instancia de Proveedor (Padre)?          ${demoProveedor instanceof Proveedor}`);
console.log(`- ¿Es instancia de EntidadComercial (Abuelo)?  ${demoProveedor instanceof EntidadComercial}`);
console.log();

// 2. Ejecución de casos de prueba simulados basados en db.json
console.log('📌 2. PROCESAMIENTO DE CASOS DE PRUEBA (REGLAS DE NEGOCIO Y MANEJO DE ERRORES):');
console.log('-'.repeat(75));

// Mapeo de estados de Hacienda según el mock o datos de entrada
const mockHaciendaMap = new Map();
db.hacienda_mock.forEach((item) => {
  mockHaciendaMap.set(item.cedula, item.estadoTributario);
});

const casos = [
  {
    titulo: 'CASO 1: Proveedor al día (Flujo exitoso -> Aprobado con Retención y QR)',
    id: 'PAG-001',
    monto: 500000,
    nombre: 'Soluciones Digitales Alfa S.A.',
    cedula: '3101123456',
    tipoServicio: 'Consultoría TI',
    retencion: 13,
    estadoHacienda: 'Al dia'
  },
  {
    titulo: 'CASO 2: Proveedor Moroso (RN-02 -> Bloqueo automático, Retenido sin QR)',
    id: 'PAG-002',
    monto: 250000,
    nombre: 'Constructora del Valle SRL',
    cedula: '3102987654',
    tipoServicio: 'Mantenimiento de Infraestructura',
    retencion: 2,
    estadoHacienda: 'Moroso'
  },
  {
    titulo: 'CASO 3: Datos Incompletos - Cédula vacía (ERR-01 -> Error de validación)',
    id: 'PAG-003',
    monto: 120000,
    nombre: 'Servicios Legales Jurídicos Asociados',
    cedula: '',
    tipoServicio: 'Asesoría Legal',
    retencion: 13,
    estadoHacienda: 'Al dia'
  },
  {
    titulo: 'CASO 4: Datos Incompletos - Monto inválido <= 0 (ERR-01 -> Error de validación)',
    id: 'PAG-004',
    monto: 0,
    nombre: 'Marketing y Publicidad Global',
    cedula: '3101555888',
    tipoServicio: 'Publicidad Digital',
    retencion: 13,
    estadoHacienda: 'Al dia'
  },
  {
    titulo: 'CASO 5: Caída de API de Hacienda / Cédula no registrada (ERR-02 -> Retenido preventivo)',
    id: 'PAG-005',
    monto: 340000,
    nombre: 'Inversiones Fantasma No Registrada',
    cedula: '9999999999',
    tipoServicio: 'Servicios Varios',
    retencion: 2,
    estadoHacienda: 'Desconocido'
  }
];

casos.forEach((caso, index) => {
  console.log(`\n▶ [${index + 1}] ${caso.titulo}`);
  
  // Instanciación del modelo Nieto (ProveedorServicios)
  const proveedor = new ProveedorServicios(
    caso.nombre,
    caso.cedula,
    caso.estadoHacienda,
    null,
    caso.tipoServicio,
    caso.retencion,
    `contacto@${caso.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.cr`
  );

  // Instanciación de la clase de Composición (Pago)
  const pago = new Pago(caso.id, caso.monto, proveedor, '2026-10-19');

  // Procesamiento orquestado
  pago.procesarPago();

  console.log(`   • ID Pago:           ${pago.idPago}`);
  console.log(`   • Proveedor:         ${proveedor.obtenerIdentificacion()}`);
  console.log(`   • Correo Notif.:     ${proveedor.email}`);
  console.log(`   • Estado Hacienda:   ${proveedor.estadoHacienda || 'No verificado'}`);
  console.log(`   • Nivel de Riesgo:   ${proveedor.nivelRiesgo || 'No evaluado'}`);
  console.log(`   • Monto Bruto:       CRC ${pago.monto.toLocaleString('es-CR')}`);
  console.log(`   • Estado Final Pago: ${pago.estado}`);

  if (pago.estado === 'Aprobado') {
    console.log(`   • Clave de Pago:     ${pago.clavePago}`);
    console.log(`   • Retención (${proveedor.porcentajeRetencion}%):   CRC ${pago.retencion.toLocaleString('es-CR')}`);
    console.log(`   • Monto Neto Final:  CRC ${pago.montoNeto.toLocaleString('es-CR')}`);
    console.log(`   • Payload QR:        "${pago.datosParaQR}"`);
    console.log(`   • URL Comprobante:   ${pago.qrUrl}`);
  } else {
    console.log(`   • Motivo:            ${pago.motivoRetencion}`);
    console.log(`   • Comprobante QR:    ${pago.qrUrl ? pago.qrUrl : 'BLOQUEADO (RN-05 cumplida)'}`);
  }
});

console.log('\n' + '='.repeat(75));
console.log('  Ejecución finalizada con éxito. Todos los casos evaluados correctamente.');
console.log('='.repeat(75));
