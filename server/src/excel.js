const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const DETAIL_HEADERS = [
  'Fecha',
  'Venta ID',
  'Cliente',
  'Teléfono',
  'Producto',
  'Cantidad',
  'Precio unitario (Bs.)',
  'Subtotal línea (Bs.)',
  'Total venta (Bs.)',
];

const LEDGER_HEADERS = ['Fecha', 'Cliente', 'Teléfono', 'Compró', 'Total (Bs.)'];

function getExcelPath() {
  if (process.env.VERCEL) {
    return '/tmp/ventas.xlsx';
  }
  const configured = process.env.EXCEL_PATH || './data/ventas.xlsx';
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
}

async function ensureWorkbook(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
    return workbook;
  }

  const ledger = workbook.addWorksheet('Registro');
  ledger.addRow(LEDGER_HEADERS);
  ledger.getRow(1).font = { bold: true };

  const detail = workbook.addWorksheet('Detalle');
  detail.addRow(DETAIL_HEADERS);
  detail.getRow(1).font = { bold: true };

  await workbook.xlsx.writeFile(filePath);
  return workbook;
}

function getOrCreateSheet(workbook, name, headers) {
  let sheet = workbook.getWorksheet(name);
  if (!sheet) {
    sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
  }
  return sheet;
}

async function appendSaleToExcel({ sale, clientName, clientPhone, items }) {
  const filePath = getExcelPath();
  const workbook = await ensureWorkbook(filePath);

  const itemsSummary = items
    .map((item) => `${item.product_name} × ${item.quantity}`)
    .join(', ');

  const ledger = getOrCreateSheet(workbook, 'Registro', LEDGER_HEADERS);
  ledger.addRow([
    sale.sale_date,
    clientName || 'Mostrador',
    clientPhone || '—',
    itemsSummary,
    Number(sale.total),
  ]);

  const detail = getOrCreateSheet(workbook, 'Detalle', DETAIL_HEADERS);
  for (const item of items) {
    detail.addRow([
      sale.sale_date,
      sale.id,
      clientName || 'Mostrador',
      clientPhone || '—',
      item.product_name,
      item.quantity,
      Number(item.unit_price),
      Number(item.line_total),
      Number(sale.total),
    ]);
  }

  await workbook.xlsx.writeFile(filePath);
}

module.exports = { appendSaleToExcel, getExcelPath };
