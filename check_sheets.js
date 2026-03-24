const XLSX = require('xlsx');
const workbook = XLSX.readFile('d:/inventario rrhh/empleado.xlsx');
console.log("Sheet names:", workbook.SheetNames);
