import * as XLSX from 'xlsx';

// Definir las columnas de la plantilla
const headers = [
  "CodigoBodega",      // Ej: BOD-MGA
  "CodigoArticulo",    // Ej: UNI-CAM
  "Tipo",              // ROPA, EPP, MEDICAMENTO
  "NombreArticulo",    // Ej: Camisa Uniforme Claro
  "Talla",             // Ej: M, L, XL, S, UNI
  "Sexo",              // F, M, N (Neutral)
  "Cantidad",          // Cantidad a ingresar
  "CostoUnitario",     // Precio unitario (opcional)
  "Lote",              // Solo para medicamentos (opcional)
  "FechaVencimiento"   // YYYY-MM-DD, solo para medicamentos
];

// Datos de ejemplo explicativos
const ejemplos = [
  ["BOD-MGA", "UNI-CAM", "ROPA", "Camisa Polo Operativa", "M", "F", 50, 12.50, "", ""],
  ["BOD-MGA", "UNI-PAN", "ROPA", "Pantalón Operativo", "L", "M", 30, 15.00, "", ""],
  ["BOD-MGA", "EPP-BOT", "EPP", "Botas de Seguridad", "42", "N", 20, 45.00, "", ""],
  ["BOD-GUA", "MED-PAR", "MEDICAMENTO", "Paracetamol 500mg", "UNI", "N", 500, 0.50, "LOTE-2024A", "2026-12-31"]
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...ejemplos]);

// Ajustar el ancho de las columnas para que se vea ordenado en Excel
ws['!cols'] = [
  { wch: 15 }, // CodigoBodega
  { wch: 15 }, // CodigoArticulo
  { wch: 15 }, // Tipo
  { wch: 30 }, // NombreArticulo
  { wch: 10 }, // Talla
  { wch: 10 }, // Sexo
  { wch: 10 }, // Cantidad
  { wch: 15 }, // CostoUnitario
  { wch: 15 }, // Lote
  { wch: 20 }, // FechaVencimiento
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Importar_Stock");

// Escribir el archivo en la raíz del proyecto
XLSX.writeFile(wb, "../Plantilla_Importacion_Inventario.xlsx");
console.log("Plantilla de Excel generada exitosamente en la raíz del proyecto.");
