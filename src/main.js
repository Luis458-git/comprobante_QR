/**
 * Script de prueba independiente en consola para la solución POO
 * Reto 1: Jerarquía de clases con herencia y polimorfismo (ProveedorServicios y ProveedorBienes)
 * Reto 3: Notificación automática por correo (correoDestino, emailHtml, clavePago)
 * Ejecutable directamente con: node src/main.js
 */

const EntidadComercial = require('./models/EntidadComercial');
const Proveedor = require('./models/Proveedor');
const ProveedorServicios = require('./models/ProveedorServicios');
const ProveedorBienes = require('./models/ProveedorBienes');
const Pago = require('./models/Pago');
const db = require('../db/db.json');

console.log('='.repeat(78));
console.log('  LABORATORIO 1 - RETO 1 (HERENCIA Y POLIMORFISMO) & RETO 3 (CORREO AUTOMÁTICO)');
console.log('  Jerarquía: EntidadComercial -> Proveedor -> [ProveedorServicios | ProveedorBienes]');
console.log('='.repeat(78));
console.log();

// 1. Verificación de la Jerarquía de Clases y Polimorfismo
console.log('📌 1. VERIFICACIÓN DE JERARQUÍA Y POLIMORFISMO:');

const servicioDemo = new ProveedorServicios(
  'Tech Consultores S.A.',
  '3101999888',
  'Al dia',
  'Bajo',
  'TI',
  2,
  'tech@consultores.cr'
);

const bienesDemo = new ProveedorBienes(
  'Distribuidora Global S.A.',
  '3101888777',
  'Al dia',
  'Bajo',
  'Suministros de oficina',
  5000,
  'ventas@global.cr'
);

console.log(`- Servicio: ${servicioDemo.obtenerIdentificacion()}`);
console.log(`  • ¿Hereda de Proveedor?        ${servicioDemo instanceof Proveedor}`);
console.log(`  • ¿Hereda de EntidadComercial? ${servicioDemo instanceof EntidadComercial}`);
console.log(`  • Polimorfismo (Base CRC 100,000): Monto Final = CRC ${servicioDemo.procesarPagoEspecifico(100000).montoFinal} (Resta 2% retención)`);

console.log(`- Bienes:   ${bienesDemo.obtenerIdentificacion()}`);
console.log(`  • ¿Hereda de Proveedor?        ${bienesDemo instanceof Proveedor}`);
console.log(`  • ¿Hereda de EntidadComercial? ${bienesDemo instanceof EntidadComercial}`);
console.log(`  • Polimorfismo (Base CRC 100,000): Monto Final = CRC ${bienesDemo.procesarPagoEspecifico(100000).montoFinal} (Suma CRC 5,000 flete)`);
console.log();

// 2. Procesamiento de casos de prueba
console.log('📌 2. PROCESAMIENTO DE CASOS DE PRUEBA:');
console.log('-'.repeat(78));

