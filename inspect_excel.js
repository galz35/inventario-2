const XLSX = require('xlsx');

const workbook = XLSX.readFile('d:/inventario rrhh/empleado.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log("Headers:", Object.keys(data[0]));
console.log("First 2 rows:", JSON.stringify(data.slice(0, 2), null, 2));
console.log("Total rows:", data.length);

const emp2024 = data.filter(row => {
    // Check if any column contains 'emp2024' or similar if needed
    // The user said "registro empleado de emp2024"
    // I'll check if there's a column for year or if 'emp2024' is part of an ID
    return JSON.stringify(row).includes('emp2024') || JSON.stringify(row).includes('EMP2024');
});

console.log("Rows matching 'emp2024':", emp2024.length);
if (emp2024.length > 0) {
    console.log("First matching row:", JSON.stringify(emp2024[0], null, 2));
}
