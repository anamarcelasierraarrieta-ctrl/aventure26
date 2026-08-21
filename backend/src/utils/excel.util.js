const ExcelJS = require("exceljs");

/**
 * Genera un .xlsx en memoria y lo envía como descarga.
 * @param {import('express').Response} res
 * @param {string} filename  sin extensión
 * @param {{header:string, key:string, width?:number, money?:boolean}[]} columns
 * @param {object[]} rows
 */
async function sendExcel(res, filename, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aventure 26";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Reporte", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD4AF37" }, // dorado Aventure 26
  };

  rows.forEach((row) => sheet.addRow(row));

  columns.forEach((c, idx) => {
    if (c.money) {
      sheet.getColumn(idx + 1).numFmt = '"$"#,##0.00';
    }
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { sendExcel };
