const SHEET_ID = "1IJZHo7J8SU1QxIn6K_6AWyuIAG1U-Q9rF6Q4mYmHUtY";
const FOLDER_ID = "1COIz7Pc2mYYZAomfM7gQstKwVzDdxbmf";
const SHEET_NAME = "Pembelian";
const ADMIN_PASSWORD = "heryani2026";
const HEADERS = [
  "id",
  "tarikh",
  "nama",
  "emel",
  "sekolah",
  "telefon",
  "itemIds",
  "items",
  "subtotal",
  "diskaun",
  "jumlah",
  "receiptUrl",
  "receiptName",
  "status",
  "notaAdmin",
];

function doPost(e) {
  return jsonResponse(handleRequest(e.parameter || {}));
}

function doGet(e) {
  return jsonResponse(handleRequest(e.parameter || {}));
}

function handleRequest(params) {
  try {
    const action = params.action || "read";
    const sheet = getOrCreateSheet();
    if (action === "create") return createRecord(sheet, params);
    if (action === "read") return readRecords(sheet, params);
    if (action === "update") return updateRecord(sheet, params);
    if (action === "delete") return deleteRecord(sheet, params);
    throw new Error("Action tidak sah.");
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    return sheet;
  }
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const existing = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const hasHeader = HEADERS.every((header, index) => existing[index] === header);
  if (!hasHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function createRecord(sheet, params) {
  requireFields(params, ["nama", "emel", "sekolah", "telefon", "items", "jumlah"]);
  const id = Utilities.getUuid();
  const receiptUrl = saveReceipt(params, id);
  const now = new Date();
  sheet.appendRow([
    id,
    now,
    params.nama,
    params.emel,
    params.sekolah,
    params.telefon,
    params.itemIds || "",
    params.items,
    Number(params.subtotal || params.jumlah || 0),
    Number(params.diskaun || 0),
    Number(params.jumlah || 0),
    receiptUrl,
    params.receiptName || "",
    "Baru",
    "",
  ]);
  sendConfirmationEmail(params, id, receiptUrl);
  return { success: true, message: "Rekod pembelian berjaya disimpan.", id, receiptUrl };
}

function readRecords(sheet, params) {
  requireAdmin(params);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { success: true, records: [] };
  const headers = values.shift();
  const records = values.map((row) => rowToObject(headers, row)).reverse();
  return { success: true, records };
}

function updateRecord(sheet, params) {
  requireAdmin(params);
  if (!params.id) throw new Error("ID rekod diperlukan.");
  const rowNumber = findRowById(sheet, params.id);
  if (rowNumber < 0) throw new Error("Rekod tidak dijumpai.");
  const map = headerMap(sheet);
  sheet.getRange(rowNumber, map.status + 1).setValue(params.status || "Baru");
  sheet.getRange(rowNumber, map.notaAdmin + 1).setValue(params.notaAdmin || "");
  return { success: true, message: "Rekod berjaya dikemas kini." };
}

function deleteRecord(sheet, params) {
  requireAdmin(params);
  if (!params.id) throw new Error("ID rekod diperlukan.");
  const rowNumber = findRowById(sheet, params.id);
  if (rowNumber < 0) throw new Error("Rekod tidak dijumpai.");
  sheet.deleteRow(rowNumber);
  return { success: true, message: "Rekod berjaya dipadam." };
}

function saveReceipt(params, id) {
  if (!params.receiptBase64) return "";
  const bytes = Utilities.base64Decode(params.receiptBase64);
  const mimeType = params.receiptMimeType || "application/octet-stream";
  const safeName = `${id}-${params.receiptName || "resit"}`.replace(/[^\w.\- ]+/g, "_");
  const blob = Utilities.newBlob(bytes, mimeType, safeName);
  const file = DriveApp.getFolderById(FOLDER_ID).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return `https://lh3.googleusercontent.com/d/${file.getId()}`;
}

function sendConfirmationEmail(params, id, receiptUrl) {
  const subject = "Pengesahan Pembelian Sistem Untuk Guru";
  const body =
    `Assalamualaikum/Salam sejahtera ${params.nama},\n\n` +
    "Terima kasih. Borang pembelian dan resit bayaran anda telah diterima.\n\n" +
    `ID Tempahan: ${id}\n` +
    `Item: ${params.items}\n` +
    `Subtotal: RM ${params.subtotal || params.jumlah}\n` +
    `Diskaun: RM ${params.diskaun || 0}\n` +
    `Jumlah: RM ${params.jumlah}\n` +
    `Resit: ${receiptUrl || "-"}\n\n` +
    "Sistem akan dihantar melalui emel yang didaftarkan dalam tempoh 1-3 hari.\n\n" +
    "Terima kasih,\nCikgu heryanimukhair";
  MailApp.sendEmail(params.emel, subject, body);
}

function requireAdmin(params) {
  if (params.adminPassword !== ADMIN_PASSWORD) {
    throw new Error("Kata laluan admin tidak sah.");
  }
}

function requireFields(params, fields) {
  fields.forEach((field) => {
    if (!params[field]) throw new Error(`Medan ${field} wajib diisi.`);
  });
}

function headerMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.reduce((map, header, index) => {
    map[header] = index;
    return map;
  }, {});
}

function findRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === id) return i + 1;
  }
  return -1;
}

function rowToObject(headers, row) {
  return headers.reduce((record, header, index) => {
    const value = row[index];
    record[header] = value instanceof Date ? Utilities.formatDate(value, "Asia/Kuala_Lumpur", "yyyy-MM-dd HH:mm") : value;
    return record;
  }, {});
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