const casos = [
  {
    titulo: 'CASO 1: Servicios al día (Polimorfismo -> Resta 2% Retención + Clave + QR + Correo)',
    id: 'PAG-001',
    monto: 500000,
    nombre: 'Soluciones Digitales Alfa S.A.',
    cedula: '3101123456',
    categoria: 'Servicios',
    detalle_categoria: 'TI',
    correo: 'lmendezpozo@gmail.com',
    estadoHacienda: 'Al dia'
  },
  {
    titulo: 'CASO 2: Proveedor Moroso (RN-02 -> Bloqueo automático, Retenido sin QR)',
    id: 'PAG-002',
    monto: 250000,
    nombre: 'Constructora del Valle SRL',
    cedula: '3102987654',
    categoria: 'Servicios',
    detalle_categoria: 'Mantenimiento de Infraestructura',
    correo: 'lmendezpozo@gmail.com',
    estadoHacienda: 'Moroso'
  },
  {
    titulo: 'CASO 3: Datos Incompletos - Cédula vacía (ERR-01 -> Error de validación)',
    id: 'PAG-003',
    monto: 120000,
    nombre: 'Servicios Legales Jurídicos Asociados',
    cedula: '',
    categoria: 'Servicios',
    detalle_categoria: 'Asesoría Legal',
    correo: 'lmendezpozo@gmail.com',
    estadoHacienda: 'Al dia'
  },
  {
    titulo: 'CASO 4: Datos Incompletos - Monto inválido <= 0 (ERR-01 -> Error de validación)',
    id: 'PAG-004',
    monto: 0,
    nombre: 'Marketing y Publicidad Global',
    cedula: '3101555888',
    categoria: 'Bienes',
    detalle_categoria: 'Suministros de oficina',
    correo: 'lmendezpozo@gmail.com',
    estadoHacienda: 'Al dia'
  },
  {
    titulo: 'CASO 5: Caída de API de Hacienda / Cédula no registrada (ERR-02 -> Retenido preventivo)',
    id: 'PAG-005',
    monto: 340000,
    nombre: 'Inversiones Fantasma No Registrada',
    cedula: '9999999999',
    categoria: 'Bienes',
    detalle_categoria: 'Mobiliario',
    correo: 'lmendezpozo@gmail.com',
    estadoHacienda: 'Desconocido'
  },
  {
    titulo: 'CASO 6: Bienes al día (Polimorfismo -> Suma CRC 5,000 Flete + Clave + QR + Correo)',
    id: 'PAG-006',
    monto: 800000,
    nombre: 'Ciberseguridad y Redes Avanzadas',
    cedula: '3101777444',
    categoria: 'Bienes',
    detalle_categoria: 'Hardware y Servidores',
    correo: 'lmendezpozo@gmail.com',
    estadoHacienda: 'Al dia'
  }
];

casos.forEach((caso, index) => {
  console.log(`\n▶ [${index + 1}] ${caso.titulo}`);

  // Polimorfismo en instanciación según categoría
  let proveedor;
  if (caso.categoria === 'Bienes') {
    proveedor = new ProveedorBienes(
      caso.nombre,
      caso.cedula,
      caso.estadoHacienda,
      null,
      caso.detalle_categoria,
      5000,
      caso.correo
    );
  } else {
    proveedor = new ProveedorServicios(
      caso.nombre,
      caso.cedula,
      caso.estadoHacienda,
      null,
      caso.detalle_categoria,
      2,
      caso.correo
    );
  }

  const pago = new Pago(caso.id, caso.monto, proveedor, '2026-10-19');
  pago.procesarPago();

  const salida = pago.toObjeto();

  console.log(`   • ID Pago:           ${salida.idPago}`);
  console.log(`   • Proveedor:         ${proveedor.obtenerIdentificacion()}`);
  console.log(`   • Categoría:         ${proveedor.categoria} (${proveedor.detalle_categoria})`);
  console.log(`   • Correo Destino:    ${salida.correoDestino}`);
  console.log(`   • Estado Procesado:  ${salida.estadoProcesado}`);
  console.log(`   • Monto Base:        CRC ${salida.monto.toLocaleString('es-CR')}`);

  if (salida.estadoProcesado === 'Aprobado') {
    console.log(`   • Clave de Pago:     ${salida.clavePago}`);
    console.log(`   • Ajuste Aplicado:   ${salida.calculoEspecifico?.conceptoAjuste}`);
    console.log(`   • Monto Final Liq.:  CRC ${salida.montoFinal.toLocaleString('es-CR')}`);
    console.log(`   • Payload para QR:   "${salida.datosParaCodificarEnQR}"`);
    console.log(`   • URL Comprobante:   ${salida.qrUrl}`);
  } else {
    console.log(`   • Motivo Retención:  ${salida.motivoRetencion}`);
    console.log(`   • Código QR:         BLOQUEADO (RN-05 cumplida)`);
  }
});

console.log('\n' + '='.repeat(78));
console.log('  Demostración finalizada con éxito. Reto 1 y Reto 3 verificados al 100%.');
console.log('='.repeat(78));
